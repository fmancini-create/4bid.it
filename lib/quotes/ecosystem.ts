import { calculateQuoteLine, type QuoteLineItem } from "./types"

const ECOSYSTEM_MARKER = "4bid_ecosystem"
const MULTI_PROPERTY_MARKER = "multi_property"

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export type QuotePropertyPricing = {
  managed_by: typeof MULTI_PROPERTY_MARKER
  family: string
  property_id: string
  property_name: string
  accommodations: number
}

export function isEcosystemOffer(item: QuoteLineItem): boolean {
  const configuration = asObject(item.configuration)
  return configuration.offer_channel === ECOSYSTEM_MARKER
}

export function isEcosystemOfferSelected(item: QuoteLineItem, accepted = false): boolean {
  if (!isEcosystemOffer(item)) return true
  if (accepted) return item.customer_selected !== false
  return item.default_selected !== false && item.customer_selected !== false
}

export function markEcosystemOffer(item: QuoteLineItem, discountPct: number): QuoteLineItem {
  const configuration = asObject(item.configuration)
  const pct = Math.min(100, Math.max(0, Number(discountPct) || 0))
  return calculateQuoteLine({
    ...item,
    optional: true,
    default_selected: false,
    customer_selected: false,
    discount: pct > 0
      ? { type: "percentage", value: pct, reason: "Vantaggio cliente 4BID" }
      : null,
    configuration: {
      ...configuration,
      offer_channel: ECOSYSTEM_MARKER,
      ecosystem_discount_pct: pct,
    },
  })
}

export function selectEcosystemOffer(item: QuoteLineItem, selected: boolean): QuoteLineItem {
  if (!isEcosystemOffer(item)) return item
  if (!selected) {
    return calculateQuoteLine({ ...item, default_selected: false, customer_selected: false })
  }
  const { customer_selected: _ignored, ...rest } = item
  return calculateQuoteLine({ ...rest, default_selected: true })
}

export function getPropertyPricing(item: QuoteLineItem): QuotePropertyPricing | null {
  const configuration = asObject(item.configuration)
  const raw = asObject(configuration.property_pricing)
  if (raw.managed_by !== MULTI_PROPERTY_MARKER) return null
  const propertyId = String(raw.property_id || "").trim()
  const propertyName = String(raw.property_name || "").trim()
  const family = String(raw.family || "").trim()
  const accommodations = Math.max(0, Math.round(Number(raw.accommodations) || 0))
  if (!propertyId || !propertyName || !family || accommodations <= 0) return null
  return {
    managed_by: MULTI_PROPERTY_MARKER,
    family,
    property_id: propertyId,
    property_name: propertyName,
    accommodations,
  }
}

export function withPropertyPricing(
  item: QuoteLineItem,
  input: { family: string; propertyId: string; propertyName: string; accommodations: number },
): QuoteLineItem {
  const configuration = asObject(item.configuration)
  const accommodations = Math.max(1, Math.round(Number(input.accommodations) || 1))
  return calculateQuoteLine({
    ...item,
    quantity: accommodations,
    configuration: {
      ...configuration,
      accommodations,
      property_pricing: {
        managed_by: MULTI_PROPERTY_MARKER,
        family: input.family,
        property_id: input.propertyId,
        property_name: input.propertyName,
        accommodations,
      } satisfies QuotePropertyPricing,
    },
  })
}

export function ecosystemDiscountLabel(item: QuoteLineItem): string | null {
  if (!isEcosystemOffer(item)) return null
  const pct = item.discount?.type === "percentage" ? Math.max(0, Number(item.discount.value) || 0) : 0
  return pct > 0 ? `Vantaggio cliente 4BID -${Math.round(pct)}%` : "Vantaggio cliente 4BID"
}
