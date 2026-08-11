import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe = secretKey ? new Stripe(secretKey) : null

// Apre lo Stripe Billing Portal per il cliente titolare del preventivo, cosi'
// che possa gestire in autonomia l'abbonamento e, in particolare, DISATTIVARE
// il rinnovo automatico direttamente dalla piattaforma, senza comunicazioni
// scritte. L'accesso e' protetto dal token del preventivo (lo stesso link con
// cui il cliente ha accettato e pagato).
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!stripe) return NextResponse.json({ error: "Stripe non configurato" }, { status: 503 })

  const { token } = await params
  const supabase = createAdminClient()
  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("id, token, payment_status, status, stripe_customer_id, stripe_subscription_id")
    .eq("token", token)
    .maybeSingle<Partial<SalesChannelQuote>>()

  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })

  const paid = quote.payment_status === "paid" || quote.status === "paid"
  if (!paid) {
    return NextResponse.json({ error: "Nessun abbonamento attivo da gestire." }, { status: 409 })
  }
  if (!quote.stripe_customer_id) {
    return NextResponse.json(
      { error: "Questo acquisto non prevede un abbonamento gestibile dal portale. Per la disdetta scriva a 4BID." },
      { status: 400 },
    )
  }

  const baseUrl = new URL(request.url).origin
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: quote.stripe_customer_id,
    return_url: `${baseUrl}/preventivo/${token}`,
    locale: "it",
  })

  return NextResponse.json({ url: portalSession.url })
}
