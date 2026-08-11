"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, GripVertical, Plus, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import CompanyLookupField, { formatCompanyAddress, type CompanyLookupData } from "@/components/admin/company-lookup-field"
import {
  calculateQuoteLine,
  calculateQuoteTotal,
  formatQuoteAmount,
  isQuoteLineSelected,
    type QuoteLineItem,
    type QuoteProject,
    type QuoteRequestedField,
  type SalesChannelQuote,
} from "@/lib/quotes/types"
import { duplicateQuoteLineAt, getCommercialMeta, setCommercialMeta, syncAnnualPlanPrice, type AnnualSetupMode, type BillingOption, type CommercialDependency, type IncludedCreditsRecharge } from "@/lib/quotes/commercial"
import GroupPricingReference from "../../commerce/group-pricing-reference"
import { QuantityInput } from "../../quantity-input"
import { quoteBrandAccent } from "@/lib/quotes/branding"
import QuoteComparisonSection from "@/components/quotes/quote-comparison-section"
import {
  normalizeQuoteTables,
  productsInQuote as comparisonProductsInQuote,
  type QuoteComparisonTable,
} from "@/lib/quotes/comparison"

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
  configuration_schema?: Record<string, any>
  raw_snapshot: Record<string, any>
  stripe_price_id?: string | null
  billing_family?: string
  alternative_period?: BillingOption | null
  dependency?: CommercialDependency | null
}
type CatalogGroup = { project: string; items: CatalogItem[]; configured: boolean; error: string | null }

type ManualKind = "module" | "setup" | "service" | "consulting" | "custom"

const PROJECT_LABELS: Record<string, string> = {
  hotelaccelerator: "HotelAccelerator",
  santaddeo: "Santaddeo",
  hotelprofitai: "HotelProfitAI",
  manubot: "ManuBot",
  custom: "Voce manuale",
  consulting: "Consulenza 4BID",
}

const ACCOMMODATIONS = [
  { value: "camere", label: "Camere" },
  { value: "appartamenti", label: "Appartamenti / unità abitative" },
  { value: "piazzole", label: "Piazzole" },
]

const FIELD_TYPES: { value: QuoteRequestedField["type"]; label: string }[] = [
  { value: "text", label: "Testo breve" },
  { value: "textarea", label: "Testo lungo" },
  { value: "credentials", label: "Credenziale (ID + Password)" },
  { value: "password", label: "Solo password" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL / Link" },
]

function toLocalDateTime(value?: string | null) {
  if (!value) return ""
  const d = new Date(value)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
function obj(v: unknown): Record<string, any> { return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, any> : {} }
function isSantaddeo(item: QuoteLineItem) { return item.project === "santaddeo" && item.kind === "plan" && String(item.source_product_id || "").startsWith("rms-fee:") }
function santaddeoPrice(config: Record<string, any>) {
  const type = String(config.accommodation_type || "camere")
  const coeffs = obj(config.coefficients)
  return Math.round((Number(config.fee_base_value) || 0) * (Number(coeffs[type]) || 0) * Math.max(1, Number(config.star_rating) || 1) * 100) / 100
}
function newFieldKey() {
  return `field_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`
}
// Gli id di catalogo non sono unici fra progetti: la chiave "gia' presente" deve
// includere progetto e kind, altrimenti card di progetti diversi con lo stesso
// id verrebbero marcate insieme.
function catalogKey(project: string, kind: string, id: string | undefined | null) { return `${project}:${kind}:${id ?? ""}` }
function manualLine(kind: ManualKind): QuoteLineItem {
  const recurring = kind === "module"
  const labels: Record<ManualKind, string> = {
    module: "Nuovo modulo manuale",
    setup: "Setup / attivazione",
    service: "Servizio una tantum",
    consulting: "Consulenza 4BID",
    custom: "Voce manuale",
  }
  const line: QuoteLineItem = {
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
  return recurring
    ? setCommercialMeta(line, { billing_family: `manual:${line.id}`, billing_options: { monthly: { billing_period: "monthly", unit_amount: 0 } } })
    : line
}

export default function QuoteCatalogEditor({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [quote, setQuote] = useState<SalesChannelQuote | null>(null)
  const [catalog, setCatalog] = useState<CatalogGroup[]>([])
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dragArmed, setDragArmed] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${quoteId}`, { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error("Preventivo non trovato"); return r.json() }),
      fetch("/api/quotes/catalog", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error("Catalogo non disponibile"); return r.json() }),
    ]).then(([q, c]) => { setQuote(q); setCatalog(Array.isArray(c) ? c : c.projects ?? []) }).catch(e => toast.error(e.message))
  }, [quoteId])

  const lines = (quote?.line_items || []) as QuoteLineItem[]
  const requestedFields = (quote?.requested_fields || []) as QuoteRequestedField[]
  // Tabelle comparative: snapshot salvato sul preventivo + prodotti (fra i 4)
  // realmente presenti nelle voci, che sono gli unici per cui offrire la tabella.
  const comparisonTables = useMemo(
    () => normalizeQuoteTables((quote as SalesChannelQuote | null)?.comparison_tables),
    [quote],
  )
  const comparisonProducts = useMemo(() => comparisonProductsInQuote(lines), [lines])
  function setComparisonTables(next: QuoteComparisonTable[]) {
    patchQuote({ comparison_tables: next } as Partial<SalesChannelQuote>)
  }
  const calculated = useMemo(() => lines.map(calculateQuoteLine), [lines])
  // Totali RAGGRUPPATI PER PERIODO, come la vista cliente. Sommare una tantum,
  // mensile e annuale in un unico numero (il vecchio `calculateQuoteTotal`)
  // produce una cifra che sul front NON esiste (per XENA: 680 setup + 707,30 di
  // UN mese = 1387,30). Qui si mostrano separati + "Totale primo anno" = una
  // tantum + canoni x 12 mesi, identico al box "Il tuo investimento".
  const periodTotals = useMemo(() => {
    const g = { oneTime: 0, monthly: 0, quarterly: 0, yearly: 0 }
    for (const item of calculated) {
      if (!isQuoteLineSelected(item)) continue
      if (item.billing_period === "monthly") g.monthly += item.amount
      else if (item.billing_period === "quarterly") g.quarterly += item.amount
      else if (item.billing_period === "yearly") g.yearly += item.amount
      else g.oneTime += item.amount
    }
    return { ...g, firstYear: g.oneTime + g.monthly * 12 + g.quarterly * 4 + g.yearly }
  }, [calculated])
  // Prodotti gia' presenti nel preventivo in modifica: servono a colorare di
  // verde le card di catalogo corrispondenti, come nel builder di creazione.
  const selectedCatalogIds = useMemo(() => new Set(lines.filter(l => l.source_product_id).map(l => catalogKey(l.project, l.kind, l.source_product_id))), [lines])
  // Totale ricorrente configurato normalizzato AL MESE (solo voci selezionate):
  // il riferimento gruppo confronta canoni omogenei a prescindere dalla cadenza.
  const configuredMonthlyTotal = useMemo(() => calculated.reduce((sum, item) => {
    if (!isQuoteLineSelected(item)) return sum
    if (item.billing_period === "monthly") return sum + item.amount
    if (item.billing_period === "quarterly") return sum + item.amount / 3
    if (item.billing_period === "yearly") return sum + item.amount / 12
    return sum
  }, 0), [calculated])
  // Riferimento "singola struttura": piano ricorrente piu' economico a catalogo,
  // normalizzato al mese. Stessa logica del builder di creazione.
  const suggestedReferenceMonthly = useMemo(() => {
    let min = 0
    for (const group of catalog) for (const it of group.items || []) {
      if (it.kind !== "plan" || !(it.unit_amount > 0)) continue
      const monthly = it.billing_period === "yearly" ? it.unit_amount / 12 : it.billing_period === "quarterly" ? it.unit_amount / 3 : it.billing_period === "monthly" ? it.unit_amount : 0
      if (monthly > 0 && (min === 0 || monthly < min)) min = monthly
    }
    return Math.round(min * 100) / 100
  }, [catalog])

  function patchQuote(patch: Partial<SalesChannelQuote>) { setQuote(current => current ? { ...current, ...patch } : current) }

  // Su un preventivo GIA' ESISTENTE i campi sono quasi sempre pieni: qui il
  // rischio di cancellare dati corretti e' piu' alto che in creazione, percio'
  // si riempie solo cio' che e' vuoto. La partita IVA e' l'unica che si
  // allinea, perche' e' proprio il dato appena verificato.
  function applyCompany(d: CompanyLookupData) {
    patchQuote({
      client_company: quote?.client_company?.trim() || d.denominazione || null,
      client_vat: d.partitaIva || d.codiceFiscale || quote?.client_vat || null,
      client_address: quote?.client_address?.trim() || formatCompanyAddress(d) || null,
    })
    toast.success(d.cessata ? "Dati compilati - attenzione: azienda non attiva" : "Dati aziendali compilati")
  }
  function setLines(next: QuoteLineItem[]) { patchQuote({ line_items: next, total_amount: calculateQuoteTotal(next) }) }
  function patchLine(index: number, patch: Partial<QuoteLineItem>) {
    setLines(lines.map((line, i) => {
      if (i !== index) return line
      let next = { ...line, ...patch }
      if (line.kind === "setup" && line.billing_period === "one_time" && patch.unit_amount != null) {
        next = setCommercialMeta(next, { normal_price: Math.max(0, Number(patch.unit_amount) || 0) })
      }
      // Le voci ricorrenti conservano il canone anche in `billing_options`, da cui
      // la vista cliente deriva il prezzo col toggle mensile/annuale. Se qui si
      // cambia prezzo o periodicita' senza aggiornare quella struttura, il
      // cliente vedrebbe il vecchio valore (o 0). Riallineiamo l'opzione del
      // periodo corrente al prezzo appena impostato.
      if (next.billing_period !== "one_time" && (patch.unit_amount != null || patch.billing_period != null)) {
        const period = next.billing_period
        if (period === "monthly" || period === "yearly") {
          const opts = getCommercialMeta(next).billing_options || {}
          next = setCommercialMeta(next, { billing_options: { ...opts, [period]: { ...(opts[period] || {}), billing_period: period, unit_amount: Math.max(0, Number(next.unit_amount) || 0) } } })
        }
      }
      // Se e' impostato uno sconto per pagamento anticipato, il prezzo annuale
      // (canone x 12 scontato) va ricalcolato ogni volta che cambia il canone
      // mensile, altrimenti resterebbe un valore obsoleto salvato in precedenza.
      next = syncAnnualPlanPrice(next)
      return calculateQuoteLine(next)
    }))
  }
  function patchSetupAnnualPolicy(index: number, mode: AnnualSetupMode, discountPct?: number) {
    const line = lines[index]
    const meta = getCommercialMeta(line)
    const next = setCommercialMeta(line, {
      normal_price: Math.max(0, Number(line.unit_amount) || 0),
      annual_setup_mode: mode,
      annual_setup_discount_pct: mode === "discount" ? Math.min(100, Math.max(0, Number(discountPct ?? meta.annual_setup_discount_pct) || 0)) : 0,
      free_on_annual: mode === "free",
    })
    setLines(lines.map((row, i) => i === index ? calculateQuoteLine(next) : row))
  }
  // Sconto sul PAGAMENTO ANTICIPATO (annuale) di un piano/modulo ricorrente.
  // Salva la percentuale in meta e lascia che `syncAnnualPlanPrice` derivi il
  // prezzo annuale (canone x 12 scontato) in `billing_options.yearly`, da cui la
  // vista cliente offre la formula "paga subito". enabled=false azzera lo sconto
  // e rimuove l'opzione annuale (niente formula fantasma a 0€).
  function patchAnnualPlan(index: number, patch: { enabled?: boolean; pct?: number }) {
    const line = lines[index]
    const meta = getCommercialMeta(line)
    const pct = patch.enabled === false
      ? 0
      : Math.min(100, Math.max(0, Number(patch.pct ?? meta.annual_plan_discount_pct) || 0))
    const withMeta = setCommercialMeta(line, { annual_plan_discount_pct: pct })
    setLines(lines.map((row, i) => i === index ? calculateQuoteLine(syncAnnualPlanPrice(withMeta)) : row))
  }
  // Crediti inclusi (addon a consumo): allowance informativa, non tocca i totali.
  // enabled=false azzera il campo; altrimenti salva importo e tipo di ricarica.
  function patchIncludedCredits(index: number, patch: { enabled?: boolean; amount?: number; recharge?: IncludedCreditsRecharge }) {
    const line = lines[index]
    // Meta GREZZO (non normalizzato): conserva importo/ricarica anche a 0, cosi'
    // il blocco resta attivo mentre l'operatore digita e le scelte non si perdono.
    const current = getCommercialMeta(line).included_credits
    if (patch.enabled === false) {
      setLines(lines.map((row, i) => i === index ? setCommercialMeta(row, { included_credits: null }) : row))
      return
    }
    const amount = Math.max(0, Number(patch.amount ?? current?.amount ?? 0) || 0)
    const recharge: IncludedCreditsRecharge = patch.recharge ?? (current?.recharge === "recurring" ? "recurring" : "one_time")
    setLines(lines.map((row, i) => i === index ? setCommercialMeta(row, { included_credits: { amount, recharge } }) : row))
  }
  function reorderLine(from: number, to: number) {
    if (!Number.isFinite(to) || from < 0 || from >= lines.length) return
    const target = Math.min(lines.length - 1, Math.max(0, to))
    if (target === from) return
    const next = [...lines]
    const [moved] = next.splice(from, 1)
    next.splice(target, 0, moved)
    setLines(next)
  }
  function moveLine(index: number, direction: -1 | 1) { reorderLine(index, index + direction) }
  function duplicateLine(index: number) {
    const result = duplicateQuoteLineAt(lines, index)
    if (!result.copied) return
    setLines(result.items)
    toast.success(result.copied > 1 ? `Voce duplicata con ${result.copied - 1} riga collegata` : "Voce duplicata: la copia è subito sotto l'originale")
  }
  function hasBase(project: string) { return lines.some(line => line.project === project && line.kind === "plan") }
  function addManual(kind: ManualKind) { setLines([...lines, manualLine(kind)]) }

  function setField(index: number, patch: Partial<QuoteRequestedField>) {
    patchQuote({ requested_fields: requestedFields.map((f, i) => i === index ? { ...f, ...patch } : f) })
  }
  function addField() {
    patchQuote({ requested_fields: [...requestedFields, { key: newFieldKey(), label: "", type: "credentials", required: true }] })
  }
  function removeField(index: number) { patchQuote({ requested_fields: requestedFields.filter((_, i) => i !== index) }) }

  function addCatalogItem(item: CatalogItem) {
    const dep = item.dependency
    if (dep?.requires_base && !hasBase(dep.project || item.project)) return toast.error(`Prima aggiungi il piano base ${PROJECT_LABELS[dep.project || item.project] || dep.project}`)
    if (dep?.linked_project && !hasBase(dep.linked_project)) return toast.error(`Questo modulo richiede anche ${PROJECT_LABELS[dep.linked_project] || dep.linked_project}`)

    const options: Partial<Record<"monthly" | "yearly", BillingOption>> = {}
    if (item.billing_period === "monthly" || item.billing_period === "yearly") options[item.billing_period] = { billing_period: item.billing_period, unit_amount: item.unit_amount, stripe_price_id: item.stripe_price_id, trial_days: item.trial_days }
    if (item.alternative_period) options[item.alternative_period.billing_period] = item.alternative_period

    let line: QuoteLineItem = {
      id: crypto.randomUUID(), kind: item.kind, project: item.project, source_product_id: item.id, name: item.name, description: item.description || item.name,
      features: item.features || [], quantity: 1, unit_amount: item.unit_amount, amount: item.unit_amount, billing_period: item.billing_period === "yearly" && options.monthly ? "monthly" : item.billing_period,
      trial_days: item.trial_days || 0, configuration: item.configuration_schema || {}, catalog_snapshot: item.raw_snapshot || {}, optional: item.kind === "module", default_selected: true,
    }
    line = setCommercialMeta(line, { billing_family: item.billing_family || item.source_id || item.id, billing_options: options, dependency: dep || null })

    if (item.project === "santaddeo" && item.kind === "plan" && String(item.id).startsWith("rms-fee:")) {
      const conf = obj(item.configuration_schema)
      const accommodation = String(conf.accommodation_type || "camere")
      const updated = { ...conf, structure_type: conf.structure_type || "hotel", accommodation_type: accommodation, star_rating: Number(conf.star_rating) || 3, accommodations: Number(conf.accommodations) || 1 }
      const unit = santaddeoPrice(updated)
      line = { ...line, configuration: updated, quantity: updated.accommodations, unit_amount: unit, amount: unit * updated.accommodations }
      line = setCommercialMeta(line, { ...getCommercialMeta(line), billing_options: { monthly: { billing_period: "monthly", unit_amount: unit, trial_days: line.trial_days } } })
    }
    setLines([...lines, calculateQuoteLine(line)])
  }

  function patchSantaddeo(index: number, patch: Record<string, any>) {
    const line = lines[index]
    const config = { ...obj(line.configuration), ...patch }
    const unit = santaddeoPrice(config)
    patchLine(index, { configuration: config, quantity: Math.max(1, Number(config.accommodations) || 1), unit_amount: unit })
  }

  function changeBilling(index: number, value: QuoteLineItem["billing_period"]) {
    const line = lines[index]
    let next: QuoteLineItem = { ...line, billing_period: value }
    if (value === "monthly" || value === "yearly") {
      const meta = getCommercialMeta(line)
      next = setCommercialMeta(next, {
        billing_family: meta.billing_family || `manual:${line.id || index}`,
        billing_options: { ...(meta.billing_options || {}), [value]: { billing_period: value, unit_amount: Number(line.unit_amount) || 0, trial_days: line.trial_days } },
      })
    }
    setLines(lines.map((row, i) => i === index ? calculateQuoteLine(next) : row))
  }

  async function save() {
    if (!quote) return
    if (quote.status === "paid") return toast.error("Un preventivo pagato non può essere modificato")
    if (!quote.client_name?.trim() && !quote.client_company?.trim()) return toast.error("Inserisci almeno referente o azienda")
    if (requestedFields.some(field => !field.label.trim())) return toast.error("Completa l'etichetta di tutti i dati richiesti al cliente")
    setSaving(true)
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_name: quote.client_name, client_company: quote.client_company, client_email: quote.client_email, client_vat: quote.client_vat, client_address: quote.client_address,
          title: quote.title, description: quote.description, payment_terms: quote.payment_terms, vat_included: quote.vat_included, currency: quote.currency,
          expires_at: quote.expires_at, line_items: lines, requested_fields: requestedFields,
          comparison_tables: comparisonTables,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Salvataggio fallito")
      toast.success("Preventivo aggiornato")
      router.push("/admin/quotes"); router.refresh()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  if (!quote) return <div className="p-8 text-sm text-muted-foreground">Caricamento preventivo e cataloghi…</div>

  return <div className="max-w-7xl mx-auto space-y-7 pb-20">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Modifica preventivo</h1><p className="text-muted-foreground">Catalogo live, voci manuali, setup e dati da richiedere al cliente.</p></div><Button variant="outline" onClick={() => router.push("/admin/quotes")}><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button></div>

    <section className="border rounded-xl p-5 bg-card space-y-4"><h2 className="font-semibold text-lg">Cliente e proposta</h2><div className="grid md:grid-cols-2 gap-4"><div><Label>Referente</Label><Input value={quote.client_name || ""} onChange={e => patchQuote({ client_name: e.target.value })} /></div><div><Label>Azienda</Label><Input value={quote.client_company || ""} onChange={e => patchQuote({ client_company: e.target.value })} /></div><div><Label>Email</Label><Input type="email" value={quote.client_email || ""} onChange={e => patchQuote({ client_email: e.target.value })} /></div><CompanyLookupField value={quote.client_vat || ""} onValueChange={v => patchQuote({ client_vat: v })} onApply={applyCompany} /><div className="md:col-span-2"><Label>Indirizzo</Label><Input value={quote.client_address || ""} onChange={e => patchQuote({ client_address: e.target.value })} /></div><div className="md:col-span-2"><Label>Titolo</Label><Input value={quote.title || ""} onChange={e => patchQuote({ title: e.target.value })} /></div><div className="md:col-span-2"><Label>Testo / descrizione</Label><Textarea rows={4} value={quote.description || ""} onChange={e => patchQuote({ description: e.target.value })} /></div><div className="md:col-span-2"><Label>Condizioni</Label><Textarea rows={3} value={quote.payment_terms || ""} onChange={e => patchQuote({ payment_terms: e.target.value })} /></div><div><Label>Offerta valida fino al</Label><Input type="datetime-local" value={toLocalDateTime(quote.expires_at)} onChange={e => patchQuote({ expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div><div className="flex items-center gap-2 mt-6"><Switch checked={quote.vat_included ?? true} onCheckedChange={v => patchQuote({ vat_included: v })} /><Label>IVA inclusa</Label></div></div></section>

    <section className="border rounded-xl p-5 bg-card space-y-4"><div><h2 className="font-semibold text-lg">Aggiungi dal catalogo</h2><p className="text-xs text-muted-foreground">Gli add-on rispettano le dipendenze dal software base.</p></div><div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{catalog.map(group => { const groupAccent = quoteBrandAccent(group.project); return <div key={group.project} className={`overflow-hidden rounded-lg border-2 ${groupAccent.border}`}><h3 className={`px-3 py-2 text-sm font-bold ${groupAccent.chip}`}>{PROJECT_LABELS[group.project] || group.project}</h3><div className="space-y-2 p-3">{group.error && <p className="text-xs text-destructive">{group.error}</p>}{group.items.filter(item => item.billing_period !== "yearly" || !group.items.some(other => other.billing_family === item.billing_family && other.billing_period === "monthly")).map(item => { const added = selectedCatalogIds.has(catalogKey(item.project, item.kind, item.id)); return <button type="button" key={catalogKey(item.project, item.kind, item.id)} onClick={() => addCatalogItem(item)} aria-pressed={added} className={`w-full text-left rounded-md border-2 border-l-4 p-3 transition-colors ${added ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 hover:bg-emerald-100" : `${groupAccent.border} hover:bg-muted`}`}><span className="flex items-center justify-between gap-2"><span className={`font-medium ${added ? "text-emerald-900" : ""}`}>{item.name}</span>{added ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white"><Check className="h-3 w-3" />Aggiunto</span> : null}</span><span className={`mt-1 block text-xs line-clamp-3 ${added ? "text-emerald-800" : "text-muted-foreground"}`}>{item.description}</span><span className="mt-2 block text-xs font-medium">{formatQuoteAmount(item.unit_amount, item.currency)} · {item.billing_period === "monthly" ? "mese" : item.billing_period}</span></button> })}</div></div> })}</div></section>

    <section className="border-2 border-dashed rounded-xl p-5 bg-card space-y-3"><div><h2 className="font-semibold text-lg">Aggiungi manualmente</h2><p className="text-sm text-muted-foreground">Per moduli, setup e servizi non presenti nel catalogo.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => addManual("module")}><Plus className="h-4 w-4 mr-2" />Modulo manuale</Button><Button variant="outline" onClick={() => addManual("setup")}><Plus className="h-4 w-4 mr-2" />Setup / una tantum</Button><Button variant="outline" onClick={() => addManual("service")}><Plus className="h-4 w-4 mr-2" />Servizio</Button><Button variant="outline" onClick={() => addManual("consulting")}><Plus className="h-4 w-4 mr-2" />Consulenza</Button><Button variant="ghost" onClick={() => addManual("custom")}><Plus className="h-4 w-4 mr-2" />Altra voce</Button></div></section>

    <section className="space-y-4"><h2 className="font-semibold text-xl">Voci del preventivo</h2>{calculated.map((item, index) => {
      const conf = obj(item.configuration)
      const meta = getCommercialMeta(item)
      const isManual = obj(item.catalog_snapshot).source === "manual"
      const setupAnnualMode: AnnualSetupMode = meta.annual_setup_mode ?? (meta.free_on_annual ? "free" : "full")
      const accent = quoteBrandAccent(item.project)
      return <div
        key={item.id || index}
        draggable={dragArmed === index}
        onDragStart={e => { e.dataTransfer.effectAllowed = "move"; setDragIndex(index) }}
        onDragOver={e => { if (dragIndex === null) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropIndex(index) }}
        onDrop={e => { if (dragIndex === null) return; e.preventDefault(); reorderLine(dragIndex, index); setDragIndex(null); setDropIndex(null); setDragArmed(null) }}
        onDragEnd={() => { setDragIndex(null); setDropIndex(null); setDragArmed(null) }}
        className={`rounded-xl border-2 border-l-8 p-5 space-y-4 transition-colors ${accent.border} ${dragIndex === index ? "opacity-60" : ""} ${dropIndex === index && dragIndex !== null && dragIndex !== index ? "border-primary ring-2 ring-primary/30" : ""}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <button
            type="button"
            onMouseDown={() => setDragArmed(index)}
            onMouseUp={() => setDragArmed(null)}
            onTouchStart={() => setDragArmed(index)}
            onTouchEnd={() => setDragArmed(null)}
            className="flex h-10 w-8 shrink-0 cursor-grab items-center justify-center self-end rounded-md border text-muted-foreground hover:bg-muted active:cursor-grabbing"
            aria-label={`Trascina ${item.name || "voce"} per riordinare`}
          ><GripVertical className="h-4 w-4" /></button>
          <div className="grid flex-1 gap-3 md:grid-cols-2">
            <div><Label>Nome</Label><Input value={item.name || ""} onChange={e => patchLine(index, { name: e.target.value })} /></div>
            <div><Label>Progetto / tipo</Label>{isManual ? <Select value={item.project || "custom"} onValueChange={project => patchLine(index, { project: project as QuoteProject })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hotelaccelerator">HotelAccelerator</SelectItem><SelectItem value="santaddeo">Santaddeo</SelectItem><SelectItem value="hotelprofitai">HotelProfitAI</SelectItem><SelectItem value="manubot">ManuBot</SelectItem><SelectItem value="consulting">Consulenza 4BID</SelectItem><SelectItem value="custom">Voce manuale</SelectItem></SelectContent></Select> : <Input readOnly value={`${PROJECT_LABELS[item.project || "custom"] || item.project || "custom"} · ${item.kind || "voce"}`} />}</div>
          </div>
          <div className="flex items-center gap-1 self-end" aria-label={`Ordinamento voce ${index + 1}`}>
            <Input
              key={`pos-${index}-${item.id || ""}`}
              type="number"
              min="1"
              max={lines.length}
              defaultValue={index + 1}
              className="h-10 w-16 text-center"
              aria-label={`Posizione di ${item.name || "voce"} su ${lines.length}`}
              onFocus={e => e.currentTarget.select()}
              onBlur={e => reorderLine(index, Number(e.target.value) - 1)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur() } }}
            />
            <span className="text-xs font-semibold text-muted-foreground">/ {lines.length}</span>
            <Button type="button" size="icon" variant="outline" disabled={index === 0} onClick={() => moveLine(index, -1)} aria-label={`Sposta ${item.name || "voce"} su`}><ArrowUp className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="outline" disabled={index === lines.length - 1} onClick={() => moveLine(index, 1)} aria-label={`Sposta ${item.name || "voce"} giù`}><ArrowDown className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="outline" onClick={() => duplicateLine(index)} aria-label={`Duplica ${item.name || "voce"}`} title="Duplica questa voce"><Copy className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => setLines(lines.filter((_, i) => i !== index))} aria-label={`Elimina ${item.name || "voce"}`}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <Textarea rows={3} value={item.description || ""} onChange={e => patchLine(index, { description: e.target.value })} />
        {isSantaddeo(item) ? <div className="space-y-3 rounded-lg border bg-primary/5 p-4"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><div><Label>Tipo struttura</Label><Select value={String(conf.structure_type || "hotel")} onValueChange={v => patchSantaddeo(index, { structure_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["hotel","resort","bb","agriturismo","residence","casa_vacanze","campeggio"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g," ")}</SelectItem>)}</SelectContent></Select></div><div><Label>Tipo sistemazioni</Label><Select value={String(conf.accommodation_type || "camere")} onValueChange={v => patchSantaddeo(index, { accommodation_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCOMMODATIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Stelle</Label><Select value={String(conf.star_rating || 3)} onValueChange={v => patchSantaddeo(index, { star_rating: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(v => <SelectItem key={v} value={String(v)}>{v}★</SelectItem>)}</SelectContent></Select></div><div><Label>Numero sistemazioni</Label><Input type="number" min="1" value={conf.accommodations || item.quantity || 1} onChange={e => patchSantaddeo(index, { accommodations: Number(e.target.value) })} /></div></div><div className="flex flex-wrap items-end justify-between gap-3 border-t border-primary/20 pt-3"><div><Label>Canone per sistemazione</Label><Input readOnly value={`${formatQuoteAmount(item.unit_amount || 0, quote.currency)} / mese`} /><p className="mt-1 text-xs text-muted-foreground">Calcolato da tipo struttura, sistemazioni e stelle</p></div><div className="text-right"><p className="text-xs text-muted-foreground">{`${item.quantity || conf.accommodations || 1} × ${formatQuoteAmount(item.unit_amount || 0, quote.currency)} / mese`}</p><p className="text-lg font-semibold text-foreground">{`${formatQuoteAmount(item.amount, quote.currency)} / mese`}</p></div></div></div> : <div className="grid sm:grid-cols-4 gap-3"><div><Label>Quantità</Label><QuantityInput value={item.quantity || 1} onCommit={n => patchLine(index, { quantity: n })} aria-label={`Quantità di ${item.name || "voce"}`} /></div><div><Label>Prezzo unitario</Label><Input type="number" min="0" step="0.01" value={item.unit_amount || 0} onChange={e => patchLine(index, { unit_amount: Number(e.target.value) })} /></div><div><Label>Periodicità</Label><Select value={item.billing_period || "one_time"} onValueChange={v => changeBilling(index, v as QuoteLineItem["billing_period"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">Una tantum</SelectItem><SelectItem value="monthly">Mensile</SelectItem><SelectItem value="quarterly">Trimestrale</SelectItem><SelectItem value="yearly">Annuale</SelectItem></SelectContent></Select></div><div><Label>Totale voce</Label><Input readOnly value={formatQuoteAmount(item.amount, quote.currency)} /></div></div>}
        {!isSantaddeo(item) ? <div className="grid sm:grid-cols-3 gap-3"><div><Label>Tipo sconto</Label><Select value={item.discount?.type || "none"} onValueChange={v => patchLine(index, { discount: v === "none" ? null : { type: v as "percentage" | "fixed", value: item.discount?.value || 0 } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nessuno</SelectItem><SelectItem value="percentage">Percentuale</SelectItem><SelectItem value="fixed">Importo fisso</SelectItem></SelectContent></Select></div><div><Label>Valore sconto</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.value || 0} onChange={e => patchLine(index, { discount: item.discount ? { ...item.discount, value: Number(e.target.value) } : null })} /></div><div><Label>Durata sconto (mesi)</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.duration_months || ""} onChange={e => patchLine(index, { discount: item.discount ? { ...item.discount, duration_months: e.target.value ? Number(e.target.value) : null } : null })} /></div></div> : null}
        {item.kind === "setup" && item.billing_period === "one_time" ? <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3"><div className="flex items-center justify-between gap-3"><div><strong>Agevolazione setup con piano annuale</strong><p className="text-xs text-muted-foreground">Scegli se il setup resta a prezzo pieno, viene scontato o azzerato quando il cliente seleziona la quota annuale.</p></div><Switch checked={setupAnnualMode !== "full"} onCheckedChange={enabled => patchSetupAnnualPolicy(index, enabled ? "free" : "full")} /></div>{setupAnnualMode !== "full" ? <div className="grid sm:grid-cols-2 gap-3"><div><Label>Trattamento con annuale</Label><Select value={setupAnnualMode} onValueChange={value => patchSetupAnnualPolicy(index, value as AnnualSetupMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="discount">Scontato</SelectItem><SelectItem value="free">Azzerato / omaggio</SelectItem></SelectContent></Select></div>{setupAnnualMode === "discount" ? <div><Label>Sconto setup %</Label><Input type="number" min="0" max="100" step="0.1" value={meta.annual_setup_discount_pct || 0} onChange={e => patchSetupAnnualPolicy(index, "discount", Number(e.target.value))} /></div> : <div className="flex items-end"><p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Setup azzerato con formula annuale</p></div>}</div> : <p className="text-xs text-muted-foreground">Disattivato: il setup viene addebitato per intero anche con formula annuale.</p>}</div> : null}
        {item.billing_period === "monthly" && !isSantaddeo(item) ? (() => {
          // Sconto sul PAGAMENTO ANTICIPATO (annuale). Il canone mensile e' su
          // item.unit_amount; il prezzo annuale = canone x 12 scontato e finisce
          // in billing_options.yearly (derivato da syncAnnualPlanPrice). Lo stato
          // "attivo" e' pct > 0: un'opzione annuale a 0 non e' un vero prezzo.
          const pct = Math.min(100, Math.max(0, Number(meta.annual_plan_discount_pct) || 0))
          const enabled = pct > 0
          const monthly = Math.max(0, Number(item.unit_amount) || 0)
          const annualFull = Math.round(monthly * 12 * 100) / 100
          const annualPrice = Math.round(annualFull * (1 - pct / 100) * 100) / 100
          const saving = Math.round((annualFull - annualPrice) * 100) / 100
          return <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <strong>Agevolazione canone con piano annuale</strong>
                <p className="text-xs text-muted-foreground">Sconto applicato quando il cliente sceglie di pagare subito l&apos;intero anno invece del canone mensile (base annuale {formatQuoteAmount(annualFull, quote.currency)} = canone × 12 mesi).</p>
              </div>
              <Switch checked={enabled} onCheckedChange={on => patchAnnualPlan(index, { enabled: on, pct: on ? pct || 10 : 0 })} />
            </div>
            {enabled ? <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>Sconto pagamento anticipato %</Label><Input type="number" min="0" max="100" step="0.1" value={pct} onChange={e => patchAnnualPlan(index, { pct: Number(e.target.value) })} />{monthly <= 0 ? <p className="mt-1 text-xs text-amber-600">Imposta prima il canone mensile.</p> : null}</div>
              <div><Label>Prezzo annuale scontato</Label><Input readOnly value={formatQuoteAmount(annualPrice, quote.currency)} /></div>
              <div><Label>Risparmio cliente</Label><Input readOnly value={`${formatQuoteAmount(saving, quote.currency)} / anno`} /></div>
            </div> : <p className="text-xs text-muted-foreground">Disattivato: il cliente vede solo il canone mensile, nessuna formula annuale.</p>}
          </div>
        })() : null}
        {item.project === "manubot" && item.kind === "plan" && /corporate/i.test(item.name || "") ? (() => {
          // Limiti inclusi nel piano Corporate, riferiti all'INTERO GRUPPO:
          // asset max (es. camere/oggetti) e utenti max. Solo informativi: non
          // toccano i totali. Salvati in commercial_meta e mostrati in vista
          // cliente accanto al numero di strutture (quantity). Vuoti = nascosti.
          const maxAssets = Number(meta.corporate_max_assets) || 0
          const maxUsers = Number(meta.corporate_max_users) || 0
          // Default retrocompatibile: se il flag non e' mai stato impostato, mostra.
          const showStructure = meta.corporate_show_per_structure !== false
          const showAsset = meta.corporate_show_per_asset !== false
          const showUser = meta.corporate_show_per_user !== false
          // Anteprima nell'editor: STESSO calcolo della vista cliente. Ripartisce
          // il ricorrente annualizzato (canoni mensili x12 + canoni annuali, solo
          // voci selezionate, come `recurringYearly` nel front) per strutture /
          // asset / utenti. Cosi' l'operatore vede a schermo cio' che vedra' il
          // cliente, senza dover aprire l'anteprima.
          const structures = Number(item.quantity) || 0
          const recurringYearlyGroup = periodTotals.monthly * 12 + periodTotals.yearly
          // Il cliente vede il costo MENSILE ripartito: dividiamo anche per 12.
          const recurringMonthlyGroup = recurringYearlyGroup / 12
          const perStructure = structures > 0 ? formatQuoteAmount(recurringMonthlyGroup / structures, quote.currency) : null
          const perAsset = maxAssets > 0 ? formatQuoteAmount(recurringMonthlyGroup / maxAssets, quote.currency) : null
          const perUser = maxUsers > 0 ? formatQuoteAmount(recurringMonthlyGroup / maxUsers, quote.currency) : null
          return <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
            <div>
              <strong>Limiti inclusi nel piano Corporate (totale gruppo)</strong>
              <p className="text-xs text-muted-foreground">Numero massimo di asset e utenti compresi nel piano per l&apos;intero gruppo ({item.quantity || 1} strutture). Mostrati al cliente sotto la quantità; lascia 0 per non mostrarli.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Asset inclusi (max, gruppo)</Label><Input type="number" min="0" value={maxAssets || ""} placeholder="es. 1600" onChange={e => setLines(lines.map((row, i) => i === index ? setCommercialMeta(row, { corporate_max_assets: Number(e.target.value) || 0 }) : row))} /></div>
              <div><Label>Utenti inclusi (max, gruppo)</Label><Input type="number" min="0" value={maxUsers || ""} placeholder="es. 60" onChange={e => setLines(lines.map((row, i) => i === index ? setCommercialMeta(row, { corporate_max_users: Number(e.target.value) || 0 }) : row))} /></div>
            </div>
            <div className="space-y-2 border-t border-primary/20 pt-3">
              <p className="text-xs font-medium text-muted-foreground">Costo abbonamento mensile ripartito (ricorrente {formatQuoteAmount(recurringMonthlyGroup, quote.currency)} / mese). L&apos;interruttore decide se mostrarlo al cliente:</p>
              <div className="flex items-center justify-between gap-3">
                <Label className="font-normal">Prezzo per struttura {perStructure ? <span className="font-semibold text-foreground">· {perStructure} / mese</span> : <span className="text-muted-foreground">(imposta la quantità strutture)</span>}</Label>
                <Switch checked={showStructure} onCheckedChange={v => setLines(lines.map((row, i) => i === index ? setCommercialMeta(row, { corporate_show_per_structure: v }) : row))} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="font-normal">Prezzo per asset {perAsset ? <span className="font-semibold text-foreground">· {perAsset} / mese</span> : <span className="text-muted-foreground">(imposta prima gli asset)</span>}</Label>
                <Switch checked={showAsset} onCheckedChange={v => setLines(lines.map((row, i) => i === index ? setCommercialMeta(row, { corporate_show_per_asset: v }) : row))} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="font-normal">Prezzo per utente {perUser ? <span className="font-semibold text-foreground">· {perUser} / mese</span> : <span className="text-muted-foreground">(imposta prima gli utenti)</span>}</Label>
                <Switch checked={showUser} onCheckedChange={v => setLines(lines.map((row, i) => i === index ? setCommercialMeta(row, { corporate_show_per_user: v }) : row))} />
              </div>
            </div>
          </div>
        })() : null}
        {item.project === "hotelprofitai" ? (() => {
          // Stato dello switch e dei campi dal meta GREZZO: `getIncludedCredits`
          // ritorna null con importo 0 (giusto per totali/provisioning), ma qui
          // serve tenere il blocco aperto mentre l'operatore digita l'importo,
          // altrimenti lo switch si rispegne subito e sembra "non attivabile".
          const rawCredits = getCommercialMeta(item).included_credits
          const creditsEnabled = rawCredits != null
          const creditsAmount = Math.max(0, Number(rawCredits?.amount) || 0)
          const creditsRecharge: IncludedCreditsRecharge = rawCredits?.recharge === "recurring" ? "recurring" : "one_time"
          return <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <strong>Crediti inclusi nel pacchetto</strong>
                <p className="text-xs text-muted-foreground">Per gli addon a consumo (es. Analisi aziende): il sistema ricarica automaticamente questi crediti all'attivazione. I consumi extra restano a carico del cliente. Voce informativa, non sommata al totale.</p>
              </div>
              <Switch checked={creditsEnabled} onCheckedChange={enabled => patchIncludedCredits(index, { enabled })} />
            </div>
            {creditsEnabled ? <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Crediti inclusi (€)</Label><Input type="number" min="0" step="0.01" value={creditsAmount || ""} onChange={e => patchIncludedCredits(index, { amount: Number(e.target.value) })} />{creditsAmount <= 0 ? <p className="mt-1 text-xs text-amber-600">Imposta un importo maggiore di 0 per accreditare i crediti all'attivazione.</p> : null}</div>
              <div><Label>Ricarica</Label><Select value={creditsRecharge} onValueChange={value => patchIncludedCredits(index, { recharge: value as IncludedCreditsRecharge })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">Una tantum all'attivazione</SelectItem><SelectItem value="recurring">Ad ogni rinnovo</SelectItem></SelectContent></Select></div>
            </div> : <p className="text-xs text-muted-foreground">Disattivato: nessun credito incluso viene ricaricato automaticamente.</p>}
          </div>
        })() : null}
        <div className="flex items-center gap-2"><Switch checked={!!item.optional} disabled={item.kind === "plan"} onCheckedChange={v => patchLine(index, { optional: v, default_selected: v ? item.default_selected !== false : true })} /><Label>Opzionale per il cliente</Label></div>
      </div>
    })}</section>

    <section className="border rounded-xl p-5 bg-card space-y-4"><div><h2 className="font-semibold text-lg">Tabelle comparative</h2><p className="text-sm text-muted-foreground">Attiva la tabella "perché sceglierci" per i prodotti presenti nel preventivo. Compaiono al cliente in fondo, prima delle condizioni. Puoi personalizzarle per questo cliente; i modelli di partenza si gestiscono in <a href="/admin/quotes/comparison" className="underline">Tabelle comparative</a>.</p></div><QuoteComparisonSection productsInQuote={comparisonProducts} value={comparisonTables} onChange={setComparisonTables} /></section>

    <section className="border rounded-xl p-5 bg-card space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-lg">Dati da richiedere al cliente</h2><p className="text-sm text-muted-foreground">Ripristinato dal vecchio preventivo: credenziali, email, URL, testi e altri dati che il cliente dovrà compilare.</p></div><Button variant="outline" onClick={addField}><Plus className="h-4 w-4 mr-2" />Aggiungi campo</Button></div>{requestedFields.length === 0 ? <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nessun dato aggiuntivo richiesto. Usa “Aggiungi campo” per richiedere, ad esempio, accessi Booking.com, Expedia, PMS o dati tecnici.</div> : <div className="space-y-3">{requestedFields.map((field, index) => <div key={field.key || index} className="rounded-lg border p-4 space-y-3"><div className="grid md:grid-cols-[1fr_220px_auto] gap-3 items-end"><div><Label>Etichetta campo</Label><Input value={field.label} onChange={e => setField(index, { label: e.target.value })} placeholder="Es. Credenziali Booking.com" /></div><div><Label>Tipo</Label><Select value={field.type} onValueChange={value => setField(index, { type: value as QuoteRequestedField["type"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIELD_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div><Button size="icon" variant="ghost" onClick={() => removeField(index)}><X className="h-4 w-4" /></Button></div><div><Label>Indicazioni per il cliente (facoltative)</Label><Input value={field.help || ""} onChange={e => setField(index, { help: e.target.value })} placeholder="Es. Inserire username e password dell'account amministratore" /></div><div className="flex items-center gap-2"><Switch checked={field.required} onCheckedChange={required => setField(index, { required })} /><Label>Obbligatorio</Label></div></div>)}</div>}</section>

    <GroupPricingReference configuredMonthlyTotal={configuredMonthlyTotal} suggestedReferenceMonthly={suggestedReferenceMonthly} />

    <section className="sticky bottom-4 border rounded-xl p-5 bg-background/95 backdrop-blur shadow-lg flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        {periodTotals.oneTime > 0 ? <div><p className="text-xs text-muted-foreground">Una tantum (setup)</p><p className="text-xl font-bold">{formatQuoteAmount(periodTotals.oneTime, quote.currency)}</p></div> : null}
        {periodTotals.monthly > 0 ? <div><p className="text-xs text-muted-foreground">Canone mensile</p><p className="text-xl font-bold">{formatQuoteAmount(periodTotals.monthly, quote.currency)}<span className="text-sm font-normal text-muted-foreground"> /mese</span></p></div> : null}
        {periodTotals.quarterly > 0 ? <div><p className="text-xs text-muted-foreground">Canone trimestrale</p><p className="text-xl font-bold">{formatQuoteAmount(periodTotals.quarterly, quote.currency)}<span className="text-sm font-normal text-muted-foreground"> /trim.</span></p></div> : null}
        {periodTotals.yearly > 0 ? <div><p className="text-xs text-muted-foreground">Canone annuale</p><p className="text-xl font-bold">{formatQuoteAmount(periodTotals.yearly, quote.currency)}<span className="text-sm font-normal text-muted-foreground"> /anno</span></p></div> : null}
        <div className="border-l pl-8"><p className="text-xs uppercase tracking-wide text-muted-foreground">Totale primo anno</p><p className="text-2xl font-black">{formatQuoteAmount(periodTotals.firstYear, quote.currency)}</p><p className="text-[11px] text-muted-foreground">una tantum + canoni per 12 mesi · {quote.vat_included ? "IVA inclusa" : "IVA esclusa"}</p></div>
      </div>
      <Button size="lg" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Salvataggio…" : "Salva modifiche"}</Button></section>
  </div>
}
