"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { calculateQuoteLine, calculateQuoteTotal, formatQuoteAmount, isQuoteLineSelected, type QuoteLineItem } from "@/lib/quotes/types"

type CatalogItem = {
  id: string
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
}

type CatalogGroup = { project: string; items: CatalogItem[]; configured: boolean; error: string | null }

type AccommodationType = "camere" | "appartamenti" | "piazzole"

type StructureOption = {
  value: string
  label: string
  accommodation_type: AccommodationType
  unit_label: string
}

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
  custom: "Voce libera",
}

const DEFAULT_STRUCTURE_OPTIONS: StructureOption[] = [
  { value: "hotel", label: "Hotel / Albergo", accommodation_type: "camere", unit_label: "camere" },
  { value: "resort", label: "Resort", accommodation_type: "camere", unit_label: "camere" },
  { value: "bb", label: "B&B / Affittacamere", accommodation_type: "camere", unit_label: "camere" },
  { value: "agriturismo", label: "Agriturismo", accommodation_type: "camere", unit_label: "camere" },
  { value: "residence", label: "Residence / Appartamenti", accommodation_type: "appartamenti", unit_label: "appartamenti" },
  { value: "casa_vacanze", label: "Casa vacanze", accommodation_type: "appartamenti", unit_label: "appartamenti" },
  { value: "campeggio", label: "Campeggio", accommodation_type: "piazzole", unit_label: "piazzole" },
]

const ACCOMMODATION_OPTIONS: Array<{ value: AccommodationType; label: string; unitLabel: string; singular: string }> = [
  { value: "camere", label: "Camere", unitLabel: "camere", singular: "camera" },
  { value: "appartamenti", label: "Appartamenti / unità abitative", unitLabel: "appartamenti", singular: "appartamento" },
  { value: "piazzole", label: "Piazzole", unitLabel: "piazzole", singular: "piazzola" },
]

const emptyItem = (): QuoteLineItem => ({
  id: crypto.randomUUID(), kind: "custom", project: "custom", name: "", description: "",
  quantity: 1, unit_amount: 0, amount: 0, billing_period: "one_time", trial_days: 0,
  features: [], discount: null, support: null, configuration: {}, catalog_snapshot: {},
  optional: false, default_selected: true,
})

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function clampStars(value: unknown) {
  return Math.min(5, Math.max(1, Math.round(Number(value) || 1)))
}

function clampUnits(value: unknown) {
  return Math.max(1, Math.round(Number(value) || 1))
}

function isAccommodationType(value: unknown): value is AccommodationType {
  return value === "camere" || value === "appartamenti" || value === "piazzole"
}

function accommodationMeta(type: AccommodationType) {
  return ACCOMMODATION_OPTIONS.find(option => option.value === type) || ACCOMMODATION_OPTIONS[0]
}

function isSantaddeoRms(item: Pick<QuoteLineItem, "project" | "kind" | "source_product_id">) {
  return item.project === "santaddeo" && item.kind === "plan" && String(item.source_product_id || "").startsWith("rms-fee:")
}

function normalizeSantaddeoConfig(value: unknown): SantaddeoConfig {
  const raw = objectValue(value)
  const rawCoefficients = objectValue(raw.coefficients)
  const rawOptions = Array.isArray(raw.structure_options) ? raw.structure_options : DEFAULT_STRUCTURE_OPTIONS
  const options = rawOptions.map((option) => {
    const row = objectValue(option)
    const accommodationType: AccommodationType = isAccommodationType(row.accommodation_type) ? row.accommodation_type : "camere"
    return {
      value: String(row.value || "hotel"),
      label: String(row.label || row.value || "Hotel / Albergo"),
      accommodation_type: accommodationType,
      unit_label: String(row.unit_label || accommodationType),
    } satisfies StructureOption
  })
  const structureType = String(raw.structure_type || options[0]?.value || "hotel")
  const selectedOption = options.find(option => option.value === structureType) || options[0] || DEFAULT_STRUCTURE_OPTIONS[0]
  const accommodationType: AccommodationType = isAccommodationType(raw.accommodation_type)
    ? raw.accommodation_type
    : selectedOption.accommodation_type
  const meta = accommodationMeta(accommodationType)

  return {
    pricing_model: "per_accommodation",
    pricing_config_id: String(raw.pricing_config_id || ""),
    pricing_config_name: String(raw.pricing_config_name || "Listino Santaddeo"),
    structure_type: structureType,
    accommodation_type: accommodationType,
    star_rating: clampStars(raw.star_rating ?? 3),
    accommodations: clampUnits(raw.accommodations ?? 1),
    fee_base_value: Math.max(0, Number(raw.fee_base_value) || 0),
    coefficients: {
      camere: Math.max(0, Number(rawCoefficients.camere) || 0),
      appartamenti: Math.max(0, Number(rawCoefficients.appartamenti) || 0),
      piazzole: Math.max(0, Number(rawCoefficients.piazzole) || 0),
    },
    structure_options: options,
    unit_label: meta.unitLabel,
    formula: raw.formula ? String(raw.formula) : undefined,
  }
}

function santaddeoUnitPrice(config: SantaddeoConfig) {
  const coefficient = config.coefficients[config.accommodation_type] || 0
  return Math.round(config.fee_base_value * coefficient * config.star_rating * 100) / 100
}

export default function QuoteCommerceBuilder() {
  const router = useRouter()
  const [catalog, setCatalog] = useState<CatalogGroup[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState({ name: "", company: "", email: "", vat: "", address: "" })
  const [title, setTitle] = useState("Soluzioni digitali 4Bid")
  const [description, setDescription] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [vatIncluded, setVatIncluded] = useState(true)
  const [items, setItems] = useState<QuoteLineItem[]>([emptyItem()])

  useEffect(() => {
    fetch("/api/quotes/catalog", { cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("Catalogo non disponibile"); return r.json() })
      .then(data => setCatalog(Array.isArray(data) ? data : data.projects ?? []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoadingCatalog(false))
  }, [])

  const calculated = useMemo(() => items.map(calculateQuoteLine), [items])
  const total = useMemo(() => calculateQuoteTotal(items), [items])
  const selectedCalculated = calculated.filter(isQuoteLineSelected)
  const oneTime = selectedCalculated.filter(i => i.billing_period === "one_time").reduce((s, i) => s + i.amount, 0)
  const recurring = selectedCalculated.filter(i => i.billing_period !== "one_time")

  function patchItem(index: number, patch: Partial<QuoteLineItem>) {
    setItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function patchSantaddeoConfig(index: number, patch: Partial<SantaddeoConfig>) {
    setItems(current => current.map((item, i) => {
      if (i !== index) return item
      const previous = normalizeSantaddeoConfig(item.configuration)
      let next = { ...previous, ...patch }

      if (patch.accommodation_type && isAccommodationType(patch.accommodation_type)) {
        next = { ...next, unit_label: accommodationMeta(patch.accommodation_type).unitLabel }
      }

      next.star_rating = clampStars(next.star_rating)
      next.accommodations = clampUnits(next.accommodations)
      const unitAmount = santaddeoUnitPrice(next)
      return {
        ...item,
        configuration: next as unknown as Record<string, unknown>,
        quantity: next.accommodations,
        unit_amount: unitAmount,
        list_amount: unitAmount * next.accommodations,
        amount: unitAmount * next.accommodations,
      }
    }))
  }

  function addCatalogItem(item: CatalogItem) {
    const common: QuoteLineItem = {
      id: crypto.randomUUID(), kind: item.kind, project: item.project, source_product_id: item.id,
      catalog_version: item.version || "current", name: item.name, description: item.description || item.name,
      features: item.features, quantity: 1, unit_amount: item.unit_amount, list_amount: item.unit_amount,
      amount: item.unit_amount, billing_period: item.billing_period, trial_days: item.trial_days || 0,
      support: item.support || null, discount: null,
      configuration: item.configuration_schema || {}, catalog_snapshot: item.raw_snapshot,
      optional: false, default_selected: true,
    }

    if (isSantaddeoRms(common)) {
      const config = normalizeSantaddeoConfig(item.configuration_schema)
      const unitAmount = santaddeoUnitPrice(config)
      common.configuration = config as unknown as Record<string, unknown>
      common.quantity = config.accommodations
      common.unit_amount = unitAmount
      common.list_amount = unitAmount * config.accommodations
      common.amount = unitAmount * config.accommodations
    }

    setItems(current => [...current.filter(i => i.description || i.name), common])
  }

  async function save() {
    if (!client.name.trim() && !client.company.trim()) return toast.error("Inserisci referente o azienda")
    if (!items.length || items.some(i => !i.description.trim())) return toast.error("Completa tutte le voci")

    for (const item of items) {
      if (!isSantaddeoRms(item)) continue
      const config = normalizeSantaddeoConfig(item.configuration)
      if (!config.pricing_config_id) return toast.error("Listino Santaddeo non valido: ricarica il catalogo")
      if (!config.structure_type) return toast.error("Seleziona il tipo di struttura Santaddeo")
      if (!config.accommodation_type) return toast.error("Seleziona il tipo di sistemazioni Santaddeo")
      if (config.star_rating < 1 || config.star_rating > 5) return toast.error("Seleziona la categoria/stelle Santaddeo")
      if (config.accommodations < 1) return toast.error("Inserisci il numero di sistemazioni Santaddeo")
      if (santaddeoUnitPrice(config) <= 0) return toast.error("Il listino Santaddeo restituisce un prezzo non valido")
    }

    if (calculated.some(i => i.amount < 0 || !Number.isFinite(i.amount))) return toast.error("Importi non validi")
    setSaving(true)
    try {
      const res = await fetch("/api/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: client.name, client_company: client.company || null, client_email: client.email || null,
          client_vat: client.vat || null, client_address: client.address || null, title, description,
          payment_terms: paymentTerms, line_items: calculated, vat_included: vatIncluded, currency: "eur",
          requested_fields: [],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Salvataggio fallito")
      toast.success("Preventivo commerciale creato")
      router.push("/admin/quotes")
      router.refresh()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return <div className="max-w-7xl mx-auto space-y-8">
    <div className="flex items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Nuovo preventivo commerciale</h1><p className="text-muted-foreground">HotelAccelerator, prodotti verticali, consulenze e servizi 4Bid</p></div>
      <Button variant="outline" onClick={() => router.push("/admin/quotes")}><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button>
    </div>

    <section className="border rounded-xl p-5 space-y-4 bg-card">
      <h2 className="font-semibold text-lg">Cliente</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {([['name','Referente'],['company','Azienda'],['email','Email'],['vat','P.IVA / CF'],['address','Indirizzo']] as const).map(([key,label]) =>
          <div key={key} className={key === 'address' ? 'md:col-span-2 space-y-1.5' : 'space-y-1.5'}><Label>{label}</Label><Input type={key === 'email' ? 'email' : 'text'} value={client[key]} onChange={e => setClient(v => ({...v,[key]:e.target.value}))} /></div>)}
      </div>
    </section>

    <section className="border rounded-xl p-5 space-y-4 bg-card">
      <h2 className="font-semibold text-lg">Proposta</h2>
      <div className="space-y-1.5"><Label>Titolo</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Descrizione</Label><Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Condizioni</Label><Textarea rows={3} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} /></div>
    </section>

    <section className="border rounded-xl p-5 space-y-4 bg-card">
      <div className="flex justify-between items-center"><div><h2 className="font-semibold text-lg">Catalogo prodotti</h2><p className="text-xs text-muted-foreground">I prezzi e le funzionalità arrivano dai database dei singoli progetti e vengono fotografati nel preventivo.</p></div>{loadingCatalog && <span className="text-sm">Caricamento…</span>}</div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {catalog.map(group => <div key={group.project} className="border rounded-lg p-3 space-y-2"><h3 className="font-semibold">{PROJECT_LABELS[group.project] || group.project}</h3>{group.error && <p className="text-xs text-destructive">{group.error}</p>}{!group.items.length && <p className="text-xs text-muted-foreground">Catalogo non configurato</p>}{group.items.map(item => <button type="button" key={item.id} onClick={() => addCatalogItem(item)} className="w-full text-left border rounded-md p-3 hover:bg-muted"><span className="font-medium block">{item.name}</span><span className="text-xs text-muted-foreground">{item.project === "santaddeo" && item.kind === "plan" && item.id.startsWith("rms-fee:") ? "Configura struttura, sistemazioni, stelle e quantità" : item.unit_amount > 0 ? `${formatQuoteAmount(item.unit_amount,item.currency)} · ${item.billing_period}` : "Prezzo personalizzabile"}</span></button>)}</div>)}
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="font-semibold text-xl">Voci del preventivo</h2><Button variant="outline" onClick={() => setItems(v => [...v, emptyItem()])}><Plus className="h-4 w-4 mr-2" />Voce libera</Button></div>
      {items.map((item,index) => {
        const santaddeo = isSantaddeoRms(item)
        const santaddeoConfig = santaddeo ? normalizeSantaddeoConfig(item.configuration) : null
        const santaddeoPrice = santaddeoConfig ? santaddeoUnitPrice(santaddeoConfig) : 0
        const accommodation = santaddeoConfig ? accommodationMeta(santaddeoConfig.accommodation_type) : null
        return <div key={item.id || index} className="border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between gap-3"><div className="grid md:grid-cols-2 gap-3 flex-1"><div><Label>Nome</Label><Input value={item.name || ''} onChange={e => patchItem(index,{name:e.target.value})} /></div><div><Label>Progetto</Label><Select value={item.project || 'custom'} onValueChange={v => patchItem(index,{project:v as QuoteLineItem['project']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['consulting','hotelaccelerator','santaddeo','hotelprofitai','manubot','custom'].map(v => <SelectItem key={v} value={v}>{PROJECT_LABELS[v] || v}</SelectItem>)}</SelectContent></Select></div></div><Button size="icon" variant="ghost" onClick={() => setItems(v => v.filter((_,i)=>i!==index))}><Trash2 className="h-4 w-4" /></Button></div>
          <div><Label>Descrizione</Label><Textarea value={item.description} onChange={e => patchItem(index,{description:e.target.value})} /></div>

          {santaddeoConfig ? <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
            <div><h3 className="font-semibold">Configurazione struttura Santaddeo</h3><p className="text-xs text-muted-foreground">Il prezzo è calcolato automaticamente dal listino {santaddeoConfig.pricing_config_name}. Tipo struttura e tipo sistemazione sono indipendenti.</p></div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <div><Label>Tipo di struttura</Label><Select value={santaddeoConfig.structure_type} onValueChange={value => patchSantaddeoConfig(index,{structure_type:value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{santaddeoConfig.structure_options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Tipo di sistemazioni</Label><Select value={santaddeoConfig.accommodation_type} onValueChange={value => patchSantaddeoConfig(index,{accommodation_type:value as AccommodationType})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCOMMODATION_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Categoria / stelle</Label><Select value={String(santaddeoConfig.star_rating)} onValueChange={value => patchSantaddeoConfig(index,{star_rating:Number(value)})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(stars => <SelectItem key={stars} value={String(stars)}>{stars} {"★".repeat(stars)}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Numero {santaddeoConfig.unit_label}</Label><Input type="number" min="1" value={santaddeoConfig.accommodations} onChange={e => patchSantaddeoConfig(index,{accommodations:Number(e.target.value)})} /></div>
              <div><Label>Prezzo / {accommodation?.singular || "sistemazione"} / mese</Label><Input readOnly value={formatQuoteAmount(santaddeoPrice)} /></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background border p-3"><span className="text-sm text-muted-foreground">{santaddeoConfig.accommodations} {santaddeoConfig.unit_label} × {formatQuoteAmount(santaddeoPrice)} / mese</span><strong className="text-xl">{formatQuoteAmount(calculateQuoteLine(item).amount)} / mese</strong></div>
          </div> : <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"><div><Label>Quantità</Label><Input type="number" min="1" value={item.quantity || 1} onChange={e => patchItem(index,{quantity:Number(e.target.value)})} /></div><div><Label>Prezzo unitario</Label><Input type="number" min="0" step="0.01" value={item.unit_amount || 0} onChange={e => patchItem(index,{unit_amount:Number(e.target.value)})} /></div><div><Label>Periodicità</Label><Select value={item.billing_period || 'one_time'} onValueChange={v => patchItem(index,{billing_period:v as QuoteLineItem['billing_period']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['one_time','monthly','quarterly','yearly'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div><Label>Trial giorni</Label><Input type="number" min="0" value={item.trial_days || 0} onChange={e => patchItem(index,{trial_days:Number(e.target.value)})} /></div><div><Label>Totale voce</Label><Input readOnly value={formatQuoteAmount(calculateQuoteLine(item).amount)} /></div></div>}

          <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2"><Switch checked={!!item.optional} onCheckedChange={optional => patchItem(index,{optional,default_selected:optional ? item.default_selected !== false : true})}/><div><Label>Voce opzionale</Label><p className="text-xs text-muted-foreground">Il cliente può includerla o escluderla prima di accettare.</p></div></div>
            {item.optional ? <div className="flex items-center gap-2"><Switch checked={item.default_selected !== false} onCheckedChange={default_selected => patchItem(index,{default_selected})}/><div><Label>Preselezionata</Label><p className="text-xs text-muted-foreground">Stato iniziale mostrato al cliente.</p></div></div> : <span className="text-xs font-medium text-primary">Obbligatoria</span>}
          </div>

          <div className="grid sm:grid-cols-3 gap-3"><div><Label>Tipo sconto</Label><Select value={item.discount?.type || 'none'} onValueChange={v => patchItem(index,{discount:v==='none'?null:{type:v as 'percentage'|'fixed',value:item.discount?.value||0}})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nessuno</SelectItem><SelectItem value="percentage">Percentuale</SelectItem><SelectItem value="fixed">Importo fisso</SelectItem></SelectContent></Select></div><div><Label>Valore sconto</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.value || 0} onChange={e => patchItem(index,{discount:item.discount?{...item.discount,value:Number(e.target.value)}:null})} /></div><div><Label>Durata sconto (mesi)</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.duration_months || ''} onChange={e => patchItem(index,{discount:item.discount?{...item.discount,duration_months:e.target.value?Number(e.target.value):null}:null})} /></div></div>
          <div className="grid md:grid-cols-2 gap-3"><div><Label>Funzionalità incluse (una per riga)</Label><Textarea rows={4} value={(item.features||[]).join('\n')} onChange={e => patchItem(index,{features:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})} /></div><div><Label>Assistenza / SLA</Label><Textarea rows={4} value={item.support?.notes || ''} onChange={e => patchItem(index,{support:{...(item.support||{}),notes:e.target.value}})} placeholder="Canali, orari, tempi di risposta, account manager…" /></div></div>
        </div>
      })}
    </section>

    <section className="sticky bottom-4 border rounded-xl p-5 bg-background/95 backdrop-blur shadow-lg flex flex-wrap justify-between items-center gap-4"><div><p className="text-sm text-muted-foreground">Una tantum inizialmente selezionata: {formatQuoteAmount(oneTime)}</p>{recurring.map((i,k)=><p key={k} className="text-sm text-muted-foreground">{i.name || i.description}: {formatQuoteAmount(i.amount)} / {i.billing_period}</p>)}<p className="text-2xl font-bold">Totale iniziale: {formatQuoteAmount(total)}</p><p className="text-xs text-muted-foreground">Le voci opzionali non preselezionate non concorrono al totale iniziale; il cliente potrà modificarle prima dell'accettazione.</p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><Switch checked={vatIncluded} onCheckedChange={setVatIncluded}/><Label>IVA inclusa</Label></div><Button size="lg" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving?'Salvataggio…':'Crea preventivo'}</Button></div></section>
  </div>
}
