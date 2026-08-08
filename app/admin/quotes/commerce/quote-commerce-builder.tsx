"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  calculateQuoteLine,
  calculateQuoteTotal,
  formatQuoteAmount,
  isQuoteLineSelected,
  type QuoteLineItem,
  type QuoteProject,
  type QuoteRequestedField,
} from "@/lib/quotes/types"
import {
  annualSaving,
  createCommercialServiceLine,
  dependencyErrors,
  getCommercialMeta,
  setCommercialMeta,
  type AnnualSetupMode,
  type BillingOption,
  type CommercialDependency,
  type CommercialServiceConfig,
} from "@/lib/quotes/commercial"

type CatalogItem = {
  id: string
  source_id?: string
  project: "hotelaccelerator" | "santaddeo" | "hotelprofitai" | "manubot"
  kind: "plan" | "module" | "setup" | "service"
  name: string
  description?: string
  features: string[]
  unit_amount: number
  currency: string
  billing_period: "one_time" | "monthly" | "quarterly" | "yearly"
  trial_days?: number
  support?: QuoteLineItem["support"]
  version?: string
  configuration_schema?: Record<string, unknown>
  raw_snapshot: Record<string, unknown>
  stripe_price_id?: string | null
  billing_family?: string
  alternative_period?: BillingOption | null
  dependency?: CommercialDependency | null
}

type CatalogGroup = { project: string; items: CatalogItem[]; configured: boolean; error: string | null }
type AccommodationType = "camere" | "appartamenti" | "piazzole"
type StructureOption = { value: string; label: string; accommodation_type: AccommodationType; unit_label: string }
type ManualKind = "module" | "setup" | "service" | "consulting" | "custom"
type SantaddeoConfig = {
  pricing_model: "per_accommodation"
  pricing_config_id: string
  pricing_config_name: string
  structure_type: string
  accommodation_type: AccommodationType
  star_rating: number
  accommodations: number
  fee_base_value: number
  coefficients: Record<AccommodationType, number>
  structure_options: StructureOption[]
  unit_label: string
  formula?: string
}

const PROJECT_LABELS: Record<string, string> = {
  hotelaccelerator: "HotelAccelerator — Suite",
  santaddeo: "Santaddeo — Revenue",
  hotelprofitai: "HotelProfitAI — Controllo di gestione",
  manubot: "ManuBot — Operations",
  consulting: "Consulenza 4Bid",
  custom: "Voce manuale",
}
const FIELD_TYPES: { value: QuoteRequestedField["type"]; label: string }[] = [
  { value: "text", label: "Testo breve" },
  { value: "textarea", label: "Testo lungo" },
  { value: "credentials", label: "Credenziale (ID + Password)" },
  { value: "password", label: "Solo password" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL / Link" },
]
const DEFAULT_STRUCTURE_OPTIONS: StructureOption[] = [
  { value: "hotel", label: "Hotel / Albergo", accommodation_type: "camere", unit_label: "camere" },
  { value: "resort", label: "Resort", accommodation_type: "camere", unit_label: "camere" },
  { value: "bb", label: "B&B / Affittacamere", accommodation_type: "camere", unit_label: "camere" },
  { value: "agriturismo", label: "Agriturismo", accommodation_type: "camere", unit_label: "camere" },
  { value: "residence", label: "Residence / Appartamenti", accommodation_type: "appartamenti", unit_label: "appartamenti" },
  { value: "casa_vacanze", label: "Casa vacanze", accommodation_type: "appartamenti", unit_label: "appartamenti" },
  { value: "campeggio", label: "Campeggio", accommodation_type: "piazzole", unit_label: "piazzole" },
]
const ACCOMMODATION_OPTIONS: Array<{ value: AccommodationType; label: string; singular: string }> = [
  { value: "camere", label: "Camere", singular: "camera" },
  { value: "appartamenti", label: "Appartamenti / unità abitative", singular: "appartamento" },
  { value: "piazzole", label: "Piazzole", singular: "piazzola" },
]
const renewalTerms = "Gli abbonamenti hanno durata mensile o annuale secondo la formula selezionata, con rinnovo automatico alla scadenza. Il cliente può disdire il rinnovo per il periodo successivo senza penali."

function futureDate(days = 7) {
  const date = new Date(Date.now() + days * 86400000)
  date.setSeconds(0, 0)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
function obj(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function clampStars(value: unknown) { return Math.min(5, Math.max(1, Math.round(Number(value) || 1))) }
function clampUnits(value: unknown) { return Math.max(1, Math.round(Number(value) || 1)) }
function isAccommodationType(value: unknown): value is AccommodationType { return value === "camere" || value === "appartamenti" || value === "piazzole" }
function accommodationSingular(type: AccommodationType) { return ACCOMMODATION_OPTIONS.find(o => o.value === type)?.singular || "sistemazione" }
function isSantaddeoRms(item: Pick<QuoteLineItem, "project" | "kind" | "source_product_id">) { return item.project === "santaddeo" && item.kind === "plan" && String(item.source_product_id || "").startsWith("rms-fee:") }
function newFieldKey() { return `field_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}` }

function normalizeSantaddeoConfig(value: unknown): SantaddeoConfig {
  const raw = obj(value)
  const coeffs = obj(raw.coefficients)
  const rawOptions = Array.isArray(raw.structure_options) ? raw.structure_options : DEFAULT_STRUCTURE_OPTIONS
  const options = rawOptions.map((entry) => {
    const row = obj(entry)
    const accommodation = isAccommodationType(row.accommodation_type) ? row.accommodation_type : "camere"
    return { value: String(row.value || "hotel"), label: String(row.label || row.value || "Hotel"), accommodation_type: accommodation, unit_label: accommodation } satisfies StructureOption
  })
  const structure = String(raw.structure_type || options[0]?.value || "hotel")
  const fallback = options.find(o => o.value === structure)?.accommodation_type || "camere"
  const accommodation = isAccommodationType(raw.accommodation_type) ? raw.accommodation_type : fallback
  return {
    pricing_model: "per_accommodation",
    pricing_config_id: String(raw.pricing_config_id || ""),
    pricing_config_name: String(raw.pricing_config_name || "Listino Santaddeo"),
    structure_type: structure,
    accommodation_type: accommodation,
    star_rating: clampStars(raw.star_rating ?? 3),
    accommodations: clampUnits(raw.accommodations ?? 1),
    fee_base_value: Math.max(0, Number(raw.fee_base_value) || 0),
    coefficients: { camere: Math.max(0, Number(coeffs.camere) || 0), appartamenti: Math.max(0, Number(coeffs.appartamenti) || 0), piazzole: Math.max(0, Number(coeffs.piazzole) || 0) },
    structure_options: options,
    unit_label: accommodation,
    formula: raw.formula ? String(raw.formula) : undefined,
  }
}
function santaddeoUnitPrice(config: SantaddeoConfig) { return Math.round(config.fee_base_value * (config.coefficients[config.accommodation_type] || 0) * config.star_rating * 100) / 100 }

function manualItem(kind: ManualKind): QuoteLineItem {
  const labels: Record<ManualKind, string> = {
    module: "Nuovo modulo manuale",
    setup: "Setup / attivazione",
    service: "Servizio una tantum",
    consulting: "Consulenza 4Bid",
    custom: "Voce manuale",
  }
  const recurring = kind === "module"
  let line: QuoteLineItem = {
    id: crypto.randomUUID(),
    kind,
    project: kind === "consulting" ? "consulting" : "custom",
    name: labels[kind],
    description: labels[kind],
    quantity: 1,
    unit_amount: 0,
    amount: 0,
    billing_period: recurring ? "monthly" : "one_time",
    trial_days: 0,
    features: [],
    discount: null,
    support: null,
    configuration: {},
    catalog_snapshot: { source: "manual" },
    optional: kind === "module" || kind === "service",
    default_selected: true,
  }
  if (recurring) {
    line = setCommercialMeta(line, {
      billing_family: `manual:${line.id}`,
      billing_options: { monthly: { billing_period: "monthly", unit_amount: 0 } },
      configuration_support: { enabled: false, price: 0, free_on_annual: false, annual_setup_mode: "full", annual_setup_discount_pct: 0 },
      full_setup: { enabled: false, price: 0, free_on_annual: false, annual_setup_mode: "full", annual_setup_discount_pct: 0 },
    })
  } else if (kind === "setup") {
    line = setCommercialMeta(line, { normal_price: 0, annual_setup_mode: "full", annual_setup_discount_pct: 0, free_on_annual: false })
  }
  return line
}

export default function QuoteCommerceBuilder() {
  const router = useRouter()
  const [catalog, setCatalog] = useState<CatalogGroup[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState({ name: "", company: "", email: "", vat: "", address: "" })
  const [title, setTitle] = useState("Soluzioni digitali 4Bid")
  const [description, setDescription] = useState("")
  const [paymentTerms, setPaymentTerms] = useState(renewalTerms)
  const [expiresAt, setExpiresAt] = useState(futureDate(7))
  const [vatIncluded, setVatIncluded] = useState(true)
  const [items, setItems] = useState<QuoteLineItem[]>([])
  const [requestedFields, setRequestedFields] = useState<QuoteRequestedField[]>([])

  useEffect(() => {
    fetch("/api/quotes/catalog", { cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("Catalogo non disponibile"); return r.json() })
      .then(data => setCatalog(Array.isArray(data) ? data : data.projects ?? []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoadingCatalog(false))
  }, [])

  const displayCatalog = useMemo(() => catalog.map(group => ({
    ...group,
    items: group.items.filter(item => item.billing_period !== "yearly" || !group.items.some(other => other.billing_family === item.billing_family && other.billing_period === "monthly")),
  })), [catalog])
  const calculated = useMemo(() => items.map(calculateQuoteLine), [items])
  const total = useMemo(() => calculateQuoteTotal(items), [items])
  const oneTime = calculated.filter(i => isQuoteLineSelected(i) && i.billing_period === "one_time").reduce((s, i) => s + i.amount, 0)
  const recurring = calculated.filter(i => isQuoteLineSelected(i) && i.billing_period !== "one_time")

  function patchItem(index: number, patch: Partial<QuoteLineItem>) {
    setItems(current => current.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, ...patch }
      if (item.kind === "setup" && item.billing_period === "one_time" && patch.unit_amount != null) {
        return setCommercialMeta(next, { normal_price: Math.max(0, Number(patch.unit_amount) || 0) })
      }
      return next
    }))
  }
  function patchMeta(index: number, patch: Parameters<typeof setCommercialMeta>[1]) { setItems(current => current.map((item, i) => i === index ? setCommercialMeta(item, patch) : item)) }
  function moveItem(index: number, direction: -1 | 1) {
    setItems(current => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }
  function addManual(kind: ManualKind) { setItems(current => [...current, manualItem(kind)]) }
  function setField(index: number, patch: Partial<QuoteRequestedField>) { setRequestedFields(current => current.map((field, i) => i === index ? { ...field, ...patch } : field)) }
  function addField() { setRequestedFields(current => [...current, { key: newFieldKey(), label: "", type: "credentials", required: true }]) }

  function patchSantaddeo(index: number, patch: Partial<SantaddeoConfig>) {
    setItems(current => current.map((item, i) => {
      if (i !== index) return item
      const next = { ...normalizeSantaddeoConfig(item.configuration), ...patch }
      next.star_rating = clampStars(next.star_rating); next.accommodations = clampUnits(next.accommodations); next.unit_label = next.accommodation_type
      const unit = santaddeoUnitPrice(next)
      const meta = getCommercialMeta(item)
      const annual = meta.billing_options?.yearly
      const annualPct = annual && unit > 0 ? Number(annual.discount_pct ?? annualSaving(Number(meta.billing_options?.monthly?.unit_amount ?? unit), annual.unit_amount).pct) : 0
      return setCommercialMeta({ ...item, configuration: { ...obj(item.configuration), ...next }, quantity: next.accommodations, unit_amount: unit, amount: unit * next.accommodations }, {
        billing_options: {
          ...(meta.billing_options || {}),
          monthly: { billing_period: "monthly", unit_amount: unit, trial_days: item.trial_days },
          ...(annual ? { yearly: { ...annual, unit_amount: Math.round(unit * 12 * (1 - annualPct / 100) * 100) / 100, discount_pct: annualPct } } : {}),
        },
      })
    }))
  }

  function hasBase(project: string) { return items.some(i => i.project === project && i.kind === "plan") }
  function addCatalogItem(item: CatalogItem) {
    const dep = item.dependency
    if (dep?.requires_base && !hasBase(dep.project || item.project)) return toast.error(`Prima seleziona un piano base ${PROJECT_LABELS[dep.project || item.project] || dep.project || item.project}`)
    if (dep?.linked_project && ["santaddeo", "hotelprofitai", "manubot"].includes(dep.linked_project) && !hasBase(dep.linked_project)) return toast.error(`Questo modulo richiede anche l'attivazione ${PROJECT_LABELS[dep.linked_project] || dep.linked_project}`)
    const baseOptions: Partial<Record<"monthly" | "yearly", BillingOption>> = {}
    if (item.billing_period === "monthly" || item.billing_period === "yearly") baseOptions[item.billing_period] = { billing_period: item.billing_period, unit_amount: item.unit_amount, stripe_price_id: item.stripe_price_id, trial_days: item.trial_days }
    if (item.alternative_period) baseOptions[item.alternative_period.billing_period] = item.alternative_period
    let line: QuoteLineItem = {
      id: crypto.randomUUID(), kind: item.kind, project: item.project, source_product_id: item.id, catalog_version: item.version || "current",
      name: item.name, description: item.description || item.name, features: item.features, quantity: 1, unit_amount: item.unit_amount,
      list_amount: item.unit_amount, amount: item.unit_amount, billing_period: item.billing_period === "yearly" && baseOptions.monthly ? "monthly" : item.billing_period,
      trial_days: item.trial_days || 0, support: item.support || null, discount: null,
      configuration: item.configuration_schema || {}, catalog_snapshot: item.raw_snapshot, optional: false, default_selected: true,
    }
    line = setCommercialMeta(line, { billing_family: item.billing_family || item.source_id || item.id, billing_options: baseOptions, dependency: dep || null, configuration_support: { enabled: false, price: 0, free_on_annual: false, annual_setup_mode: "full", annual_setup_discount_pct: 0 }, full_setup: { enabled: false, price: 0, free_on_annual: false, annual_setup_mode: "full", annual_setup_discount_pct: 0 } })
    if (isSantaddeoRms(line)) {
      const config = normalizeSantaddeoConfig(item.configuration_schema)
      const unit = santaddeoUnitPrice(config)
      const sourceMonthly = baseOptions.monthly
      const sourceYearly = baseOptions.yearly
      const annualPct = sourceYearly && sourceMonthly?.unit_amount
        ? Number(sourceYearly.discount_pct ?? annualSaving(sourceMonthly.unit_amount, sourceYearly.unit_amount).pct)
        : sourceYearly ? Number(sourceYearly.discount_pct || 0) : 0
      line = setCommercialMeta({ ...line, configuration: { ...obj(line.configuration), ...config }, quantity: config.accommodations, unit_amount: unit, amount: unit * config.accommodations }, {
        billing_options: {
          ...baseOptions,
          monthly: { ...(sourceMonthly || {}), billing_period: "monthly", unit_amount: unit, trial_days: line.trial_days },
          ...(sourceYearly ? { yearly: { ...sourceYearly, billing_period: "yearly", unit_amount: Math.round(unit * 12 * (1 - annualPct / 100) * 100) / 100, discount_pct: annualPct } } : {}),
        },
      })
    }
    setItems(current => [...current, line])
  }

  function setAnnualDiscount(index: number, pctValue: number) {
    const item = items[index]
    const meta = getCommercialMeta(item)
    const monthlyUnit = Number(meta.billing_options?.monthly?.unit_amount ?? item.unit_amount ?? 0)
    const pct = Math.min(100, Math.max(0, Number(pctValue) || 0))
    const annualUnit = Math.round(monthlyUnit * 12 * (1 - pct / 100) * 100) / 100
    patchMeta(index, { billing_options: { ...(meta.billing_options || {}), monthly: meta.billing_options?.monthly || { billing_period: "monthly", unit_amount: monthlyUnit }, yearly: { ...(meta.billing_options?.yearly || {}), billing_period: "yearly", unit_amount: annualUnit, discount_pct: pct } } })
  }
  function patchService(index: number, key: "configuration_support" | "full_setup", patch: Partial<CommercialServiceConfig>) {
    const meta = getCommercialMeta(items[index])
    patchMeta(index, { [key]: { ...(meta[key] || {}), ...patch } })
  }
  function setSetupAnnualPolicy(index: number, mode: AnnualSetupMode, discountPct?: number) {
    const item = items[index]
    const meta = getCommercialMeta(item)
    patchMeta(index, {
      normal_price: Math.max(0, Number(meta.normal_price ?? item.unit_amount ?? 0)),
      annual_setup_mode: mode,
      annual_setup_discount_pct: mode === "discount" ? Math.min(100, Math.max(0, Number(discountPct ?? meta.annual_setup_discount_pct) || 0)) : 0,
      free_on_annual: mode === "free",
    })
  }
  function changeBilling(index: number, value: QuoteLineItem["billing_period"]) {
    const item = items[index]
    patchItem(index, { billing_period: value })
    if (value === "monthly" || value === "yearly") {
      const meta = getCommercialMeta(item)
      patchMeta(index, { billing_family: meta.billing_family || `manual:${item.id || index}`, billing_options: { ...(meta.billing_options || {}), [value]: { billing_period: value, unit_amount: Number(item.unit_amount) || 0, trial_days: item.trial_days } } })
    }
  }

  async function save() {
    if (!client.name.trim() && !client.company.trim()) return toast.error("Inserisci referente o azienda")
    if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) return toast.error("Imposta una data di validità futura")
    if (!items.length || items.some(i => !i.description.trim())) return toast.error("Aggiungi e completa almeno una voce")
    if (requestedFields.some(field => !field.label.trim())) return toast.error("Completa l'etichetta di tutti i dati richiesti al cliente")
    const depErrors = dependencyErrors(items)
    if (depErrors.length) return toast.error(depErrors[0])
    for (const item of items) {
      if (!isSantaddeoRms(item)) continue
      const config = normalizeSantaddeoConfig(item.configuration)
      if (!config.pricing_config_id || santaddeoUnitPrice(config) <= 0) return toast.error("Configurazione Santaddeo non valida")
    }

    const expanded: QuoteLineItem[] = []
    for (const item of calculated) {
      expanded.push(item)
      if (item.kind !== "module") continue
      const meta = getCommercialMeta(item)
      const supportLine = createCommercialServiceLine(item, "configuration_support", meta.configuration_support || {})
      const setupLine = createCommercialServiceLine(item, "full_setup", meta.full_setup || {})
      if (supportLine) expanded.push(supportLine)
      if (setupLine) expanded.push(setupLine)
    }

    setSaving(true)
    try {
      const res = await fetch("/api/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: client.name, client_company: client.company || null, client_email: client.email || null, client_vat: client.vat || null, client_address: client.address || null, title, description, payment_terms: paymentTerms || renewalTerms, line_items: expanded, vat_included: vatIncluded, currency: "eur", requested_fields: requestedFields, expires_at: new Date(expiresAt).toISOString() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Salvataggio fallito")
      toast.success("Preventivo commerciale creato")
      router.push("/admin/quotes"); router.refresh()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return <div className="max-w-7xl mx-auto space-y-8">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Nuovo preventivo commerciale</h1><p className="text-muted-foreground">Catalogo live + voci manuali + dati da richiedere al cliente</p></div><Button variant="outline" onClick={() => router.push("/admin/quotes")}><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button></div>

    <section className="border rounded-xl p-5 space-y-4 bg-card"><h2 className="font-semibold text-lg">Cliente e validità offerta</h2><div className="grid md:grid-cols-2 gap-4">{([['name','Referente'],['company','Azienda'],['email','Email'],['vat','P.IVA / CF'],['address','Indirizzo']] as const).map(([key,label]) => <div key={key} className={key === 'address' ? 'md:col-span-2 space-y-1.5' : 'space-y-1.5'}><Label>{label}</Label><Input type={key === 'email' ? 'email' : 'text'} value={client[key]} onChange={e => setClient(v => ({...v,[key]:e.target.value}))} /></div>)}<div className="space-y-1.5"><Label>Offerta valida fino al *</Label><Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div></div></section>

    <section className="border rounded-xl p-5 space-y-4 bg-card"><h2 className="font-semibold text-lg">Proposta</h2><div><Label>Titolo</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div><div><Label>Descrizione</Label><Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></div><div><Label>Condizioni</Label><Textarea rows={4} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} /></div></section>

    <section className="border rounded-xl p-5 space-y-4 bg-card"><div className="flex justify-between"><div><h2 className="font-semibold text-lg">Catalogo prodotti</h2><p className="text-xs text-muted-foreground">Fonte live: database dei singoli progetti.</p></div>{loadingCatalog && <span className="text-sm">Caricamento…</span>}</div><div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{displayCatalog.map(group => <div key={group.project} className="border rounded-lg p-3 space-y-2"><h3 className="font-semibold">{PROJECT_LABELS[group.project] || group.project}</h3>{group.error && <p className="text-xs text-destructive">{group.error}</p>}{group.items.map(item => <button type="button" key={item.id} onClick={() => addCatalogItem(item)} className="w-full text-left border rounded-md p-3 hover:bg-muted"><span className="font-medium block">{item.name}</span><span className="text-xs text-muted-foreground">{item.dependency?.requires_base ? "Richiede piano base · " : ""}{item.unit_amount > 0 ? `${formatQuoteAmount(item.unit_amount,item.currency)} / ${item.billing_period === 'monthly' ? 'mese' : item.billing_period}` : "Prezzo configurabile"}{item.alternative_period?.billing_period === 'yearly' ? " · annuale disponibile" : ""}</span></button>)}</div>)}</div></section>

    <section className="border-2 border-dashed rounded-xl p-5 bg-card space-y-3"><div><h2 className="font-semibold text-lg">Aggiungi manualmente</h2><p className="text-sm text-muted-foreground">Usa queste voci per offerte fuori catalogo: moduli, setup, consulenza o servizi.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => addManual("module")}><Plus className="h-4 w-4 mr-2" />Modulo manuale</Button><Button variant="outline" onClick={() => addManual("setup")}><Plus className="h-4 w-4 mr-2" />Setup / una tantum</Button><Button variant="outline" onClick={() => addManual("service")}><Plus className="h-4 w-4 mr-2" />Servizio</Button><Button variant="outline" onClick={() => addManual("consulting")}><Plus className="h-4 w-4 mr-2" />Consulenza</Button><Button variant="ghost" onClick={() => addManual("custom")}><Plus className="h-4 w-4 mr-2" />Altra voce</Button></div></section>

    <section className="space-y-4"><h2 className="font-semibold text-xl">Voci del preventivo</h2>{items.map((item,index) => {
      const meta = getCommercialMeta(item)
      const santaddeo = isSantaddeoRms(item) ? normalizeSantaddeoConfig(item.configuration) : null
      const monthlyUnit = Number(meta.billing_options?.monthly?.unit_amount ?? item.unit_amount ?? 0)
      const yearlyUnit = meta.billing_options?.yearly?.unit_amount
      const annual = yearlyUnit != null ? annualSaving(monthlyUnit, yearlyUnit) : null
      const isManual = obj(item.catalog_snapshot).source === "manual"
      const setupAnnualMode: AnnualSetupMode = meta.annual_setup_mode ?? (meta.free_on_annual ? "free" : "full")
      return <div key={item.id || index} className="border rounded-xl p-5 bg-card space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-3 md:grid-cols-2">
            <div><Label>Nome</Label><Input value={item.name || ""} onChange={e => patchItem(index, { name: e.target.value })} /></div>
            <div><Label>Progetto / tipo</Label>{isManual ? <Select value={item.project || "custom"} onValueChange={project => patchItem(index, { project: project as QuoteProject })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hotelaccelerator">HotelAccelerator</SelectItem><SelectItem value="santaddeo">Santaddeo</SelectItem><SelectItem value="hotelprofitai">HotelProfitAI</SelectItem><SelectItem value="manubot">ManuBot</SelectItem><SelectItem value="consulting">Consulenza 4Bid</SelectItem><SelectItem value="custom">Voce manuale</SelectItem></SelectContent></Select> : <Input readOnly value={`${PROJECT_LABELS[item.project || "custom"] || item.project || "custom"} · ${item.kind || "voce"}`} />}</div>
          </div>
          <div className="flex items-center gap-1 self-end" aria-label={`Ordinamento voce ${index + 1}`}>
            <span className="min-w-14 text-center text-xs font-semibold text-muted-foreground">{index + 1} di {items.length}</span>
            <Button type="button" size="icon" variant="outline" disabled={index === 0} onClick={() => moveItem(index, -1)} aria-label={`Sposta ${item.name || "voce"} su`}><ArrowUp className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="outline" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} aria-label={`Sposta ${item.name || "voce"} giù`}><ArrowDown className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => setItems(v => v.filter((_, i) => i !== index))} aria-label={`Elimina ${item.name || "voce"}`}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <div><Label>Descrizione</Label><Textarea value={item.description} onChange={e => patchItem(index,{description:e.target.value})} /></div>

        {santaddeo ? <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3"><h3 className="font-semibold">Configurazione Santaddeo</h3><div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"><div><Label>Tipo struttura</Label><Select value={santaddeo.structure_type} onValueChange={v => patchSantaddeo(index,{structure_type:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{santaddeo.structure_options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Tipo sistemazioni</Label><Select value={santaddeo.accommodation_type} onValueChange={v => patchSantaddeo(index,{accommodation_type:v as AccommodationType})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCOMMODATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Categoria / stelle</Label><Select value={String(santaddeo.star_rating)} onValueChange={v => patchSantaddeo(index,{star_rating:Number(v)})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(s => <SelectItem key={s} value={String(s)}>{s} {"★".repeat(s)}</SelectItem>)}</SelectContent></Select></div><div><Label>Numero sistemazioni</Label><Input type="number" min="1" value={santaddeo.accommodations} onChange={e => patchSantaddeo(index,{accommodations:Number(e.target.value)})} /></div><div><Label>Prezzo / {accommodationSingular(santaddeo.accommodation_type)} / mese</Label><Input readOnly value={formatQuoteAmount(santaddeoUnitPrice(santaddeo))} /></div></div></div> : <div className={`grid gap-3 ${isManual ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}><div><Label>Quantità</Label><Input type="number" min="1" value={item.quantity || 1} onChange={e => patchItem(index,{quantity:Number(e.target.value)})} /></div><div><Label>{item.billing_period === 'one_time' ? 'Prezzo unitario' : 'Canone unitario'}</Label><Input type="number" min="0" step="0.01" value={item.unit_amount || 0} onChange={e => { const value=Number(e.target.value); patchItem(index,{unit_amount:value}); if(item.kind==='setup') patchMeta(index,{normal_price:value}); if(item.billing_period==='monthly') patchMeta(index,{billing_options:{...(meta.billing_options||{}),monthly:{...(meta.billing_options?.monthly||{billing_period:'monthly'}),billing_period:'monthly',unit_amount:value}}}) }} /></div>{isManual && <div><Label>Periodicità</Label><Select value={item.billing_period || 'one_time'} onValueChange={v => changeBilling(index, v as QuoteLineItem['billing_period'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">Una tantum</SelectItem><SelectItem value="monthly">Mensile</SelectItem><SelectItem value="quarterly">Trimestrale</SelectItem><SelectItem value="yearly">Annuale</SelectItem></SelectContent></Select></div>}<div><Label>Trial giorni</Label><Input type="number" min="0" value={item.trial_days || 0} onChange={e => patchItem(index,{trial_days:Number(e.target.value)})} /></div></div>}

        {item.billing_period !== "one_time" ? <div className="rounded-lg border p-4 bg-muted/20 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong>Formula abbonamento</strong><p className="text-xs text-muted-foreground">Mensile mostrato di default al cliente. Annuale configurabile.</p></div>{annual && annual.amount > 0 ? <span className="text-sm font-semibold text-emerald-700">Annuale: risparmio {formatQuoteAmount(annual.amount)} ({annual.pct}%)</span> : null}</div><div className="grid sm:grid-cols-3 gap-3"><div><Label>Mensile</Label><Input readOnly value={formatQuoteAmount(monthlyUnit)} /></div><div><Label>Sconto annuale %</Label><Input type="number" min="0" max="100" step="0.1" value={annual?.pct ?? ''} placeholder="Imposta per attivare annuale" onChange={e => setAnnualDiscount(index,Number(e.target.value))} /></div><div><Label>Annuale</Label><Input readOnly value={yearlyUnit != null ? formatQuoteAmount(yearlyUnit) : 'Non configurato'} /></div></div></div> : null}

        {item.kind === "setup" && item.billing_period === "one_time" ? <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3"><div className="flex items-center justify-between gap-3"><div><strong>Agevolazione setup con piano annuale</strong><p className="text-xs text-muted-foreground">Decidi dal Superadmin se il setup resta pieno, viene scontato o azzerato quando il cliente sceglie l'annuale.</p></div><Switch checked={setupAnnualMode !== "full"} onCheckedChange={enabled => setSetupAnnualPolicy(index, enabled ? "free" : "full")} /></div>{setupAnnualMode !== "full" ? <div className="grid sm:grid-cols-2 gap-3"><div><Label>Trattamento con annuale</Label><Select value={setupAnnualMode} onValueChange={value => setSetupAnnualPolicy(index, value as AnnualSetupMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="discount">Scontato</SelectItem><SelectItem value="free">Azzerato / omaggio</SelectItem></SelectContent></Select></div>{setupAnnualMode === "discount" ? <div><Label>Sconto setup %</Label><Input type="number" min="0" max="100" step="0.1" value={meta.annual_setup_discount_pct || 0} onChange={e => setSetupAnnualPolicy(index,"discount",Number(e.target.value))} /></div> : <div className="flex items-end"><p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Setup azzerato con formula annuale</p></div>}</div> : <p className="text-xs text-muted-foreground">Disattivato: il setup viene addebitato per intero anche con formula annuale.</p>}</div> : null}

        {item.kind === "module" ? <div className="grid lg:grid-cols-2 gap-4"><ServiceBox label="Supporto alla configurazione" config={meta.configuration_support || {}} onChange={patch => patchService(index,"configuration_support",patch)} /><ServiceBox label="Setup completo" config={meta.full_setup || {}} onChange={patch => patchService(index,"full_setup",patch)} /></div> : null}

        <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap items-center gap-6"><div className="flex items-center gap-2"><Switch checked={!!item.optional} disabled={item.kind === 'plan'} onCheckedChange={optional => patchItem(index,{optional,default_selected:optional ? item.default_selected !== false : true})}/><div><Label>Voce opzionale</Label><p className="text-xs text-muted-foreground">Il cliente può includerla o escluderla.</p></div></div>{item.optional ? <div className="flex items-center gap-2"><Switch checked={item.default_selected !== false} onCheckedChange={default_selected => patchItem(index,{default_selected})}/><Label>Preselezionata</Label></div> : <span className="text-xs font-medium text-primary">Obbligatoria</span>}</div>

        <div className="grid sm:grid-cols-3 gap-3"><div><Label>Tipo sconto</Label><Select value={item.discount?.type || 'none'} onValueChange={v => patchItem(index,{discount:v==='none'?null:{type:v as 'percentage'|'fixed',value:item.discount?.value||0}})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nessuno</SelectItem><SelectItem value="percentage">Percentuale</SelectItem><SelectItem value="fixed">Importo fisso</SelectItem></SelectContent></Select></div><div><Label>Valore sconto</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.value || 0} onChange={e => patchItem(index,{discount:item.discount?{...item.discount,value:Number(e.target.value)}:null})} /></div><div><Label>Durata sconto (mesi)</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.duration_months || ''} onChange={e => patchItem(index,{discount:item.discount?{...item.discount,duration_months:e.target.value?Number(e.target.value):null}:null})} /></div></div>
        <div className="grid md:grid-cols-2 gap-3"><div><Label>Funzionalità incluse</Label><Textarea rows={4} value={(item.features||[]).join('\n')} onChange={e => patchItem(index,{features:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})} /></div><div><Label>Assistenza / SLA</Label><Textarea rows={4} value={item.support?.notes || ''} onChange={e => patchItem(index,{support:{...(item.support||{}),notes:e.target.value}})} placeholder="Canali, orari, tempi di risposta, account manager…" /></div></div>
      </div>
    })}</section>

    <section className="border rounded-xl p-5 bg-card space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-lg">Dati da richiedere al cliente</h2><p className="text-sm text-muted-foreground">Credenziali, email, URL, testi o altri dati necessari dopo l'accettazione.</p></div><Button variant="outline" onClick={addField}><Plus className="h-4 w-4 mr-2" />Aggiungi campo</Button></div>{requestedFields.length === 0 ? <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nessun dato aggiuntivo richiesto. Puoi chiedere, ad esempio, accessi Booking.com, Expedia, PMS o dati tecnici.</div> : <div className="space-y-3">{requestedFields.map((field,index) => <div key={field.key} className="rounded-lg border p-4 space-y-3"><div className="grid md:grid-cols-[1fr_220px_auto] gap-3 items-end"><div><Label>Etichetta campo</Label><Input value={field.label} onChange={e => setField(index,{label:e.target.value})} placeholder="Es. Credenziali Booking.com" /></div><div><Label>Tipo</Label><Select value={field.type} onValueChange={v => setField(index,{type:v as QuoteRequestedField['type']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIELD_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div><Button size="icon" variant="ghost" onClick={() => setRequestedFields(current => current.filter((_,i)=>i!==index))}><X className="h-4 w-4" /></Button></div><div><Label>Indicazioni per il cliente (facoltative)</Label><Input value={field.help || ''} onChange={e => setField(index,{help:e.target.value})} placeholder="Es. Inserire username e password dell'account amministratore" /></div><div className="flex items-center gap-2"><Switch checked={field.required} onCheckedChange={required => setField(index,{required})}/><Label>Obbligatorio</Label></div></div>)}</div>}</section>

    <section className="sticky bottom-4 border rounded-xl p-5 bg-background/95 backdrop-blur shadow-lg flex flex-wrap justify-between items-center gap-4"><div><p className="text-sm text-muted-foreground">Una tantum: {formatQuoteAmount(oneTime)}</p>{recurring.map((i,k)=><p key={k} className="text-sm text-muted-foreground">{i.name || i.description}: {formatQuoteAmount(i.amount)} / {i.billing_period === 'yearly' ? 'anno' : i.billing_period === 'quarterly' ? 'trimestre' : 'mese'}</p>)}<p className="text-2xl font-bold">Totale configurato: {formatQuoteAmount(total)}</p><p className="text-xs text-muted-foreground">Scadenza: {expiresAt ? new Date(expiresAt).toLocaleString('it-IT') : '—'}</p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><Switch checked={vatIncluded} onCheckedChange={setVatIncluded}/><Label>IVA inclusa</Label></div><Button size="lg" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving?'Salvataggio…':'Crea preventivo'}</Button></div></section>
  </div>
}

function ServiceBox({ label, config, onChange }: { label: string; config: CommercialServiceConfig; onChange: (patch: Partial<CommercialServiceConfig>) => void }) {
  const mode: AnnualSetupMode = config.annual_setup_mode ?? (config.free_on_annual ? "free" : "full")
  const setMode = (annual_setup_mode: AnnualSetupMode) => onChange({ annual_setup_mode, free_on_annual: annual_setup_mode === "free", annual_setup_discount_pct: annual_setup_mode === "discount" ? (config.annual_setup_discount_pct || 0) : 0 })
  return <div className="rounded-lg border p-4 space-y-3"><div className="flex items-center justify-between gap-3"><div><strong>{label}</strong><p className="text-xs text-muted-foreground">Servizio una tantum opzionale</p></div><Switch checked={!!config.enabled} onCheckedChange={enabled => onChange({enabled})} /></div>{config.enabled ? <><div><Label>Prezzo una tantum</Label><Input type="number" min="0" step="0.01" value={config.price || 0} onChange={e => onChange({price:Number(e.target.value)})} /></div><div className="rounded-md border bg-muted/20 p-3 space-y-3"><div className="flex items-center justify-between gap-3"><div><Label>Agevolazione con piano annuale</Label><p className="text-xs text-muted-foreground">Puoi scontare o azzerare questa attivazione.</p></div><Switch checked={mode !== "full"} onCheckedChange={enabled => setMode(enabled ? "free" : "full")} /></div>{mode !== "full" ? <div className="grid sm:grid-cols-2 gap-3"><div><Label>Trattamento</Label><Select value={mode} onValueChange={value => setMode(value as AnnualSetupMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="discount">Scontato</SelectItem><SelectItem value="free">Azzerato / omaggio</SelectItem></SelectContent></Select></div>{mode === "discount" ? <div><Label>Sconto %</Label><Input type="number" min="0" max="100" step="0.1" value={config.annual_setup_discount_pct || 0} onChange={e => onChange({annual_setup_discount_pct:Number(e.target.value), free_on_annual:false})} /></div> : null}</div> : null}</div></> : null}</div>
}
