import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { enqueueQuoteProvisioning, processQuoteProvisioning, provisionQuoteRenewal } from "@/lib/quotes/provisioning"
import { orchestrateQuoteAfterSetup } from "@/lib/quotes/stripe-orchestration"
import { notifyQuotePaid } from "@/lib/quotes/payment-confirmed"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  const isProd = process.env.NODE_ENV === "production"
  const webhookSecret = process.env.STRIPE_QUOTES_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET

  if (isProd && !webhookSecret) {
    console.error("[quotes] Stripe webhook secret missing in production")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }
  if (!signature && webhookSecret) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(body, signature!, webhookSecret)
      : JSON.parse(body) as Stripe.Event
  } catch (err: any) {
    console.error("[quotes] Stripe webhook signature error:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("sales_channel_quote_stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ received: true, deduped: true })

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const quoteId = session.metadata?.quote_id

      if (quoteId && (session.metadata?.type === "sales_channel_quote" || session.metadata?.type === "sales_channel_quote_setup")) {
        const { data: currentQuote, error: quoteError } = await supabase
          .from("sales_channel_quotes")
          .select("*")
          .eq("id", quoteId)
          .single<SalesChannelQuote>()
        if (quoteError || !currentQuote) throw quoteError || new Error("Preventivo non trovato")

        if (currentQuote.payment_status !== "paid") {
          let stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id
          let stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id

          if (session.mode === "setup" && session.metadata?.type === "sales_channel_quote_setup") {
            const result = await orchestrateQuoteAfterSetup({ stripe, quote: currentQuote, session })
            stripeCustomerId = result.customerId
            stripeSubscriptionId = result.subscriptionIds.join(",") || undefined
          } else if (session.mode === "payment" && session.payment_status !== "paid") {
            throw new Error(`Checkout payment non completato (${session.payment_status})`)
          }

          const { data: quote, error: updateError } = await supabase
            .from("sales_channel_quotes")
            .update({
              payment_status: "paid",
              status: "paid",
              stripe_session_id: session.id,
              stripe_customer_id: stripeCustomerId ?? null,
              stripe_subscription_id: stripeSubscriptionId ?? null,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", quoteId)
            .select("*")
            .single()
          if (updateError) throw updateError

          await enqueueQuoteProvisioning(quote as SalesChannelQuote)
          await processQuoteProvisioning(quoteId)

          // Conferma al cliente (con le call di avvio) e avviso al superadmin.
          // Non deve far fallire il webhook: se salta l'email, il pagamento
          // resta comunque registrato e Stripe non deve riprovare all'infinito.
          try {
            await notifyQuotePaid(supabase, quote as SalesChannelQuote)
          } catch (notifyError) {
            console.error("[quotes] notify paid error:", notifyError)
          }
        }
      }
    } else if (event.type === "invoice.paid") {
      // RINNOVO dell'abbonamento: ri-accredita i crediti inclusi ricorrenti.
      // Solo "subscription_cycle" e' un rinnovo vero; "subscription_create" e'
      // la prima fattura, gia' coperta dall'attivazione (checkout.session.completed).
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.billing_reason === "subscription_cycle") {
        // In Stripe 20.x il subscription id vive sotto invoice.parent, non piu'
        // come campo di primo livello.
        const sub = invoice.parent?.subscription_details?.subscription
        const subId = typeof sub === "string" ? sub : sub?.id
        if (subId) {
          // stripe_subscription_id puo' contenere piu' id separati da virgola
          // (setup multi-abbonamento): il match a sottostringa li copre tutti.
          const { data: quote } = await supabase
            .from("sales_channel_quotes")
            .select("*")
            .ilike("stripe_subscription_id", `%${subId}%`)
            .eq("status", "paid")
            .maybeSingle<SalesChannelQuote>()
          if (quote) {
            try {
              await provisionQuoteRenewal(quote, invoice.id!)
            } catch (renewalError) {
              console.error("[quotes] renewal provisioning error:", renewalError)
            }
          }
        }
      }
    }

    await supabase.from("sales_channel_quote_stripe_events").insert({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[quotes] Stripe webhook processing error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
