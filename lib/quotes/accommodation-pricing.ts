import type { QuoteLineItem } from "./types"

export type AccommodationMinimumPricingConfig = {
  pricing_model: "per_accommodation_minimum"
  pricing_unit: "accommodation"
  accommodations: number
  unit_price: number
  minimum_monthly: number
  annual_discount_pct: number
  unit_label: string
  formula?: string
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function isAccommodationMinimumPricing(item: Pick<QuoteLineItem, "configuration">): boolean {
  return asObject(item.configuration).pricing_model === "per_accommodation_minimum"
}

export function normalizeAccommodationMinimumPricing(value: unknown): AccommodationMinimumPricingConfig {
  const raw = asObject(value)
  return {
    pricing_model: "per_accommodation_minimum",
    pricing_unit: "accommodation",
    accommodations: Math.max(1, Math.round(Number(raw.accommodations) || 1)),
    unit_price: Math.max(0, Number(raw.unit_price) || 0),
    minimum_monthly: Math.max(0, Number(raw.minimum_monthly) || 0),
    annual_discount_pct: Math.min(100, Math.max(0, Number(raw.annual_discount_pct) || 0)),
    unit_label: String(raw.unit_label || "sistemazioni"),
    formula: raw.formula ? String(raw.formula) : undefined,
  }
}

export function accommodationMinimumMonthly(config: AccommodationMinimumPricingConfig): number {
  return Math.round(Math.max(
    config.minimum_monthly,
    config.unit_price * config.accommodations,
  ) * 100) / 100
}

export function accommodationMinimumYearly(config: AccommodationMinimumPricingConfig): number {
  const monthly = accommodationMinimumMonthly(config)
  return Math.round(monthly * 12 * (1 - config.annual_discount_pct / 100) * 100) / 100
}
