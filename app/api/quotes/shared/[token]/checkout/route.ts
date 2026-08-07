import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteLine, type QuoteBillingPeriod, type SalesChannelQuote } from "@/lib/quotes/types"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe = secretKey ? new Stripe(secretKey) : null

function recurringFor(period: QuoteBillingPeriod): Stripe.PriceCreateParams.Recurring | undefined {
  if (period === "monthly") return { interval: "month" }
  if (period === "quarterly") return { interval: "month", interval_count: 3 }
  if (period === "yearly") return { interval: "year" }
  return undefined
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
  const currency = (quote.currency || "eur").toLowerCase()

  // Checkout can apply a trial at subscription level, not independently per line item.
  // Applying the longest trial would silently grant free days to products without that trial.
  // Therefore a single Checkout subscription is allowed only when every recurring line shares
  // the same trial. Mixed trials are handled by the post-checkout orchestration path rather than
  // being approximated here.
  const trialSet = new Set(recurringItems.map(item => Math.max(0, Number(item.trial_days) || 0)))
  if (trialSet.size > 1) {
    return NextResponse.json({
      error: "Il preventivo contiene periodi di prova diversi tra prodotti ricorrenti. Per evitare addebiti o giorni gratuiti errati, uniforma i trial oppure usa il flusso multi-abbonamento.",
      code: "MIXED_TRIALS_REQUIRE_MULTI_SUBSCRIPTION",
    }, { status: 422 })
  }

  const temporaryDiscounts = recurringItems.filter(item => Number(item.discount?.duration_months) > 0)
  if (temporaryDiscounts.length) {
    return NextResponse.json({
      error: "Sono presenti sconti ricorrenti a durata limitata. Il checkout standard non deve trasformarli in sconti permanenti: usa lo schedule Stripe previsto dal Quote Engine.",
      code: "TEMPORARY_DISCOUNT_REQUIRES_SCHEDULE",
    }, { status: 422 })
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
    const recurring = recurringFor(item.billing_period || "one_time")
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

  const trialDays = hasRecurring ? [...trialSet][0] ?? 0 : 0
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
