import { calculateQuoteLine, type QuoteLineItem } from "./types"
import { getCommercialMeta, setCommercialMeta, type CommercialServiceConfig } from "./commercial"

/**
 * Returns the catalog source id of the recurring product a generated one-time
 * setup/service belongs to. Example:
 *   reviews:monthly:full_setup -> reviews:monthly
 */
function dependentSourceBase(item: QuoteLineItem): string | null {
  const source = String(item.source_product_id || "")
  if (!source) return null
  const base = source.replace(/:(configuration_support|full_setup)$/i, "")
  return base !== source ? base : null
}

/**
 * Resolve the live recurring parent of a setup/configuration service.
 *
 * Multi-property expansion can replace the original recurring row with a new
 * row (and therefore a new id) while a historical setup row still keeps the old
 * parent_line_id. Exact id wins. If that id is stale we only repair the link
 * when the catalog source/family identifies exactly ONE recurring candidate.
 * Ambiguous multi-property cases are deliberately left unresolved rather than
 * attaching a charge to the wrong hotel.
 */
export function resolveDependentParent(
  item: QuoteLineItem,
  candidates: QuoteLineItem[],
): QuoteLineItem | null {
  const meta = getCommercialMeta(item)
  if (!meta.parent_line_id) return null

  const direct = candidates.find(candidate =>
    candidate.id === meta.parent_line_id && candidate.billing_period !== "one_time",
  )
  if (direct) return direct

  const sourceBase = dependentSourceBase(item)
  if (!sourceBase) return null

  const bySource = candidates.filter(candidate =>
    candidate.billing_period !== "one_time"
      && candidate.project === item.project
      && String(candidate.source_product_id || "") === sourceBase,
  )
  if (bySource.length === 1) return bySource[0]

  const family = sourceBase.replace(/:(monthly|yearly)$/i, "")
  const byFamily = candidates.filter(candidate =>
    candidate.billing_period !== "one_time"
      && candidate.project === item.project
      && getCommercialMeta(candidate).billing_family === family,
  )
  return byFamily.length === 1 ? byFamily[0] : null
}

/**
 * Heals stale parent_line_id references without changing prices, selection or
 * any other commercial term. Safe to run repeatedly.
 */
export function normalizeDependentParentRefs(items: QuoteLineItem[]): QuoteLineItem[] {
  return items.map(item => {
    const currentParentId = getCommercialMeta(item).parent_line_id
    if (!currentParentId) return item
    const parent = resolveDependentParent(item, items)
    if (!parent?.id || parent.id === currentParentId) return item
    return setCommercialMeta(item, { parent_line_id: parent.id })
  })
}

const SERVICE_TYPES = ["configuration_support", "full_setup"] as const

type ServiceType = typeof SERVICE_TYPES[number]

function serviceConfig(item: QuoteLineItem, type: ServiceType): CommercialServiceConfig | undefined {
  const meta = getCommercialMeta(item)
  return type === "configuration_support" ? meta.configuration_support : meta.full_setup
}

function serviceLabel(type: ServiceType) {
  return type === "configuration_support" ? "Supporto alla configurazione" : "Setup completo"
}

function serviceDescription(type: ServiceType) {
  return type === "configuration_support"
    ? "Affiancamento 4BID nella configurazione iniziale del modulo."
    : "Configurazione completa iniziale del modulo a cura di 4BID."
}

/**
 * Historical drafts may contain the recurring module but not the generated
 * one-time rows, even though configuration_support/full_setup are enabled in
 * the frozen commercial metadata. Recreate only those missing rows, with a
 * deterministic id tied to the live parent. They stay OPTIONAL and unselected:
 * this restores visibility/choice without ever introducing a new charge.
 */
export function ensureDependentServiceLines(input: QuoteLineItem[]): QuoteLineItem[] {
  const items = normalizeDependentParentRefs(input)
  const generated: QuoteLineItem[] = []

  for (const parent of items) {
    if (parent.billing_period === "one_time" || !parent.id) continue
    const parentMeta = getCommercialMeta(parent)
    const baseName = (parent.name || parent.description || "Modulo").replace(/\s+·\s+.+$/, "")

    for (const type of SERVICE_TYPES) {
      const config = serviceConfig(parent, type)
      const price = Math.max(0, Number(config?.price) || 0)
      if (!config?.enabled || price <= 0) continue

      const alreadyPresent = items.some(candidate => {
        if (candidate.billing_period !== "one_time") return false
        if (getCommercialMeta(candidate).service_type !== type) return false
        return resolveDependentParent(candidate, items)?.id === parent.id
      })
      if (alreadyPresent) continue

      const sourceBase = String(parent.source_product_id || "")
      const annualMode = config.annual_setup_mode ?? (config.free_on_annual ? "free" : "full")
      let line: QuoteLineItem = {
        id: `${parent.id}:${type}`,
        kind: type === "configuration_support" ? "service" : "setup",
        project: parent.project,
        source_product_id: sourceBase ? `${sourceBase}:${type}` : undefined,
        name: `${serviceLabel(type)} · ${baseName}`,
        description: serviceDescription(type),
        features: [],
        support: null,
        optional: true,
        default_selected: false,
        quantity: 1,
        unit_amount: price,
        amount: price,
        billing_period: "one_time",
        trial_days: 0,
        catalog_snapshot: {},
        configuration: {},
      }
      line = setCommercialMeta(line, {
        service_type: type,
        parent_line_id: parent.id,
        normal_price: price,
        free_on_annual: config.free_on_annual,
        annual_setup_mode: annualMode,
        annual_setup_discount_pct: Math.max(0, Number(config.annual_setup_discount_pct) || 0),
      })
      generated.push(calculateQuoteLine(line))
    }
  }

  return generated.length ? [...items, ...generated] : items
}
