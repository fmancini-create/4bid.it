import type { QuoteCatalogItem } from "./catalog"
import { calculateQuoteLine, type QuoteLineItem } from "./types"
import { getCommercialMeta, setCommercialMeta, type BillingOption } from "./commercial"
import { markEcosystemOffer } from "./ecosystem"

export type FederatedCatalogGroup = {
  project: string
  items: QuoteCatalogItem[]
  configured: boolean
  error: string | null
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function catalogFamily(item: Pick<QuoteCatalogItem, "billing_family" | "source_id" | "id">) {
  return item.billing_family || item.source_id || item.id.replace(/:(monthly|yearly)$/i, "")
}

export function quoteLineFamily(item: QuoteLineItem) {
  return getCommercialMeta(item).billing_family
    || String(item.source_product_id || "").replace(/:(monthly|yearly)$/i, "")
}

function pricingModel(item: QuoteCatalogItem) {
  return String(asObject(item.configuration_schema).pricing_model || "")
}

function hasDynamicCatalogPrice(item: QuoteCatalogItem) {
  const model = pricingModel(item)
  return model === "per_accommodation" || model === "per_accommodation_minimum"
}

function isExplicitlyFreeCatalogItem(item: QuoteCatalogItem) {
  const configuration = asObject(item.configuration_schema)
  const snapshot = asObject(item.raw_snapshot)
  return configuration.is_free === true
    || configuration.free === true
    || configuration.pricing_model === "free"
    || snapshot.is_free === true
    || snapshot.free === true
}

function effectiveCatalogUnitAmount(item: QuoteCatalogItem) {
  if (item.billing_period === "yearly" && item.alternative_period?.billing_period === "monthly") {
    return Math.max(0, Number(item.alternative_period.unit_amount) || 0)
  }
  return Math.max(0, Number(item.unit_amount) || 0)
}

export function isCatalogItemReadyForEcosystem(item: QuoteCatalogItem) {
  return !hasDynamicCatalogPrice(item)
    && (effectiveCatalogUnitAmount(item) > 0 || isExplicitlyFreeCatalogItem(item))
}

export function canonicalEcosystemCatalogItems(groups: FederatedCatalogGroup[]) {
  const rows = groups.flatMap(group => group.items || [])
    .filter(item => (item.kind === "plan" || item.kind === "module") && isCatalogItemReadyForEcosystem(item))

  return rows.filter(item => {
    if (item.billing_period !== "yearly") return true
    const family = catalogFamily(item)
    return !rows.some(other => other !== item
      && other.project === item.project
      && catalogFamily(other) === family
      && other.billing_period === "monthly")
  })
}

export function buildEcosystemCatalogLine(item: QuoteCatalogItem, id?: string, discountPct = 0): QuoteLineItem {
  const options: Partial<Record<"monthly" | "yearly", BillingOption>> = {}
  if (item.billing_period === "monthly" || item.billing_period === "yearly") {
    options[item.billing_period] = {
      billing_period: item.billing_period,
      unit_amount: item.unit_amount,
      stripe_price_id: item.stripe_price_id,
      trial_days: item.trial_days,
    }
  }
  if (item.alternative_period) {
    options[item.alternative_period.billing_period] = {
      billing_period: item.alternative_period.billing_period,
      unit_amount: item.alternative_period.unit_amount,
      stripe_price_id: item.alternative_period.stripe_price_id,
      discount_pct: item.alternative_period.discount_pct,
    }
  }

  const billingPeriod = item.billing_period === "yearly" && options.monthly ? "monthly" : item.billing_period
  const initialOption = billingPeriod === "monthly" || billingPeriod === "yearly" ? options[billingPeriod] : undefined
  const initialUnitAmount = Math.max(0, Number(initialOption?.unit_amount ?? item.unit_amount) || 0)
  const initialTrialDays = Math.max(0, Number(initialOption?.trial_days ?? item.trial_days) || 0)

  let line: QuoteLineItem = {
    id: id || `catalog:${item.project}:${item.id}`,
    kind: item.kind,
    project: item.project,
    source_product_id: item.id,
    name: item.name.replace(/\s*[—–-]\s*annuale\s*$/i, ""),
    description: item.description || item.name,
    features: item.features || [],
    quantity: 1,
    unit_amount: initialUnitAmount,
    amount: initialUnitAmount,
    billing_period: billingPeriod,
    trial_days: initialTrialDays,
    support: item.support ?? null,
    configuration: {
      ...(item.configuration_schema || {}),
      ecosystem_catalog_item_id: item.id,
    },
    catalog_snapshot: item.raw_snapshot || {},
    optional: true,
    default_selected: false,
    customer_selected: false,
  }

  line = setCommercialMeta(line, {
    billing_family: catalogFamily(item),
    billing_options: options,
    dependency: item.dependency || null,
  })

  return markEcosystemOffer(calculateQuoteLine(line), discountPct)
}
