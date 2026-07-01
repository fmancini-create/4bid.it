import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  const isProd = process.env.NODE_ENV === "production"
  const webhookSecret = process.env.STRIPE_QUOTES_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET

  if (isProd && !webhookSecret) {
    console.error("[v0] Quote webhook secret missing in production")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }
  if (!signature && webhookSecret) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err: any) {
    console.error("[v0] Quote webhook signature error:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency
  const { data: existing } = await supabase
    .from("sales_channel_quote_stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ received: true, deduped: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type !== "sales_channel_quote") break
        const quoteId = session.metadata.quote_id
        if (!quoteId) break

        await supabase
          .from("sales_channel_quotes")
          .update({
            payment_status: "paid",
            status: "paid",
            stripe_session_id: session.id,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", quoteId)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type !== "sales_channel_quote") break
        // No status downgrade needed; quote stays "accepted" so the client can retry payment.
        break
      }
    }

    await supabase.from("sales_channel_quote_stripe_events").insert({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[v0] Quote webhook processing error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
