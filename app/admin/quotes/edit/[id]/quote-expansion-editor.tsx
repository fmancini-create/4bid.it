"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Loader2, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateQuoteLine, formatQuoteAmount, type QuoteLineItem, type SalesChannelQuote } from "@/lib/quotes/types"
import { getCommercialMeta, setCommercialMeta, type BillingOption, type CommercialDependency } from "@/lib/quotes/commercial"
import { getPropertyPricing, isEcosystemOffer, markEcosystemOffer, withPropertyPricing } from "@/lib/quotes/ecosystem"

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
  configuration_schema?: Record<string, unknown>
  raw_snapshot: Record<string, unknown>
  stripe_price_id?: string | null
  billing_family?: string
  alternative_period?: BillingOption | null
  dependency?: CommercialDependency | null
}

type CatalogGroup = { project: string; items: CatalogItem[]; configured: boolean; error: string | null }
type PropertyRow = { id: string; name: string; accommodations: number }

const PROJECT_LABELS: Record<string, string> = {
  hotelaccelerator: "HotelAccelerator",
  santaddeo: "Santaddeo",
  hotelprofitai: "HotelProfitAI",
  manubot: "ManuBot",
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function familyOf(item: Pick<CatalogItem, "billing_family" | "source_id" | "id">) {
  return item.billing_family || item.source_id || item.id.replace(/:(monthly|yearly)$/i, "")
}

function quoteLineFamily(item: QuoteLineItem) {
  return getCommercialMeta(item).billing_family
    || String(item.source_product_id || "").replace(/:(monthly|yearly)$/i, "")
}

function canonicalItems(groups: CatalogGroup[]) {
  const rows = groups.flatMap(group => group.items || [])
  return rows.filter(item => {
    if (item.billing_period !== "yearly") return true
    const family = familyOf(item)
    return !rows.some(other => other !== item
      && other.project === item.project
      && familyOf(other) === family
      && other.billing_period === "monthly")
  })
}

function pricingModel(item: CatalogItem) {
  return String(obj(item.configuration_schema).pricing_model || "")
}

function isPerAccommodationMinimum(item: CatalogItem) {
  return pricingModel(item) === "per_accommodation_minimum"
}

function hasDynamicCatalogPrice(item: CatalogItem) {
  const model = pricingModel(item)
  return model === "per_accommodation" || model === "per_accommodation_minimum"
}

function isExplicitlyFreeCatalogItem(item: CatalogItem) {
  const configuration = obj(item.configuration_schema)
  const snapshot = obj(item.raw_snapshot)
  return configuration.is_free === true
    || configuration.free === true
    || configuration.pricing_model === "free"
    || snapshot.is_free === true
    || snapshot.free === true
}

function effectiveCatalogUnitAmount(item: CatalogItem) {
  if (item.billing_period === "yearly" && item.alternative_period?.billing_period === "monthly") {
    return Math.max(0, Number(item.alternative_period.unit_amount) || 0)
  }
  return Math.max(0, Number(item.unit_amount) || 0)
}

function isCatalogItemReadyForEcosystem(item: CatalogItem) {
  return effectiveCatalogUnitAmount(item) > 0 || isExplicitlyFreeCatalogItem(item)
}

function roundCurrency(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function distributeFixedDiscount(total: number, grossAmounts: number[]) {
  const gross = grossAmounts.map(value => Math.max(0, Number(value) || 0))
  const available = gross.reduce((sum, value) => sum + value, 0)
  const capped = roundCurrency(Math.min(Math.max(0, Number(total) || 0), available))
  if (capped <= 0 || available <= 0) return gross.map(() => 0)

  let remaining = capped
  let remainingGross = available
  return gross.map((amount, index) => {
    if (index === gross.length - 1) return roundCurrency(Math.min(amount, remaining))
    const share = remainingGross > 0
      ? roundCurrency(Math.min(amount, remaining * amount / remainingGross))
      : 0
    remaining = roundCurrency(Math.max(0, remaining - share))
    remainingGross = Math.max(0, remainingGross - amount)
    return share
  })
}

function buildCatalogLine(item: CatalogItem): QuoteLineItem {
  const options: Partial<Record<"monthly" | "yearly", BillingOption>> = {}
  if (item.billing_period === "monthly" || item.billing_period === "yearly") {
    options[item.billing_period] = {
      billing_period: item.billing_period,
      unit_amount: item.unit_amount,
      stripe_price_id: item.stripe_price_id,
      trial_days: item.trial_days,
    }
  }
  if (item.alternative_period) options[item.alternative_period.billing_period] = item.alternative_period

  const billingPeriod = item.billing_period === "yearly" && options.monthly ? "monthly" : item.billing_period
  const initialOption = billingPeriod === "monthly" || billingPeriod === "yearly" ? options[billingPeriod] : undefined
  const initialUnitAmount = Math.max(0, Number(initialOption?.unit_amount ?? item.unit_amount) || 0)
  const initialTrialDays = Math.max(0, Number(initialOption?.trial_days ?? item.trial_days) || 0)
  let line: QuoteLineItem = {
    id: crypto.randomUUID(),
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
    configuration: item.configuration_schema || {},
    catalog_snapshot: item.raw_snapshot || {},
    optional: item.kind === "module",
    default_selected: true,
  }
  line = setCommercialMeta(line, {
    billing_family: familyOf(item),
    billing_options: options,
    dependency: item.dependency || null,
  })
  return calculateQuoteLine(line)
}

function hasBase(lines: QuoteLineItem[], project: string) {
  return lines.some(line => line.project === project && line.kind === "plan")
}

function dynamicMonthlyTotal(item: CatalogItem, rooms: number) {
  const config = obj(item.configuration_schema)
  const unit = Math.max(0, Number(config.unit_price ?? item.unit_amount) || 0)
  const minimum = Math.max(0, Number(config.minimum_monthly) || 0)
  return Math.max(minimum, unit * Math.max(1, rooms))
}

export default function QuoteExpansionEditor({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<SalesChannelQuote | null>(null)
  const [catalog, setCatalog] = useState<CatalogGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [discountPct, setDiscountPct] = useState(0)
  const [selectedDynamic, setSelectedDynamic] = useState("")
  const [selectedEcosystem, setSelectedEcosystem] = useState("")
  const [properties, setProperties] = useState<PropertyRow[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${quoteId}`, { cache: "no-store" }).then(async response => {
        if (!response.ok) throw new Error("Preventivo non trovato")
        return response.json() as Promise<SalesChannelQuote>
      }),
      fetch("/api/quotes/catalog", { cache: "no-store" }).then(async response => {
        if (!response.ok) throw new Error("Catalogo non disponibile")
        return response.json() as Promise<{ projects?: CatalogGroup[] } | CatalogGroup[]>
      }),
    ]).then(([quoteData, catalogData]) => {
      setQuote(quoteData)
      const groups = Array.isArray(catalogData) ? catalogData : catalogData.projects || []
      setCatalog(groups)
      const known = new Map<string, PropertyRow>()
      for (const line of quoteData.line_items || []) {
        const property = getPropertyPricing(line)
        if (property && !known.has(property.property_id)) {
          known.set(property.property_id, {
            id: property.property_id,
            name: property.property_name,
            accommodations: property.accommodations,
          })
        }
      }
      setProperties(known.size
        ? Array.from(known.values())
        : [{ id: crypto.randomUUID(), name: quoteData.client_company || "Hotel 1", accommodations: 1 }])
    }).catch(error => toast.error(error instanceof Error ? error.message : "Errore caricamento"))
      .finally(() => setLoading(false))
  }, [quoteId])

  const items = useMemo(() => canonicalItems(catalog), [catalog])
  const dynamicItems = useMemo(() => items.filter(item => item.kind === "module" && isPerAccommodationMinimum(item)), [items])
  const ecosystemCandidates = useMemo(
    () => items.filter(item => (item.kind === "plan" || item.kind === "module")
      && !hasDynamicCatalogPrice(item)
      && isCatalogItemReadyForEcosystem(item)),
    [items],
  )
  const lines = quote?.line_items || []
  const ecosystemOffers = lines.filter(isEcosystemOffer)
  const activeDynamic = dynamicItems.find(item => `${item.project}:${familyOf(item)}` === selectedDynamic) || dynamicItems[0]
  const activeEcosystem = ecosystemCandidates.find(item => `${item.project}:${familyOf(item)}` === selectedEcosystem) || ecosystemCandidates[0]

  async function saveLines(nextLines: QuoteLineItem[], success: string) {
    if (!quote || quote.status === "paid" || quote.accepted_at) {
      toast.error("Il preventivo accettato o pagato non può essere modificato")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line_items: nextLines }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || "Salvataggio fallito")
      toast.success(success)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante il salvataggio")
    } finally {
      setSaving(false)
    }
  }

  function updateProperty(id: string, patch: Partial<PropertyRow>) {
    setProperties(current => current.map(row => row.id === id ? { ...row, ...patch } : row))
  }

  function removeProperty(id: string) {
    setProperties(current => current.length <= 1 ? current : current.filter(row => row.id !== id))
  }

  async function syncProperties() {
    if (!activeDynamic) return toast.error("Nessun modulo a prezzo per sistemazione disponibile")
    const clean = properties
      .map(row => ({ ...row, name: row.name.trim(), accommodations: Math.max(0, Math.round(Number(row.accommodations) || 0)) }))
      .filter(row => row.name && row.accommodations > 0)
    if (!clean.length || clean.length !== properties.length) return toast.error("Completa nome e numero sistemazioni di ogni struttura")
    if (activeDynamic.dependency?.requires_base && !hasBase(lines, activeDynamic.dependency.project || activeDynamic.project)) {
      return toast.error(`Prima aggiungi il piano base ${PROJECT_LABELS[activeDynamic.project] || activeDynamic.project}`)
    }

    const family = familyOf(activeDynamic)
    const managed = new Map<string, QuoteLineItem>()
    for (const line of lines) {
      const property = getPropertyPricing(line)
      if (property?.family === family) managed.set(property.property_id, line)
    }
    const aggregate = lines.find(line => line.project === activeDynamic.project
      && quoteLineFamily(line) === family
      && !getPropertyPricing(line))
    const aggregateFixedDiscount = aggregate?.discount?.type === "fixed" ? aggregate.discount : null

    // Quando si passa dalla vecchia riga unica a una riga per hotel, eliminiamo
    // anche l'eventuale riga ordinaria dello stesso modulo. Altrimenti il gruppo
    // pagherebbe sia la vecchia quantità aggregata sia le nuove righe per hotel.
    const kept = lines.filter(line => !(line.project === activeDynamic.project && quoteLineFamily(line) === family))
    const generatedFromAggregate: number[] = []
    let generated = clean.map((property, index) => {
      const previous = managed.get(property.id)
      const seed = previous || aggregate
      let base = seed
        ? {
            ...seed,
            id: previous?.id || crypto.randomUUID(),
            catalog_snapshot: { ...(activeDynamic.raw_snapshot || {}), ...(seed.catalog_snapshot || {}) },
            support: seed.support ?? activeDynamic.support ?? null,
          }
        : buildCatalogLine(activeDynamic)

      // Uno sconto fisso apparteneva alla vecchia riga aggregata una sola volta:
      // viene ripartito tra gli hotel, non duplicato integralmente su ogni riga.
      if (!previous && aggregateFixedDiscount) {
        generatedFromAggregate.push(index)
        base = { ...base, discount: null }
      }

      const unit = Number(obj(activeDynamic.configuration_schema).unit_price ?? activeDynamic.unit_amount) || 0
      const minimum = Number(obj(activeDynamic.configuration_schema).minimum_monthly) || 0
      const named = {
        ...base,
        name: `${activeDynamic.name.replace(/\s*[—–-]\s*annuale\s*$/i, "")} · ${property.name}`,
        description: `${activeDynamic.description || activeDynamic.name} — ${property.name}: ${property.accommodations} sistemazioni · ${formatQuoteAmount(unit, activeDynamic.currency)}/sistemazione/mese${minimum > 0 ? ` · minimo ${formatQuoteAmount(minimum, activeDynamic.currency)}/mese per struttura` : ""}.`,
        features: activeDynamic.features?.length ? activeDynamic.features : base.features,
        optional: base.optional ?? true,
        default_selected: base.default_selected ?? true,
      }
      return withPropertyPricing(named, {
        family,
        propertyId: property.id,
        propertyName: property.name,
        accommodations: property.accommodations,
      })
    })

    if (aggregateFixedDiscount && generatedFromAggregate.length) {
      const grossAmounts = generatedFromAggregate.map(index => Number(calculateQuoteLine(generated[index]).list_amount) || 0)
      const allocations = distributeFixedDiscount(Number(aggregateFixedDiscount.value) || 0, grossAmounts)
      const allocationByIndex = new Map<number, number>(generatedFromAggregate.map((index, position) => [index, allocations[position]] as const))
      generated = generated.map((line, index) => {
        const value = allocationByIndex.get(index)
        return value == null ? line : calculateQuoteLine({
          ...line,
          discount: { ...aggregateFixedDiscount, value },
        })
      })
    }

    await saveLines([...kept, ...generated], `${activeDynamic.name}: ${generated.length} strutture aggiornate`)
  }

  function buildEcosystemItem(item: CatalogItem) {
    return markEcosystemOffer(buildCatalogLine(item), discountPct)
  }

  async function addEcosystemOffer(item = activeEcosystem) {
    if (!item) return toast.error("Seleziona un prodotto")
    const family = familyOf(item)
    if (lines.some(line => line.project === item.project
      && String(obj(line.configuration).ecosystem_family || quoteLineFamily(line)) === family)) {
      return toast.error("Questa proposta è già presente nel preventivo")
    }

    let next = [...lines]
    if (item.kind === "module" && item.dependency?.requires_base && !hasBase(next, item.dependency.project || item.project)) {
      const base = ecosystemCandidates.find(candidate => candidate.project === item.project && candidate.kind === "plan")
      if (!base || !isCatalogItemReadyForEcosystem(base)) {
        return toast.error(`Prima configura il piano base ${PROJECT_LABELS[item.project] || item.project} nel preventivo principale`)
      }
      const baseLine = buildEcosystemItem(base)
      baseLine.configuration = { ...obj(baseLine.configuration), ecosystem_family: familyOf(base) }
      next.push(baseLine)
    }

    const line = buildEcosystemItem(item)
    line.configuration = { ...obj(line.configuration), ecosystem_family: family }
    next.push(line)
    await saveLines(next, `${item.name} aggiunto alle proposte Ecosistema 4BID`)
  }

  async function addCompatibleEcosystem() {
    let next = [...lines]
    const existing = new Set(next.map(line => `${line.project}:${String(obj(line.configuration).ecosystem_family || quoteLineFamily(line) || "")}`))
    let added = 0

    for (const project of ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const) {
      const projectItems = ecosystemCandidates.filter(item => item.project === project)
      const base = projectItems.find(item => item.kind === "plan")
      const needsBase = projectItems.some(item => item.kind === "module" && item.dependency?.requires_base)
      if (needsBase && !hasBase(next, project)) {
        if (!base || !isCatalogItemReadyForEcosystem(base)) continue
        const key = `${project}:${familyOf(base)}`
        if (!existing.has(key)) {
          const baseLine = buildEcosystemItem(base)
          baseLine.configuration = { ...obj(baseLine.configuration), ecosystem_family: familyOf(base) }
          next.push(baseLine)
          existing.add(key)
          added += 1
        }
      }
      for (const item of projectItems) {
        if (item.kind === "plan" && hasBase(lines, project)) continue
        const key = `${project}:${familyOf(item)}`
        if (existing.has(key)) continue
        if (item.kind === "module" && item.dependency?.requires_base && !hasBase(next, project)) continue
        const offer = buildEcosystemItem(item)
        offer.configuration = { ...obj(offer.configuration), ecosystem_family: familyOf(item) }
        next.push(offer)
        existing.add(key)
        added += 1
      }
    }

    if (!added) return toast.info("Non ci sono altre proposte compatibili da aggiungere")
    await saveLines(next, `${added} proposte Ecosistema 4BID preparate`)
  }

  async function removeEcosystemOffer(id: string) {
    const target = lines.find(line => line.id === id)
    if (!target || !isEcosystemOffer(target)) return
    const hasOtherBase = !!target.project && lines.some(line => line.id !== id
      && line.project === target.project
      && line.kind === "plan")
    const next = lines.filter(line => {
      if (line.id === id) return false
      if (target.kind !== "plan" || !target.project || hasOtherBase) return true
      if (!isEcosystemOffer(line) || line.project !== target.project || line.kind !== "module") return true
      return !getCommercialMeta(line).dependency?.requires_base
    })
    const removed = lines.length - next.length
    await saveLines(next, removed > 1
      ? `Piano e ${removed - 1} proposte dipendenti rimossi`
      : "Proposta Ecosistema rimossa")
  }

  if (loading) return <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">Caricamento strumenti multi-struttura…</div>
  if (!quote) return null

  return (
    <div className="mb-8 space-y-5">
      <section className="rounded-xl border-2 border-primary/20 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-bold">Strutture del gruppo · prezzi per sistemazione</h2>
            <p className="text-sm text-muted-foreground">Per moduli come Recensioni il minimo viene applicato a ogni hotel, non alla somma camere del gruppo. Inserisci una riga per struttura: il preventivo genera una voce economica distinta per ciascun hotel.</p>
          </div>
        </div>

        {dynamicItems.length ? (
          <div className="space-y-4">
            <div className="max-w-xl">
              <Label>Modulo da applicare alle strutture</Label>
              <Select value={activeDynamic ? `${activeDynamic.project}:${familyOf(activeDynamic)}` : ""} onValueChange={setSelectedDynamic}>
                <SelectTrigger><SelectValue placeholder="Scegli modulo" /></SelectTrigger>
                <SelectContent>{dynamicItems.map(item => (
                  <SelectItem key={`${item.project}:${familyOf(item)}`} value={`${item.project}:${familyOf(item)}`}>{PROJECT_LABELS[item.project]} · {item.name}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {properties.map((property, index) => (
                <div key={property.id} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_180px_180px_44px] md:items-end">
                  <div><Label>Struttura {index + 1}</Label><Input value={property.name} onChange={event => updateProperty(property.id, { name: event.target.value })} placeholder="es. Jada Hotel Firenze" /></div>
                  <div><Label>Camere / sistemazioni</Label><Input type="number" min="1" value={property.accommodations} onChange={event => updateProperty(property.id, { accommodations: Number(event.target.value) })} /></div>
                  <div><Label>Totale mensile</Label><Input readOnly value={activeDynamic ? formatQuoteAmount(dynamicMonthlyTotal(activeDynamic, property.accommodations), activeDynamic.currency) : "—"} /></div>
                  <Button type="button" size="icon" variant="ghost" disabled={properties.length <= 1} onClick={() => removeProperty(property.id)} aria-label={`Rimuovi ${property.name || `struttura ${index + 1}`}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>

            {activeDynamic ? <p className="text-xs text-muted-foreground">Listino: {formatQuoteAmount(Number(obj(activeDynamic.configuration_schema).unit_price ?? activeDynamic.unit_amount) || 0, activeDynamic.currency)} per sistemazione/mese{Number(obj(activeDynamic.configuration_schema).minimum_monthly) > 0 ? ` · minimo ${formatQuoteAmount(Number(obj(activeDynamic.configuration_schema).minimum_monthly), activeDynamic.currency)} per struttura/mese` : ""}.</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setProperties(current => [...current, { id: crypto.randomUUID(), name: `Hotel ${current.length + 1}`, accommodations: 1 }])}><Plus className="mr-2 h-4 w-4" />Aggiungi hotel</Button>
              <Button type="button" onClick={syncProperties} disabled={saving || !activeDynamic}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Genera / aggiorna righe per hotel</Button>
            </div>
          </div>
        ) : <p className="text-sm text-muted-foreground">Nel catalogo corrente non risultano moduli con prezzo per sistemazione.</p>}
      </section>

      <section className="rounded-xl border-2 border-emerald-200 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <h2 className="text-lg font-bold">Ecosistema 4BID · espansione del preventivo</h2>
            <p className="text-sm text-muted-foreground">Prepara prodotti e moduli che il cliente potrà scoprire in una pagina dedicata del preventivo, con tutte le funzionalità. Il cliente può aggiungerli senza poter cambiare prezzi o sconti.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-end">
          <div><Label>Vantaggio cliente 4BID %</Label><Input type="number" min="0" max="100" step="1" value={discountPct} onChange={event => setDiscountPct(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} /></div>
          <div><Label>Prodotto / modulo da proporre</Label><Select value={activeEcosystem ? `${activeEcosystem.project}:${familyOf(activeEcosystem)}` : ""} onValueChange={setSelectedEcosystem}><SelectTrigger><SelectValue placeholder="Scegli prodotto" /></SelectTrigger><SelectContent>{ecosystemCandidates.map(item => <SelectItem key={`${item.project}:${familyOf(item)}`} value={`${item.project}:${familyOf(item)}`}>{PROJECT_LABELS[item.project]} · {item.name}</SelectItem>)}</SelectContent></Select></div>
          <Button type="button" variant="outline" onClick={() => addEcosystemOffer()} disabled={saving || !activeEcosystem}><Plus className="mr-2 h-4 w-4" />Proponi</Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={addCompatibleEcosystem} disabled={saving}><Sparkles className="mr-2 h-4 w-4" />Prepara tutte le proposte compatibili</Button>
          <p className="text-xs text-muted-foreground">Lo sconto è configurabile: non viene inventata nessuna percentuale. I piani o moduli con prezzo dinamico o da configurare vanno prima valorizzati nel preventivo principale.</p>
        </div>

        {ecosystemOffers.length ? <div className="mt-5 space-y-2"><p className="text-sm font-semibold">Proposte già disponibili al cliente</p>{ecosystemOffers.map(line => <div key={line.id} className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{PROJECT_LABELS[line.project || ""] || line.project} · {line.name}</p><p className="text-xs text-muted-foreground">{line.discount?.type === "percentage" && Number(line.discount.value) > 0 ? `Vantaggio cliente 4BID -${line.discount.value}%` : "Nessuno sconto automatico"} · inizialmente non selezionato</p></div><Button type="button" size="sm" variant="ghost" onClick={() => line.id && removeEcosystemOffer(line.id)} disabled={saving}><Trash2 className="mr-2 h-4 w-4" />Rimuovi proposta</Button></div>)}</div> : null}
      </section>
    </div>
  )
}
