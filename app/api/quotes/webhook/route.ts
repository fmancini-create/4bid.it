import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { enqueueQuoteProvisioning, processQuoteProvisioning } from "@/lib/quotes/provisioning"
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
      if (session.metadata?.type === "sales_channel_quote") {
        const quoteId = session.metadata.quote_id
        if (quoteId) {
          const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id
          const stripeSubscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id

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
          // Best effort in the same invocation. Every project job is idempotent,
          // so a retry endpoint/cron can safely resume failed or pending work.
          await processQuoteProvisioning(quoteId)
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
