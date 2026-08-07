import Stripe from "stripe"
import { calculateQuoteLine, type QuoteBillingPeriod, type QuoteLineItem, type SalesChannelQuote } from "./types"

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

export async function orchestrateQuoteAfterSetup({
  stripe,
  quote,
  session,
}: {
  stripe: Stripe
  quote: SalesChannelQuote
  session: Stripe.Checkout.Session
}) {
  if (!session.customer || !session.setup_intent) throw new Error("Checkout setup privo di customer/setup_intent")

  const customerId = typeof session.customer === "string" ? session.customer : session.customer.id
  const setupIntentId = typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent.id
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  if (!setupIntent.payment_method) throw new Error("Metodo di pagamento non disponibile")
  const paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method.id

  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }).catch((error: any) => {
    if (error?.code !== "resource_already_exists") throw error
  })
  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } })

  const items = (quote.line_items || []).map(calculateQuoteLine).filter(item => item.amount > 0)
  const oneTimeItems = items.filter(item => !item.billing_period || item.billing_period === "one_time")
  const recurringItems = items.filter(item => item.billing_period && item.billing_period !== "one_time")
  const currency = (quote.currency || "eur").toLowerCase()

  let paymentIntentId: string | null = null
  if (oneTimeItems.length) {
    const amount = Math.round(oneTimeItems.reduce((sum, item) => sum + item.amount, 0) * 100)
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      payment_method: paymentMethodId,
      amount,
      currency,
      confirm: true,
      off_session: true,
      metadata: { type: "sales_channel_quote_setup_fee", quote_id: quote.id },
      description: `${quote.quote_number || "Preventivo"} - costi una tantum`,
    }, { idempotencyKey: `quote:${quote.id}:one-time` })
    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Pagamento una tantum non completato (${paymentIntent.status})`)
    }
    paymentIntentId = paymentIntent.id
  }

  const subscriptions: string[] = []
  for (const item of recurringItems) {
    const recurring = recurringFor(item.billing_period || "monthly")
    if (!recurring) continue

    const baseAmount = hasTemporaryDiscount(item) ? undiscountedAmount(item) : item.amount
    const product = await stripe.products.create({
      name: item.name || item.description,
      description: item.description?.slice(0, 500),
      metadata: { quote_id: quote.id, project: item.project || "custom", source_product_id: item.source_product_id || "" },
    }, { idempotencyKey: `quote:${quote.id}:product:${item.id}` })

    const price = await stripe.prices.create({
      product: product.id,
      currency,
      unit_amount: Math.round(baseAmount * 100),
      recurring,
      metadata: { quote_id: quote.id, line_item_id: item.id },
    }, { idempotencyKey: `quote:${quote.id}:price:${item.id}` })

    let discounts: Stripe.SubscriptionCreateParams.Discount[] | undefined
    if (hasTemporaryDiscount(item)) {
      const type = item.discount?.type
      const value = Number(item.discount?.value) || 0
      const durationMonths = Number(item.discount?.duration_months) || 0
      const coupon = await stripe.coupons.create({
        duration: "repeating",
        duration_in_months: durationMonths,
        ...(type === "percent"
          ? { percent_off: Math.min(100, Math.max(0, value)) }
          : { amount_off: Math.max(0, Math.round(value * 100)), currency }),
        metadata: { type: "sales_channel_quote", quote_id: quote.id, line_item_id: item.id },
        name: `${quote.quote_number || "Preventivo"} - ${item.name} - sconto ${durationMonths} mesi`,
      }, { idempotencyKey: `quote:${quote.id}:coupon:${item.id}` })
      discounts = [{ coupon: coupon.id }]
    }

    const trialDays = Math.max(0, Number(item.trial_days) || 0)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      default_payment_method: paymentMethodId,
      items: [{ price: price.id, quantity: 1 }],
      ...(discounts ? { discounts } : {}),
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      collection_method: "charge_automatically",
      metadata: {
        type: "sales_channel_quote",
        quote_id: quote.id,
        line_item_id: item.id,
        project: item.project || "custom",
      },
    }, { idempotencyKey: `quote:${quote.id}:subscription:${item.id}` })
    subscriptions.push(subscription.id)
  }

  return { customerId, paymentIntentId, subscriptionIds: subscriptions }
}
