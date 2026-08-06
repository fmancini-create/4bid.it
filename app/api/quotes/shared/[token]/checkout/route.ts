import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteLine, type QuoteBillingPeriod, type SalesChannelQuote } from "@/lib/quotes/types"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe = secretKey ? new Stripe(secretKey) : null

const intervalMap: Partial<Record<QuoteBillingPeriod, Stripe.PriceCreateParams.Recurring.Interval>> = {
  monthly: "month",
  yearly: "year",
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!stripe) return NextResponse.json({ error: "Stripe non configurato" }, { status: 503 })

  const { token } = await params
  const supabase = createAdminClient()
  const { data: quote, error } = await supabase.from("sales_channel_quotes").select("*").eq("token", token).maybeSingle<SalesChannelQuote>()

  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (quote.status !== "accepted" || !quote.accepted_at) {
    return NextResponse.json({ error: "Accetta il preventivo prima di inserire la carta" }, { status: 409 })
  }
  if (quote.payment_status === "paid") return NextResponse.json({ error: "Pagamento già effettuato" }, { status: 409 })

  const items = (quote.line_items || []).map(calculateQuoteLine).filter(item => item.amount > 0)
  if (!items.length) return NextResponse.json({ error: "Nessun importo pagabile" }, { status: 400 })

  const recurringItems = items.filter(item => item.billing_period && item.billing_period !== "one_time")
  const hasRecurring = recurringItems.length > 0
  const unsupported = recurringItems.find(item => item.billing_period === "quarterly")
  if (unsupported) return NextResponse.json({ error: "La periodicità trimestrale deve essere convertita in mensile o annuale prima del pagamento" }, { status: 422 })

  const currency = (quote.currency || "eur").toLowerCase()
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
    const recurring = item.billing_period && item.billing_period !== "one_time"
      ? { interval: intervalMap[item.billing_period]! }
      : undefined
    return {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: Math.round(item.amount * 100),
        product_data: {
          name: item.name || item.description,
          description: item.features?.length ? item.features.slice(0, 5).join(" · ").slice(0, 500) : item.description.slice(0, 500),
          metadata: { quote_id: quote.id, project: item.project || "custom", source_product_id: item.source_product_id || "" },
        },
        ...(recurring ? { recurring } : {}),
      },
    }
  })

  const trialDays = hasRecurring ? Math.max(0, ...recurringItems.map(item => Number(item.trial_days) || 0)) : 0
  const temporaryDiscounts = recurringItems.filter(item => item.discount?.duration_months)
  if (temporaryDiscounts.length) {
    return NextResponse.json({
      error: "Sono presenti sconti ricorrenti a durata limitata. Configura prima lo schedule Stripe oppure rimuovi la durata dello sconto.",
      code: "TEMPORARY_DISCOUNT_REQUIRES_SCHEDULE",
    }, { status: 422 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const common: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    customer_email: quote.client_email || undefined,
    line_items: lineItems,
    metadata: { type: "sales_channel_quote", quote_id: quote.id },
    success_url: `${baseUrl}/preventivo/${token}?paid=1`,
    cancel_url: `${baseUrl}/preventivo/${token}`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    allow_promotion_codes: false,
  }

  const session = hasRecurring
    ? await stripe.checkout.sessions.create({
        ...common,
        mode: "subscription",
        subscription_data: {
          metadata: { type: "sales_channel_quote", quote_id: quote.id },
          ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        },
      })
    : await stripe.checkout.sessions.create({
        ...common,
        mode: "payment",
        payment_intent_data: { metadata: { type: "sales_channel_quote", quote_id: quote.id } },
      })

  await supabase.from("sales_channel_quotes").update({
    stripe_session_id: session.id,
    payment_method: "card",
    updated_at: new Date().toISOString(),
  }).eq("id", quote.id)

  return NextResponse.json({ url: session.url, mode: hasRecurring ? "subscription" : "payment" })
}
