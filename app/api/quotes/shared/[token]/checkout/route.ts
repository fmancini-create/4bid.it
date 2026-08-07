import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteLine, isQuoteLineSelected, type QuoteBillingPeriod, type QuoteLineItem, type SalesChannelQuote } from "@/lib/quotes/types"

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

function stripeCouponName(value: string) {
  return value.trim().slice(0, 40)
}

function requiresOrchestratedSetup(items: QuoteLineItem[]) {
  const recurring = items.filter(item => item.billing_period && item.billing_period !== "one_time")
  const oneTime = items.filter(item => (!item.billing_period || item.billing_period === "one_time") && item.amount > 0)
  if (!recurring.length) return false

  const trialSet = new Set(recurring.map(item => Math.max(0, Number(item.trial_days) || 0)))
  if (trialSet.size > 1) return true

  const temporary = recurring.filter(hasTemporaryDiscount)
  if (!temporary.length) return false
  if (oneTime.length > 0) return true

  const signatures = new Set(temporary.map(item => [item.discount?.type, Number(item.discount?.value), Number(item.discount?.duration_months)].join(":")))
  if (signatures.size > 1) return true
  return temporary.length !== recurring.length
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!stripe) return NextResponse.json({ error: "Stripe non configurato" }, { status: 503 })

  const { token } = await params
  const supabase = createAdminClient()
  const { data: quote, error } = await supabase.from("sales_channel_quotes").select("*").eq("token", token).maybeSingle<SalesChannelQuote>()

  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (quote.status !== "accepted" || !quote.accepted_at) {
    return NextResponse.json({ error: "Accetta il preventivo prima di inserire la carta" }, { status: 409 })
  }
  if (quote.payment_status === "paid") return NextResponse.json({ error: "Pagamento già effettuato" }, { status: 409 })

  let previousSession: Stripe.Checkout.Session | null = null
  if (quote.stripe_session_id) {
    try {
      previousSession = await stripe.checkout.sessions.retrieve(quote.stripe_session_id)
      if (previousSession.status === "open" && previousSession.url) {
        return NextResponse.json({ url: previousSession.url, mode: previousSession.mode, reused: true })
      }
      if (previousSession.status === "complete") {
        return NextResponse.json({
          error: "Il pagamento è già stato completato ed è in elaborazione. Non avviare un secondo checkout.",
          code: "CHECKOUT_PROCESSING",
        }, { status: 409 })
      }
    } catch (cause: any) {
      if (cause?.code !== "resource_missing") throw cause
    }
  }

  const items = (quote.line_items || []).filter(isQuoteLineSelected).map(calculateQuoteLine)
  const recurringItems = items.filter(item => item.billing_period && item.billing_period !== "one_time")
  const oneTimePayableItems = items.filter(item => (!item.billing_period || item.billing_period === "one_time") && item.amount > 0)
  const hasRecurring = recurringItems.length > 0
  if (!hasRecurring && !oneTimePayableItems.length) {
    return NextResponse.json({ error: "Il preventivo non contiene importi da addebitare con carta" }, { status: 400 })
  }

  const currency = (quote.currency || "eur").toLowerCase()
  const baseUrl = new URL(request.url).origin
  const attemptSeed = previousSession?.id || quote.stripe_session_id || "initial"
  const checkoutIdempotencyKey = `quote:${quote.id}:checkout:${attemptSeed}`

  if (requiresOrchestratedSetup(items)) {
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer_creation: "always",
      payment_method_types: ["card"],
      customer_email: quote.client_email || undefined,
      metadata: { type: "sales_channel_quote_setup", quote_id: quote.id, token },
      setup_intent_data: { metadata: { type: "sales_channel_quote_setup", quote_id: quote.id, token } },
      success_url: `${baseUrl}/preventivo/${token}?paid=processing`,
      cancel_url: `${baseUrl}/preventivo/${token}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
    }, { idempotencyKey: checkoutIdempotencyKey })

    await supabase.from("sales_channel_quotes").update({
      stripe_session_id: session.id,
      payment_method: "card",
      updated_at: new Date().toISOString(),
    }).eq("id", quote.id)

    return NextResponse.json({ url: session.url, mode: "setup" })
  }

  const tempDiscountItems = recurringItems.filter(hasTemporaryDiscount)
  let checkoutDiscount: Stripe.Checkout.SessionCreateParams.Discount | undefined
  let temporaryDiscountCouponId: string | undefined
  if (tempDiscountItems.length) {
    const first = tempDiscountItems[0]
    const durationMonths = Number(first.discount?.duration_months)
    const type = first.discount?.type
    const value = Number(first.discount?.value) || 0
    const coupon = await stripe.coupons.create({
      duration: "repeating",
      duration_in_months: durationMonths,
      ...(type === "percentage"
        ? { percent_off: Math.min(100, Math.max(0, value)) }
        : { amount_off: Math.max(0, Math.round(value * 100)), currency }),
      metadata: { type: "sales_channel_quote", quote_id: quote.id },
      name: stripeCouponName(`${quote.quote_number || "Preventivo"} - sconto ${durationMonths}m`),
    }, { idempotencyKey: `quote:${quote.id}:checkout-coupon:${attemptSeed}` })
    temporaryDiscountCouponId = coupon.id
    checkoutDiscount = { coupon: coupon.id }
  }

  const checkoutItems = items.filter(item =>
    (item.billing_period && item.billing_period !== "one_time") || item.amount > 0,
  )

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = checkoutItems.map(item => {
    const recurring = recurringFor(item.billing_period || "one_time")
    const stripeAmount = recurring && hasTemporaryDiscount(item) ? undiscountedAmount(item) : item.amount
    return {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: Math.max(0, Math.round(stripeAmount * 100)),
        product_data: {
          name: item.name || item.description,
          description: item.features?.length ? item.features.slice(0, 5).join(" · ").slice(0, 500) : item.description.slice(0, 500),
          metadata: { quote_id: quote.id, project: item.project || "custom", source_product_id: item.source_product_id || "" },
        },
        ...(recurring ? { recurring } : {}),
      },
    }
  })

  const trialDays = hasRecurring ? Math.max(0, Number(recurringItems[0]?.trial_days) || 0) : 0
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
        payment_method_collection: "always",
        subscription_data: {
          metadata: { type: "sales_channel_quote", quote_id: quote.id },
          ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        },
      }, { idempotencyKey: checkoutIdempotencyKey })
    : await stripe.checkout.sessions.create({
        ...common,
        mode: "payment",
        payment_intent_data: { metadata: { type: "sales_channel_quote", quote_id: quote.id } },
      }, { idempotencyKey: checkoutIdempotencyKey })

  await supabase.from("sales_channel_quotes").update({
    stripe_session_id: session.id,
    payment_method: "card",
    updated_at: new Date().toISOString(),
  }).eq("id", quote.id)

  return NextResponse.json({ url: session.url, mode: hasRecurring ? "subscription" : "payment" })
}
