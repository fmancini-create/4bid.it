import type { QuoteBillingPeriod, QuoteProject, QuoteSupportTerms } from "./types"

export interface QuoteCatalogItem {
  id: string
  project: Exclude<QuoteProject, "consulting" | "custom">
  kind: "plan" | "module" | "setup" | "service"
  name: string
  description?: string
  features: string[]
  unit_amount: number
  currency: string
  billing_period: QuoteBillingPeriod
  trial_days?: number
  support?: QuoteSupportTerms
  version?: string
  configuration_schema?: Record<string, unknown>
  raw_snapshot: Record<string, unknown>
}

const PROJECTS = ["santaddeo", "hotelprofitai", "manubot"] as const

type CatalogProject = (typeof PROJECTS)[number]

function envName(project: CatalogProject, suffix: string): string {
  return `${project.toUpperCase()}_${suffix}`
}

function normalize(project: CatalogProject, value: any): QuoteCatalogItem {
  const price = Number(value.unit_amount ?? value.price ?? value.amount ?? 0)
  return {
    id: String(value.id ?? value.code ?? value.slug),
    project,
    kind: value.kind ?? value.type ?? "plan",
    name: String(value.name ?? value.title ?? value.id),
    description: value.description ? String(value.description) : undefined,
    features: Array.isArray(value.features)
      ? value.features.map((feature: any) => typeof feature === "string" ? feature : String(feature.name ?? feature.label ?? feature.id))
      : [],
    unit_amount: price,
    currency: String(value.currency ?? "eur").toLowerCase(),
    billing_period: value.billing_period ?? value.interval ?? "monthly",
    trial_days: Number(value.trial_days ?? value.trial_period_days ?? 0) || 0,
    support: value.support ?? null,
    version: String(value.version ?? value.updated_at ?? "current"),
    configuration_schema: value.configuration_schema ?? value.options_schema,
    raw_snapshot: value,
  }
}

async function loadProjectCatalog(project: CatalogProject): Promise<QuoteCatalogItem[]> {
  const inline = process.env[envName(project, "CATALOG_JSON")]
  if (inline) {
    const parsed = JSON.parse(inline)
    const rows = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.products ?? parsed.plans ?? []
    return rows.map((row: any) => normalize(project, row))
  }

  const url = process.env[envName(project, "CATALOG_URL")]
  if (!url) return []

  const token = process.env[envName(project, "CATALOG_TOKEN")]
  const response = await fetch(url, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new Error(`${project}: catalogo non disponibile (${response.status})`)
  const body = await response.json()
  const rows = Array.isArray(body) ? body : body.items ?? body.products ?? body.plans ?? []
  return rows.map((row: any) => normalize(project, row))
}

export async function getFederatedCatalog() {
  const results = await Promise.allSettled(PROJECTS.map(async project => ({
    project,
    items: await loadProjectCatalog(project),
  })))

  return results.map((result, index) => result.status === "fulfilled"
    ? { ...result.value, configured: result.value.items.length > 0, error: null }
    : { project: PROJECTS[index], items: [], configured: false, error: result.reason?.message ?? "Errore catalogo" })
}
