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

const PROJECT_LABELS: Record<string, string> = {
  hotelaccelerator: "HotelAccelerator — Suite",
  santaddeo: "Santaddeo — Revenue",
  hotelprofitai: "HotelProfitAI — Controllo di gestione",
  manubot: "ManuBot — Operations",
  consulting: "Consulenza 4Bid",
  custom: "Voce libera",
}

const emptyItem = (): QuoteLineItem => ({
  id: crypto.randomUUID(), kind: "custom", project: "custom", name: "", description: "",
  quantity: 1, unit_amount: 0, amount: 0, billing_period: "one_time", trial_days: 0,
  features: [], discount: null, support: null, configuration: {}, catalog_snapshot: {},
  optional: false, default_selected: true,
})

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

  function addCatalogItem(item: CatalogItem) {
    setItems(current => [...current.filter(i => i.description || i.name), {
      id: crypto.randomUUID(), kind: item.kind, project: item.project, source_product_id: item.id,
      catalog_version: item.version || "current", name: item.name, description: item.description || item.name,
      features: item.features, quantity: 1, unit_amount: item.unit_amount, list_amount: item.unit_amount,
      amount: item.unit_amount, billing_period: item.billing_period, trial_days: item.trial_days || 0,
      support: item.support || null, discount: null,
      configuration: item.configuration_schema || {}, catalog_snapshot: item.raw_snapshot,
      optional: false, default_selected: true,
    }])
  }

  async function save() {
    if (!client.name.trim() && !client.company.trim()) return toast.error("Inserisci referente o azienda")
    if (!items.length || items.some(i => !i.description.trim())) return toast.error("Completa tutte le voci")
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
      <div className="flex justify-between items-center"><div><h2 className="font-semibold text-lg">Catalogo prodotti</h2><p className="text-xs text-muted-foreground">HotelAccelerator è la suite madre; Santaddeo, HotelProfitAI e ManuBot restano acquistabili anche singolarmente. I dati vengono fotografati nel preventivo.</p></div>{loadingCatalog && <span className="text-sm">Caricamento…</span>}</div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {catalog.map(group => <div key={group.project} className="border rounded-lg p-3 space-y-2"><h3 className="font-semibold">{PROJECT_LABELS[group.project] || group.project}</h3>{group.error && <p className="text-xs text-destructive">{group.error}</p>}{!group.items.length && <p className="text-xs text-muted-foreground">Catalogo non configurato</p>}{group.items.map(item => <button type="button" key={item.id} onClick={() => addCatalogItem(item)} className="w-full text-left border rounded-md p-3 hover:bg-muted"><span className="font-medium block">{item.name}</span><span className="text-xs text-muted-foreground">{item.unit_amount > 0 ? `${formatQuoteAmount(item.unit_amount,item.currency)} · ${item.billing_period}` : "Prezzo personalizzabile"}</span></button>)}</div>)}
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="font-semibold text-xl">Voci del preventivo</h2><Button variant="outline" onClick={() => setItems(v => [...v, emptyItem()])}><Plus className="h-4 w-4 mr-2" />Voce libera</Button></div>
      {items.map((item,index) => <div key={item.id || index} className="border rounded-xl p-5 bg-card space-y-4">
        <div className="flex justify-between gap-3"><div className="grid md:grid-cols-2 gap-3 flex-1"><div><Label>Nome</Label><Input value={item.name || ''} onChange={e => patchItem(index,{name:e.target.value})} /></div><div><Label>Progetto</Label><Select value={item.project || 'custom'} onValueChange={v => patchItem(index,{project:v as QuoteLineItem['project']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['consulting','hotelaccelerator','santaddeo','hotelprofitai','manubot','custom'].map(v => <SelectItem key={v} value={v}>{PROJECT_LABELS[v] || v}</SelectItem>)}</SelectContent></Select></div></div><Button size="icon" variant="ghost" onClick={() => setItems(v => v.filter((_,i)=>i!==index))}><Trash2 className="h-4 w-4" /></Button></div>
        <div><Label>Descrizione</Label><Textarea value={item.description} onChange={e => patchItem(index,{description:e.target.value})} /></div>

        <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2"><Switch checked={!!item.optional} onCheckedChange={optional => patchItem(index,{optional,default_selected:optional ? item.default_selected !== false : true})}/><div><Label>Voce opzionale</Label><p className="text-xs text-muted-foreground">Il cliente può includerla o escluderla prima di accettare.</p></div></div>
          {item.optional ? <div className="flex items-center gap-2"><Switch checked={item.default_selected !== false} onCheckedChange={default_selected => patchItem(index,{default_selected})}/><div><Label>Preselezionata</Label><p className="text-xs text-muted-foreground">Stato iniziale mostrato al cliente.</p></div></div> : <span className="text-xs font-medium text-primary">Obbligatoria</span>}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"><div><Label>Quantità</Label><Input type="number" min="1" value={item.quantity || 1} onChange={e => patchItem(index,{quantity:Number(e.target.value)})} /></div><div><Label>Prezzo unitario</Label><Input type="number" min="0" step="0.01" value={item.unit_amount || 0} onChange={e => patchItem(index,{unit_amount:Number(e.target.value)})} /></div><div><Label>Periodicità</Label><Select value={item.billing_period || 'one_time'} onValueChange={v => patchItem(index,{billing_period:v as QuoteLineItem['billing_period']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['one_time','monthly','quarterly','yearly'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div><Label>Trial giorni</Label><Input type="number" min="0" value={item.trial_days || 0} onChange={e => patchItem(index,{trial_days:Number(e.target.value)})} /></div><div><Label>Totale voce</Label><Input readOnly value={formatQuoteAmount(calculateQuoteLine(item).amount)} /></div></div>
        <div className="grid sm:grid-cols-3 gap-3"><div><Label>Tipo sconto</Label><Select value={item.discount?.type || 'none'} onValueChange={v => patchItem(index,{discount:v==='none'?null:{type:v as 'percentage'|'fixed',value:item.discount?.value||0}})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nessuno</SelectItem><SelectItem value="percentage">Percentuale</SelectItem><SelectItem value="fixed">Importo fisso</SelectItem></SelectContent></Select></div><div><Label>Valore sconto</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.value || 0} onChange={e => patchItem(index,{discount:item.discount?{...item.discount,value:Number(e.target.value)}:null})} /></div><div><Label>Durata sconto (mesi)</Label><Input disabled={!item.discount} type="number" min="0" value={item.discount?.duration_months || ''} onChange={e => patchItem(index,{discount:item.discount?{...item.discount,duration_months:e.target.value?Number(e.target.value):null}:null})} /></div></div>
        <div className="grid md:grid-cols-2 gap-3"><div><Label>Funzionalità incluse (una per riga)</Label><Textarea rows={4} value={(item.features||[]).join('\n')} onChange={e => patchItem(index,{features:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})} /></div><div><Label>Assistenza / SLA</Label><Textarea rows={4} value={item.support?.notes || ''} onChange={e => patchItem(index,{support:{...(item.support||{}),notes:e.target.value}})} placeholder="Canali, orari, tempi di risposta, account manager…" /></div></div>
      </div>)}
    </section>

    <section className="sticky bottom-4 border rounded-xl p-5 bg-background/95 backdrop-blur shadow-lg flex flex-wrap justify-between items-center gap-4"><div><p className="text-sm text-muted-foreground">Una tantum inizialmente selezionata: {formatQuoteAmount(oneTime)}</p>{recurring.map((i,k)=><p key={k} className="text-sm text-muted-foreground">{i.name || i.description}: {formatQuoteAmount(i.amount)} / {i.billing_period}</p>)}<p className="text-2xl font-bold">Totale iniziale: {formatQuoteAmount(total)}</p><p className="text-xs text-muted-foreground">Le voci opzionali non preselezionate non concorrono al totale iniziale; il cliente potrà modificarle prima dell'accettazione.</p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><Switch checked={vatIncluded} onCheckedChange={setVatIncluded}/><Label>IVA inclusa</Label></div><Button size="lg" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving?'Salvataggio…':'Crea preventivo'}</Button></div></section>
  </div>
}