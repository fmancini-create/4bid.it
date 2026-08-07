import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteLine, type QuoteBillingPeriod, type QuoteLineItem, type SalesChannelQuote } from "@/lib/quotes/types"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe = secretKey ? new Stripe(secretKey) : null

function recurringFor(period: QuoteBillingPeriod): Stripe.PriceCreateParams.Recurring | undefined {
  if (period === "monthly") return { interval: "month" }
  if (period === "quarterly") return { interval: "month", interval_count: 3 }
  if (period === "yearly") return { interval: "year" }
  return undefined
}

function hasTemporaryDiscount(item: QuoteLineItem) {
  return Number(item.discount?.duration_months) > 0 && Number(item.discount?.value) > 0
}

function undiscountedAmount(item: QuoteLineItem) {
  const quantity = Math.max(0, Number(item.quantity) || 0)
  const unit = Math.max(0, Number(item.list_amount ?? item.unit_amount) || 0)
  return Math.round(quantity * unit * 100) / 100
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

  // Stripe Checkout applies trial_period_days to the whole subscription, not to individual lines.
  // Never approximate mixed trials: that would grant free days to products that do not include them.
  const trialSet = new Set(recurringItems.map(item => Math.max(0, Number(item.trial_days) || 0)))
  if (trialSet.size > 1) {
    return NextResponse.json({
      error: "Il preventivo contiene periodi di prova diversi tra prodotti ricorrenti. Per mantenere esattamente le condizioni contrattuali occorrono abbonamenti Stripe separati.",
      code: "MIXED_TRIALS_REQUIRE_MULTI_SUBSCRIPTION",
    }, { status: 422 })
  }

  const tempDiscountItems = recurringItems.filter(hasTemporaryDiscount)
  const tempDurations = new Set(tempDiscountItems.map(item => Number(item.discount?.duration_months)))
  const tempDiscountTypes = new Set(tempDiscountItems.map(item => item.discount?.type))

  // A single Checkout subscription can safely express one temporary discount policy.
  // More complex combinations require multiple subscriptions/schedules rather than silently changing the deal.
  if (tempDurations.size > 1 || tempDiscountTypes.size > 1) {
    return NextResponse.json({
      error: "Il preventivo contiene sconti temporanei con durate o tipologie diverse. Per rispettarli esattamente occorrono abbonamenti Stripe separati.",
      code: "MIXED_TEMPORARY_DISCOUNTS_REQUIRE_MULTI_SUBSCRIPTION",
    }, { status: 422 })
  }

  let checkoutDiscount: Stripe.Checkout.SessionCreateParams.Discount | undefined
  let temporaryDiscountCouponId: string | undefined
  if (tempDiscountItems.length) {
    const first = tempDiscountItems[0]
    const durationMonths = Number(first.discount?.duration_months)
    const type = first.discount?.type
    const value = Number(first.discount?.value) || 0

    // Checkout supports discounts at session/subscription level. Therefore the temporary discount can
    // only be represented directly when every recurring item shares that same temporary discount.
    const everyRecurringSharesDiscount = recurringItems.every(item =>
      hasTemporaryDiscount(item)
      && item.discount?.type === type
      && Number(item.discount?.value) === value
      && Number(item.discount?.duration_months) === durationMonths,
    )
    if (!everyRecurringSharesDiscount) {
      return NextResponse.json({
        error: "Lo sconto temporaneo riguarda solo alcune voci ricorrenti. Per non scontare prodotti esclusi occorrono abbonamenti Stripe separati.",
        code: "PARTIAL_TEMPORARY_DISCOUNT_REQUIRES_MULTI_SUBSCRIPTION",
      }, { status: 422 })
    }

    const coupon = await stripe.coupons.create({
      duration: "repeating",
      duration_in_months: durationMonths,
      ...(type === "percent"
        ? { percent_off: Math.min(100, Math.max(0, value)) }
        : { amount_off: Math.max(0, Math.round(value * 100)), currency }),
      metadata: { type: "sales_channel_quote", quote_id: quote.id },
      name: `${quote.quote_number || "Preventivo"} - sconto ${durationMonths} mesi`,
    })
    temporaryDiscountCouponId = coupon.id
    checkoutDiscount = { coupon: coupon.id }
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
    const recurring = recurringFor(item.billing_period || "one_time")
    // Temporary discounts are applied by Stripe coupon to the recurring subscription, so the base
    // recurring price must be the undiscounted contractual/list amount. Permanent discounts remain
    // baked into the line amount snapshot.
    const stripeAmount = recurring && hasTemporaryDiscount(item) ? undiscountedAmount(item) : item.amount
    return {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: Math.round(stripeAmount * 100),
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
    metadata: {
      type: "sales_channel_quote",
      quote_id: quote.id,
      ...(temporaryDiscountCouponId ? { temporary_discount_coupon_id: temporaryDiscountCouponId } : {}),
    },
    success_url: `${baseUrl}/preventivo/${token}?paid=1`,
    cancel_url: `${baseUrl}/preventivo/${token}`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    allow_promotion_codes: false,
    ...(checkoutDiscount ? { discounts: [checkoutDiscount] } : {}),
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
