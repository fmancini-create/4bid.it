import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { orchestrateQuoteAfterSetup } from "@/lib/quotes/stripe-orchestration"
import { enqueueQuoteProvisioning, processQuoteProvisioning } from "@/lib/quotes/provisioning"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

async function loadQuote(quoteId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("sales_channel_quotes").select("*").eq("id", quoteId).maybeSingle<SalesChannelQuote>()
  if (error || !data) throw error || new Error("Preventivo non trovato")
  return data
}

async function markPaidAndProvision(quote: SalesChannelQuote, patch: Record<string, unknown>) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("sales_channel_quotes").update({
    payment_status: "paid",
    status: "paid",
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...patch,
  }).eq("id", quote.id).select("*").single<SalesChannelQuote>()
  if (error || !data) throw error || new Error("Aggiornamento preventivo fallito")
  await enqueueQuoteProvisioning(data)
  await processQuoteProvisioning(data.id)
}

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) return NextResponse.json({ error: "Stripe webhook non configurato" }, { status: 503 })

  const signature = request.headers.get("stripe-signature")
  if (!signature) return NextResponse.json({ error: "Firma Stripe mancante" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Firma non valida" }, { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const quoteId = session.metadata?.quote_id
      if (!quoteId) return NextResponse.json({ received: true })

      const quote = await loadQuote(quoteId)
      if (quote.payment_status === "paid") return NextResponse.json({ received: true, duplicate: true })

      if (session.mode === "setup" && session.metadata?.type === "sales_channel_quote_setup") {
        const result = await orchestrateQuoteAfterSetup({ stripe, quote, session })
        await markPaidAndProvision(quote, {
          stripe_customer_id: result.customerId,
          stripe_subscription_id: result.subscriptionIds.join(","),
          stripe_session_id: session.id,
        })
      } else if (session.mode === "payment" && session.payment_status === "paid") {
        await markPaidAndProvision(quote, {
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
          stripe_session_id: session.id,
        })
      } else if (session.mode === "subscription") {
        await markPaidAndProvision(quote, {
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
          stripe_session_id: session.id,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[stripe-webhook] quote processing failed", { eventId: event.id, type: event.type, error: error?.message })
    return NextResponse.json({ error: "Elaborazione webhook fallita" }, { status: 500 })
  }
}
