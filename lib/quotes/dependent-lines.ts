import type { QuoteLineItem } from "./types"
import { getCommercialMeta, setCommercialMeta } from "./commercial"

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
