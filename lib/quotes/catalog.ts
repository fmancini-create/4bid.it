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
  source_id?: string
  stripe_price_id?: string | null
}

const PROJECTS = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const

type CatalogProject = (typeof PROJECTS)[number]

const DEFAULT_CATALOG_URLS: Record<CatalogProject, string> = {
  hotelaccelerator: "https://baldznorrxlctucsfsto.supabase.co/functions/v1/quote-catalog",
  santaddeo: "https://aeynirkfixurikshxfov.supabase.co/functions/v1/quote-catalog",
  hotelprofitai: "https://jzfwplsgmcgfqnkkhddc.supabase.co/functions/v1/quote-catalog",
  manubot: "https://bblgrdukgxkszuayzqjt.supabase.co/functions/v1/quote-catalog",
}

function envName(project: CatalogProject, suffix: string): string {
  return `${project.toUpperCase()}_${suffix}`
}

function asBillingPeriod(value: unknown): QuoteBillingPeriod {
  if (value === "one_time" || value === "monthly" || value === "quarterly" || value === "yearly") return value
  if (value === "month") return "monthly"
  if (value === "quarter") return "quarterly"
  if (value === "year" || value === "annual") return "yearly"
  return "monthly"
}

function normalize(project: CatalogProject, value: any): QuoteCatalogItem {
  const price = Number(value.unit_amount ?? value.price ?? value.amount ?? 0)
  const allowedKinds = new Set(["plan", "module", "setup", "service"])
  const kind = allowedKinds.has(value.kind) ? value.kind : value.type === "addon" ? "module" : "plan"

  return {
    id: String(value.id ?? value.code ?? value.slug),
    source_id: value.source_id == null ? undefined : String(value.source_id),
    project,
    kind,
    name: String(value.name ?? value.title ?? value.id),
    description: value.description ? String(value.description) : undefined,
    features: Array.isArray(value.features)
      ? value.features.map((feature: any) =>
          typeof feature === "string" ? feature : String(feature.name ?? feature.label ?? feature.id),
        )
      : [],
    unit_amount: Number.isFinite(price) ? Math.max(0, price) : 0,
    currency: String(value.currency ?? "eur").toLowerCase(),
    billing_period: asBillingPeriod(value.billing_period ?? value.interval),
    trial_days: Math.max(0, Number(value.trial_days ?? value.trial_period_days ?? 0) || 0),
    support: value.support ?? undefined,
    version: String(value.version ?? value.updated_at ?? "current"),
    configuration_schema: value.configuration_schema ?? value.options_schema,
    stripe_price_id: value.stripe_price_id ?? null,
    raw_snapshot:
      value.raw_snapshot && typeof value.raw_snapshot === "object"
        ? value.raw_snapshot
        : value,
  }
}

async function loadProjectCatalog(project: CatalogProject): Promise<QuoteCatalogItem[]> {
  const inline = process.env[envName(project, "CATALOG_JSON")]
  if (inline) {
    const parsed = JSON.parse(inline)
    const rows = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.products ?? parsed.plans ?? []
    return rows.map((row: any) => normalize(project, row))
  }

  const url = process.env[envName(project, "CATALOG_URL")] || DEFAULT_CATALOG_URLS[project]
  const token = process.env[envName(project, "CATALOG_TOKEN")]
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!response.ok) throw new Error(`${project}: catalogo non disponibile (${response.status})`)
    const body = await response.json()
    const rows = Array.isArray(body) ? body : body.items ?? body.products ?? body.plans ?? []
    if (!Array.isArray(rows)) throw new Error(`${project}: formato catalogo non valido`)
    return rows.map((row: any) => normalize(project, row))
  } finally {
    clearTimeout(timeout)
  }
}

export async function getFederatedCatalog() {
  const results = await Promise.allSettled(
    PROJECTS.map(async (project) => ({
      project,
      items: await loadProjectCatalog(project),
    })),
  )

  return results.map((result, index) =>
    result.status === "fulfilled"
      ? { ...result.value, configured: result.value.items.length > 0, error: null }
      : {
          project: PROJECTS[index],
          items: [],
          configured: false,
          error:
            result.reason?.name === "AbortError"
              ? `${PROJECTS[index]}: timeout catalogo`
              : result.reason?.message ?? "Errore catalogo",
        },
  )
}
