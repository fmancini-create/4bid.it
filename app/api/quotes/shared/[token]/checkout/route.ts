import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("token", token)
    .maybeSingle<SalesChannelQuote>()

  if (error || !quote) {
    return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  }
  if (quote.status !== "accepted" && quote.status !== "sent") {
    return NextResponse.json({ error: "Il preventivo deve essere accettato prima del pagamento" }, { status: 409 })
  }
  if (quote.payment_status === "paid") {
    return NextResponse.json({ error: "Pagamento già effettuato" }, { status: 409 })
  }

  // Amount to charge: deposit if present, otherwise total.
  const amount = Number(quote.deposit_amount ?? quote.total_amount ?? 0)
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Importo non disponibile per il pagamento con carta" }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: quote.client_email || undefined,
    line_items: [
      {
        price_data: {
          currency: quote.currency || "eur",
          product_data: {
            name: quote.title,
            description: quote.deposit_amount ? "Acconto attività ottimizzazione canali di vendita" : undefined,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "sales_channel_quote",
      quote_id: quote.id,
    },
    payment_intent_data: {
      metadata: { type: "sales_channel_quote", quote_id: quote.id },
    },
    success_url: `${baseUrl}/preventivo/${token}?paid=1`,
    cancel_url: `${baseUrl}/preventivo/${token}`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  })

  await supabase
    .from("sales_channel_quotes")
    .update({ stripe_session_id: session.id, payment_method: "card", updated_at: new Date().toISOString() })
    .eq("id", quote.id)

  return NextResponse.json({ url: session.url })
}
