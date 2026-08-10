import { calculateQuoteLine, type QuoteLineItem } from "./types"

export type QuoteBillingPreference = "monthly" | "yearly"
export type AnnualSetupMode = "full" | "discount" | "free"

// Crediti a consumo compresi in un addon (es. "Analisi aziende" di HotelProfitAI).
// `amount` e' l'allowance in euro ricaricata automaticamente; `recharge` decide se
// l'accredito avviene una sola volta all'attivazione oppure ad ogni rinnovo.
// Voce informativa: NON entra nei totali del preventivo (gia' compresa nel pacchetto).
export type IncludedCreditsRecharge = "one_time" | "recurring"
export type IncludedCredits = {
  amount: number
  recharge: IncludedCreditsRecharge
}

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
  annual_setup_mode?: AnnualSetupMode
  annual_setup_discount_pct?: number
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
  annual_setup_mode?: AnnualSetupMode
  annual_setup_discount_pct?: number
  included_credits?: IncludedCredits | null
  // Sconto % applicato al PAGAMENTO ANTICIPATO (annuale) di un piano/modulo
  // ricorrente. Da qui si deriva `billing_options.yearly.unit_amount`
  // (= canone x 12 scontato). Serve anche a ricalcolare il prezzo annuale se poi
  // cambia il canone mensile, evitando che resti un valore obsoleto.
  annual_plan_discount_pct?: number
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

export function resolveAnnualSetupMode(meta: CommercialMeta): AnnualSetupMode {
  return meta.annual_setup_mode ?? (meta.free_on_annual ? "free" : "full")
}

/**
 * Legge e normalizza i crediti inclusi di una voce.
 * Ritorna null se non configurati o se l'importo non e' positivo, cosi' UI e
 * condizioni economiche non mostrano righe vuote. Non tocca i totali.
 */
export function getIncludedCredits(item: QuoteLineItem): IncludedCredits | null {
  const raw = getCommercialMeta(item).included_credits
  if (!raw) return null
  const amount = Math.max(0, Number(raw.amount) || 0)
  if (amount <= 0) return null
  const recharge: IncludedCreditsRecharge = raw.recharge === "recurring" ? "recurring" : "one_time"
  return { amount, recharge }
}

export function hasAnnualBillingOption(item: QuoteLineItem): boolean {
  const meta = getCommercialMeta(item)
  if (meta.billing_options?.yearly) return true
  return item.project === "santaddeo" && item.billing_period !== "one_time" && !!meta.billing_options?.monthly
}

export function applyBillingPreference(item: QuoteLineItem, preference: QuoteBillingPreference): QuoteLineItem {
  const meta = getCommercialMeta(item)
  let option = meta.billing_options?.[preference]
  if (!option && preference === "yearly" && item.project === "santaddeo" && item.billing_period !== "one_time" && meta.billing_options?.monthly) {
    const monthly = meta.billing_options.monthly
    option = {
      billing_period: "yearly",
      unit_amount: Math.round(Math.max(0, Number(monthly.unit_amount) || 0) * 12 * 100) / 100,
      trial_days: monthly.trial_days,
      discount_pct: 0,
    }
  }
  let next = { ...item }
  // Un billing_option con prezzo 0 NON e' un prezzo valido: e' una voce di
  // catalogo a prezzo personalizzato (es. ManuBot Corporate) il cui canone
  // viene poi impostato a mano su `unit_amount`. Se lo usassimo come override,
  // la voce uscirebbe a "0,00 €" pur avendo un prezzo reale sulla riga. Quindi
  // l'override vale solo quando l'opzione ha un importo positivo; altrimenti si
  // tiene il prezzo della riga.
  if (option && Number(option.unit_amount) > 0 && item.billing_period !== "one_time") {
    // Lo sconto di riga (`discount`, es. -20% per 12 mesi) e' la promo del CANONE
    // MENSILE. Il prezzo dell'opzione ANNUALE ha gia' il proprio sconto
    // incorporato (`discount_pct`, es. 30% -> 65x12x0,70=546): riapplicare qui il
    // 20% mensile produrrebbe un DOPPIO sconto (546 -> 436,80). Quindi, quando si
    // passa all'annuale e l'opzione porta un suo sconto, si azzera lo sconto di
    // riga. Se l'annuale e' solo canone x 12 senza sconto proprio, la promo resta.
    const annualHasOwnDiscount = preference === "yearly" && Number(option.discount_pct) > 0
    next = {
      ...next,
      billing_period: option.billing_period,
      unit_amount: Math.max(0, Number(option.unit_amount) || 0),
      trial_days: option.trial_days ?? item.trial_days,
      discount: annualHasOwnDiscount ? undefined : item.discount,
      catalog_snapshot: {
        ...(item.catalog_snapshot || {}),
        accepted_billing_preference: preference,
        accepted_stripe_price_id: option.stripe_price_id ?? null,
      },
    }
  }
  if (item.billing_period === "one_time") {
    // `normal_price` e' il prezzo pieno del setup/servizio. Su alcuni preventivi
    // storici e' rimasto a 0 pur avendo un unit_amount valido (es. 100): in quel
    // caso NON va usato come prezzo, altrimenti la voce esce a "0,00 €". Si usa
    // solo quando e' positivo, con ripiego su unit_amount/amount.
    const rawNormal = Number(meta.normal_price)
    const hasNormal = Number.isFinite(rawNormal) && rawNormal > 0
    const normalPrice = Math.max(0, (hasNormal ? rawNormal : Number(item.unit_amount ?? item.amount ?? 0)) || 0)
    const mode = resolveAnnualSetupMode(meta)
    if (preference === "yearly" && mode === "free") {
      next = { ...next, unit_amount: 0, list_amount: normalPrice, amount: 0 }
    } else if (preference === "yearly" && mode === "discount") {
      const pct = Math.min(100, Math.max(0, Number(meta.annual_setup_discount_pct) || 0))
      const discounted = Math.round(normalPrice * (1 - pct / 100) * 100) / 100
      next = { ...next, unit_amount: discounted, list_amount: normalPrice, amount: discounted }
    } else {
      next = { ...next, unit_amount: normalPrice }
    }
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

function deepCopyLine(item: QuoteLineItem): QuoteLineItem {
  if (typeof structuredClone === "function") return structuredClone(item)
  return JSON.parse(JSON.stringify(item)) as QuoteLineItem
}

/**
 * Copia una voce assegnandole un identificativo NUOVO.
 * Obbligatorio: nella vista cliente la selezione lavora su un insieme di id,
 * quindi due righe con lo stesso id verrebbero scelte e tolte insieme.
 */
export function duplicateQuoteLine(source: QuoteLineItem): QuoteLineItem {
  const copy = deepCopyLine(source)
  copy.id = crypto.randomUUID()
  copy.name = `${source.name || source.description || "Voce"} (copia)`
  return copy
}

/**
 * Copia la voce all'indice indicato insieme alle righe che le sono collegate
 * (setup e servizi con `parent_line_id`), riagganciandole alla copia: lasciarle
 * puntare all'originale creerebbe due setup sullo stesso modulo.
 * Le copie vengono inserite subito dopo la voce di partenza.
 */
export function duplicateQuoteLineAt(items: QuoteLineItem[], index: number): { items: QuoteLineItem[]; copied: number } {
  const source = items[index]
  if (!source) return { items, copied: 0 }
  const copy = duplicateQuoteLine(source)
  const children = source.id ? items.filter(item => getCommercialMeta(item).parent_line_id === source.id) : []
  const copiedChildren = children.map(child => setCommercialMeta(duplicateQuoteLine(child), { parent_line_id: copy.id }))
  const next = [...items]
  next.splice(index + 1, 0, copy, ...copiedChildren)
  return { items: next, copied: 1 + copiedChildren.length }
}

/**
 * Sincronizza l'opzione di PAGAMENTO ANTICIPATO (annuale) di un piano/modulo
 * ricorrente a partire dallo sconto% (`annual_plan_discount_pct`) e dal canone
 * mensile corrente (`unit_amount`). Scrive `billing_options.yearly.unit_amount`
 * = canone x 12 scontato, cosi' la vista cliente puo' offrire la formula annuale.
 *
 * - Se lo sconto e' nullo/assente rimuove del tutto l'opzione annuale: un'opzione
 *   annuale a prezzo 0 verrebbe ignorata da `applyBillingPreference` (bug del
 *   "verde a 0€") e il selettore mostrerebbe una formula fantasma.
 * - Si applica solo ai canoni mensili non-santaddeo (l'annuale santaddeo e'
 *   sintetizzato ×12 altrove) e mai alle voci una tantum.
 */
export function syncAnnualPlanPrice(item: QuoteLineItem): QuoteLineItem {
  if (item.billing_period !== "monthly") return item
  const meta = getCommercialMeta(item)
  const pct = Math.min(100, Math.max(0, Number(meta.annual_plan_discount_pct) || 0))
  const monthly = Math.max(0, Number(item.unit_amount) || 0)
  const options = { ...(meta.billing_options || {}) }
  if (pct <= 0 || monthly <= 0) {
    if (!options.yearly) return item
    delete options.yearly
    return setCommercialMeta(item, { billing_options: options })
  }
  const yearlyPrice = round2(monthly * 12 * (1 - pct / 100))
  options.monthly = options.monthly || { billing_period: "monthly", unit_amount: 0, trial_days: item.trial_days }
  options.yearly = {
    billing_period: "yearly",
    unit_amount: yearlyPrice,
    stripe_price_id: meta.billing_options?.yearly?.stripe_price_id ?? null,
    discount_pct: pct,
  }
  return setCommercialMeta(item, { billing_family: meta.billing_family || `manual:${item.id}`, billing_options: options })
}

export function annualSaving(monthly: number, yearly: number): { amount: number; pct: number } {
  const annualized = Math.max(0, monthly) * 12
  const amount = Math.max(0, annualized - Math.max(0, yearly))
  return { amount, pct: annualized > 0 ? Math.round((amount / annualized) * 1000) / 10 : 0 }
}

const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100

export type AnnualSetupPromo = { mode: "discount" | "free"; normalPrice: number; annualPrice: number; saving: number; pct: number }

/** Agevolazione annuale di una voce una tantum (setup, servizi manuali): va letta sulla riga grezza, non su quella già convertita. */
export function annualSetupPromo(item: QuoteLineItem): AnnualSetupPromo | null {
  if (item.billing_period !== "one_time") return null
  const mode = resolveAnnualSetupMode(getCommercialMeta(item))
  if (mode === "full") return null
  const normalPrice = round2(applyBillingPreference(item, "monthly").amount || 0)
  const annualPrice = round2(applyBillingPreference(item, "yearly").amount || 0)
  const saving = round2(Math.max(0, normalPrice - annualPrice))
  if (saving <= 0) return null
  return { mode, normalPrice, annualPrice, saving, pct: normalPrice > 0 ? Math.round((saving / normalPrice) * 1000) / 10 : 0 }
}

export type AnnualComparison = {
  eligible: boolean
  monthlyScenario: number
  yearlyScenario: number
  recurringSaving: number
  setupSaving: number
  amount: number
  pct: number
}

/**
 * Confronto sul primo anno fra le due formule.
 * Comprende i canoni disponibili in entrambe le formule e le voci una tantum
 * (setup, servizi manuali) che con l'annuale sono scontate o in omaggio.
 */
export function annualComparison(items: QuoteLineItem[]): AnnualComparison {
  let monthlyScenario = 0
  let yearlyScenario = 0
  let recurringSaving = 0
  let setupSaving = 0
  let eligible = false
  for (const item of items) {
    if (item.billing_period === "one_time") {
      const promo = annualSetupPromo(item)
      if (!promo) continue
      monthlyScenario += promo.normalPrice
      yearlyScenario += promo.annualPrice
      setupSaving += promo.saving
      continue
    }
    if (!hasAnnualBillingOption(item)) continue
    const monthly = applyBillingPreference(item, "monthly")
    const yearly = applyBillingPreference(item, "yearly")
    if (monthly.billing_period !== "monthly" || yearly.billing_period !== "yearly") continue
    eligible = true
    const annualized = (Number(monthly.amount) || 0) * 12
    const yearlyAmount = Number(yearly.amount) || 0
    monthlyScenario += annualized
    yearlyScenario += yearlyAmount
    recurringSaving += Math.max(0, annualized - yearlyAmount)
  }
  const amount = round2(Math.max(0, monthlyScenario - yearlyScenario))
  return {
    eligible,
    monthlyScenario: round2(monthlyScenario),
    yearlyScenario: round2(yearlyScenario),
    recurringSaving: round2(recurringSaving),
    setupSaving: round2(setupSaving),
    amount,
    pct: monthlyScenario > 0 ? Math.round((amount / monthlyScenario) * 1000) / 10 : 0,
  }
}

export function createCommercialServiceLine(parent: QuoteLineItem, service: "configuration_support" | "full_setup", config: CommercialServiceConfig): QuoteLineItem | null {
  if (!config.enabled) return null
  const price = Math.max(0, Number(config.price) || 0)
  const label = service === "configuration_support" ? "Supporto alla configurazione" : "Setup completo"
  const id = `${parent.id || crypto.randomUUID()}:${service}`
  const annualMode = config.annual_setup_mode ?? (config.free_on_annual ? "free" : "full")
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
    free_on_annual: annualMode === "free",
    annual_setup_mode: annualMode,
    annual_setup_discount_pct: Math.min(100, Math.max(0, Number(config.annual_setup_discount_pct) || 0)),
    normal_price: price,
  })
}
