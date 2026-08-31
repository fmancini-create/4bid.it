import { applyBillingPreference, hasAnnualBillingOption, resolveAnnualSetupMode, getCommercialMeta } from "./commercial"
import { calculateQuoteLine, isQuoteLineSelected, type QuoteLineItem } from "./types"

export type QuotePeriodTotals = {
  oneTime: number
  monthly: number
  quarterly: number
  yearly: number
  firstYear: number
}

export function summarizeQuotePeriods(items: QuoteLineItem[]): QuotePeriodTotals {
  const totals = { oneTime: 0, monthly: 0, quarterly: 0, yearly: 0 }
  for (const raw of items) {
    const item = calculateQuoteLine(raw)
    if (!isQuoteLineSelected(item)) continue
    if (item.billing_period === "monthly") totals.monthly += item.amount
    else if (item.billing_period === "quarterly") totals.quarterly += item.amount
    else if (item.billing_period === "yearly") totals.yearly += item.amount
    else totals.oneTime += item.amount
  }
  return {
    ...totals,
    firstYear: totals.oneTime + totals.monthly * 12 + totals.quarterly * 4 + totals.yearly,
  }
}

export function hasYearlyQuoteScenario(items: QuoteLineItem[]): boolean {
  return items.some((item) => {
    if (!isQuoteLineSelected(item)) return false
    if (hasAnnualBillingOption(item)) return true
    if (item.billing_period !== "one_time") return false
    return resolveAnnualSetupMode(getCommercialMeta(item)) !== "full"
  })
}

export function summarizeYearlyQuoteScenario(items: QuoteLineItem[]): QuotePeriodTotals {
  return summarizeQuotePeriods(
    items.map((item) => isQuoteLineSelected(item) ? applyBillingPreference(item, "yearly") : item),
  )
}
