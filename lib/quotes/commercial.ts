import { calculateQuoteLine, type QuoteLineItem } from "./types"

export type QuoteBillingPreference = "monthly" | "yearly"

export type BillingOption = {
  billing_period: QuoteBillingPreference
  unit_amount: number
  stripe_price_id?: string | null
  trial_days?: number
  discount_pct?: number
}

export type CommercialDependency = {
  role?: "base" | "addon"
  project?: string
  requires_base?: boolean
  required_kind?: "plan"
  linked_project?: string | null
}

export type CommercialServiceConfig = {
  enabled?: boolean
  price?: number
  free_on_annual?: boolean
}

export type CommercialMeta = {
  billing_family?: string
  billing_options?: Partial<Record<QuoteBillingPreference, BillingOption>>
  dependency?: CommercialDependency | null
  configuration_support?: CommercialServiceConfig
  full_setup?: CommercialServiceConfig
  service_type?: "configuration_support" | "full_setup"
  parent_line_id?: string
  free_on_annual?: boolean
  normal_price?: number
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function getCommercialMeta(item: QuoteLineItem): CommercialMeta {
  const configuration = asObject(item.configuration)
  const commercial = asObject(configuration.commercial)
  return commercial as CommercialMeta
}

export function setCommercialMeta(item: QuoteLineItem, patch: Partial<CommercialMeta>): QuoteLineItem {
  const configuration = asObject(item.configuration)
  return { ...item, configuration: { ...configuration, commercial: { ...getCommercialMeta(item), ...patch } } }
}

export function applyBillingPreference(item: QuoteLineItem, preference: QuoteBillingPreference): QuoteLineItem {
  const meta = getCommercialMeta(item)
  const option = meta.billing_options?.[preference]
  let next = { ...item }
  if (option && item.billing_period !== "one_time") {
    next = {
      ...next,
      billing_period: option.billing_period,
      unit_amount: Math.max(0, Number(option.unit_amount) || 0),
      trial_days: option.trial_days ?? item.trial_days,
      catalog_snapshot: {
        ...(item.catalog_snapshot || {}),
        accepted_billing_preference: preference,
        accepted_stripe_price_id: option.stripe_price_id ?? null,
      },
    }
  }
  if (item.billing_period === "one_time" && meta.free_on_annual && preference === "yearly") {
    next = { ...next, unit_amount: 0, list_amount: Number(meta.normal_price ?? item.unit_amount ?? item.amount ?? 0), amount: 0 }
  } else if (item.billing_period === "one_time" && meta.normal_price != null) {
    next = { ...next, unit_amount: Math.max(0, Number(meta.normal_price) || 0) }
  }
  return calculateQuoteLine(next)
}

export function hasBaseForProject(items: QuoteLineItem[], project: string): boolean {
  return items.some(item => item.project === project && item.kind === "plan" && item.customer_selected !== false)
}

export function dependencyErrors(items: QuoteLineItem[]): string[] {
  const selected = items.filter(item => item.customer_selected !== false)
  const selectedIds = new Set(selected.map(item => item.id).filter(Boolean))
  const errors: string[] = []
  for (const item of selected) {
    const meta = getCommercialMeta(item)
    if (meta.parent_line_id && !selectedIds.has(meta.parent_line_id)) {
      errors.push(`${item.name || item.description} richiede il modulo a cui è collegato`)
    }
    const dep = meta.dependency
    if (!dep?.requires_base) continue
    const project = dep.project || item.project
    if (project && !hasBaseForProject(selected, project)) errors.push(`${item.name || item.description} richiede un piano base ${project}`)
    if (dep.linked_project && !hasBaseForProject(selected, dep.linked_project)) errors.push(`${item.name || item.description} richiede anche l'attivazione ${dep.linked_project}`)
  }
  return Array.from(new Set(errors))
}

export function annualSaving(monthly: number, yearly: number): { amount: number; pct: number } {
  const annualized = Math.max(0, monthly) * 12
  const amount = Math.max(0, annualized - Math.max(0, yearly))
  return { amount, pct: annualized > 0 ? Math.round((amount / annualized) * 1000) / 10 : 0 }
}

export function createCommercialServiceLine(parent: QuoteLineItem, service: "configuration_support" | "full_setup", config: CommercialServiceConfig): QuoteLineItem | null {
  if (!config.enabled) return null
  const price = Math.max(0, Number(config.price) || 0)
  const label = service === "configuration_support" ? "Supporto alla configurazione" : "Setup completo"
  const id = `${parent.id || crypto.randomUUID()}:${service}`
  return setCommercialMeta({
    id,
    kind: service === "full_setup" ? "setup" : "service",
    project: parent.project,
    source_product_id: `${parent.source_product_id || parent.id}:${service}`,
    name: `${label} · ${parent.name || parent.description}`,
    description: service === "configuration_support"
      ? "Affiancamento 4BID nella configurazione iniziale del modulo."
      : "Configurazione completa iniziale del modulo a cura di 4BID.",
    quantity: 1,
    unit_amount: price,
    list_amount: price,
    amount: price,
    billing_period: "one_time",
    trial_days: 0,
    features: [],
    discount: null,
    support: null,
    configuration: {},
    catalog_snapshot: {},
    optional: true,
    default_selected: false,
  }, {
    service_type: service,
    parent_line_id: parent.id,
    free_on_annual: !!config.free_on_annual,
    normal_price: price,
  })
}
