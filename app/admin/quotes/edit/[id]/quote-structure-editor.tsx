"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleDot, Loader2, Save, Settings2, Sparkles, Tag } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { QuoteLineItem, SalesChannelQuote } from "@/lib/quotes/types"
import { formatQuoteAmount } from "@/lib/quotes/types"
import { getCommercialMeta } from "@/lib/quotes/commercial"

const MODULE_KINDS = new Set(["plan", "module"])
const SALES_BADGES = [
  "Offerta speciale",
  "Offerta lancio",
  "Esclusiva 4BID",
  "Più scelto",
  "Consigliato",
  "Best value",
  "Solo per te",
  "Novità",
  "Bonus incluso",
  "Disponibilità limitata",
  "Partnership",
  "Edizione riservata",
] as const

type QuoteLineWithBadge = QuoteLineItem & { sales_badge?: string | null }

function isModule(item: QuoteLineItem) {
  return MODULE_KINDS.has(String(item.kind || ""))
}

function choiceKey(item: QuoteLineItem) {
  const meta = getCommercialMeta(item)
  if (meta.service_type && meta.parent_line_id) return `service:${meta.parent_line_id}`
  return null
}

function typeLabel(item: QuoteLineItem) {
  if (item.kind === "plan") return item.optional ? "Facoltativo" : "Obbligatorio"
  if (choiceKey(item)) return "Alternativo"
  return item.optional ? "Facoltativo" : "Incluso"
}

function periodLabel(item: QuoteLineItem) {
  if (item.billing_period === "monthly") return "/mese"
  if (item.billing_period === "quarterly") return "/trimestre"
  if (item.billing_period === "yearly") return "/anno"
  return "una tantum"
}

function LineSummary({ item, onOptionalChange, onBadgeChange }: {
  item: QuoteLineWithBadge
  onOptionalChange: (value: boolean) => void
  onBadgeChange: (value: string | null) => void
}) {
  const alternative = Boolean(choiceKey(item))
  const badge = (item.sales_badge || "").trim()
  const presetBadge = SALES_BADGES.includes(badge as (typeof SALES_BADGES)[number])
  const badgeSelectValue = !badge ? "__none__" : presetBadge ? badge : "__custom__"

  return (
    <article className="rounded-xl border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{item.name || item.description || "Voce preventivo"}</h4>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${alternative ? "bg-violet-100 text-violet-800" : item.optional ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              {typeLabel(item)}
            </span>
          </div>
          {item.description && item.description !== item.name ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
          <p className="mt-2 text-sm font-medium">
            {formatQuoteAmount(Number(item.unit_amount || item.amount || 0), "eur")} <span className="font-normal text-muted-foreground">{periodLabel(item)}</span>
          </p>
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-[24rem]">
          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <div>
              <p className="text-xs font-semibold">{item.kind === "plan" ? "Piattaforma opzionale" : "Facoltativo per il cliente"}</p>
              <p className="text-[11px] text-muted-foreground">Il cliente può includere o rimuovere questa voce prima di accettare.</p>
            </div>
            <Switch checked={Boolean(item.optional)} onCheckedChange={onOptionalChange} />
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /><p className="text-xs font-semibold">Slogan / badge sul preventivo</p></div>
            <Select
              value={badgeSelectValue}
              onValueChange={value => {
                if (value === "__none__") onBadgeChange(null)
                else if (value === "__custom__") onBadgeChange(presetBadge ? "" : badge)
                else onBadgeChange(value)
              }}
            >
              <SelectTrigger><SelectValue placeholder="Nessun badge" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nessun badge</SelectItem>
                {SALES_BADGES.map(label => <SelectItem key={label} value={label}>{label}</SelectItem>)}
                <SelectItem value="__custom__">Personalizzato…</SelectItem>
              </SelectContent>
            </Select>
            {badgeSelectValue === "__custom__" ? (
              <Input
                className="mt-2"
                maxLength={42}
                placeholder="Es. Condizione riservata Jada Hotels"
                value={badge}
                onChange={event => onBadgeChange(event.target.value || null)}
              />
            ) : null}
            <p className="mt-2 text-[11px] text-muted-foreground">Compare in evidenza nel box del modulo sulla pagina pubblica. È solo comunicazione commerciale: non modifica prezzi o condizioni.</p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function QuoteStructureEditor({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<SalesChannelQuote | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/quotes/${quoteId}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || "Preventivo non trovato")
        setQuote(data)
      })
      .catch(error => toast.error(error.message))
  }, [quoteId])

  const lines = useMemo(() => (quote?.line_items || []) as QuoteLineWithBadge[], [quote])
  const modules = useMemo(() => lines.map((item, index) => ({ item, index })).filter(({ item }) => isModule(item)), [lines])
  const services = useMemo(() => lines.map((item, index) => ({ item, index })).filter(({ item }) => !isModule(item)), [lines])

  const serviceBlocks = useMemo(() => {
    const blocks: Array<{ key: string; entries: Array<{ item: QuoteLineWithBadge; index: number }>; alternative: boolean }> = []
    const consumed = new Set<number>()
    for (const entry of services) {
      if (consumed.has(entry.index)) continue
      const key = choiceKey(entry.item)
      if (!key) {
        blocks.push({ key: `line:${entry.item.id || entry.index}`, entries: [entry], alternative: false })
        consumed.add(entry.index)
        continue
      }
      const grouped = services.filter(other => choiceKey(other.item) === key)
      grouped.forEach(other => consumed.add(other.index))
      blocks.push({ key, entries: grouped, alternative: grouped.length > 1 })
    }
    return blocks
  }, [services])

  function patchLine(index: number, patch: Partial<QuoteLineWithBadge>) {
    setQuote(current => current ? {
      ...current,
      line_items: ((current.line_items || []) as QuoteLineWithBadge[]).map((line, i) => i === index ? { ...line, ...patch } : line),
    } : current)
  }

  async function saveStructure() {
    if (!quote) return
    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line_items: quote.line_items || [] }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Salvataggio fallito")
      setQuote(data)
      toast.success("Struttura del preventivo aggiornata")
      // QuoteStructureEditor e QuoteCatalogEditor mantengono stati client separati.
      // Ricaricando dopo il salvataggio entrambi ripartono dalla stessa versione DB:
      // l'editor avanzato non può più riscrivere un vecchio optional=false.
      window.setTimeout(() => window.location.reload(), 250)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!quote) return <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Caricamento struttura preventivo…</div>

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /><p className="text-xs font-black uppercase tracking-[0.16em]">Struttura commerciale</p></div>
            <h2 className="mt-1 text-2xl font-black">Costruisci il preventivo in due passaggi</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Prima definisci cosa compra il cliente. Poi scegli come attivarlo, configurarlo e supportarlo. Ogni piattaforma o modulo può essere reso facoltativo; le dipendenze vengono comunque validate al salvataggio.</p>
          </div>
          <Button onClick={saveStructure} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Salvataggio…" : "Salva struttura"}</Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/40 p-5">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-black text-primary-foreground">1</span><div><h3 className="text-xl font-bold">Moduli desiderati</h3><p className="text-sm text-muted-foreground">Software, piani e moduli: obbligatori oppure facoltativi.</p></div></div>
        </div>
        <div className="space-y-3 p-5">
          {modules.length ? modules.map(({ item, index }) => (
            <LineSummary
              key={item.id || index}
              item={item}
              onOptionalChange={value => patchLine(index, { optional: value, default_selected: value ? item.default_selected !== false : true })}
              onBadgeChange={value => patchLine(index, { sales_badge: value })}
            />
          )) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nessun modulo ancora inserito. Aggiungilo dall'editor avanzato qui sotto.</p>}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/40 p-5">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-black text-primary-foreground">2</span><div><h3 className="text-xl font-bold">Optional, supporto e configurazione</h3><p className="text-sm text-muted-foreground">Setup, configurazione, formazione, consulenza e servizi accessori. Dove previsto, il cliente sceglie una sola alternativa.</p></div></div>
        </div>
        <div className="space-y-4 p-5">
          {serviceBlocks.length ? serviceBlocks.map(block => (
            <div key={block.key} className={block.alternative ? "rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-4" : ""}>
              {block.alternative ? <div className="mb-3 flex items-center gap-2 text-sm font-bold text-violet-800"><CircleDot className="h-4 w-4" />Scelta alternativa: il cliente deve scegliere una delle opzioni</div> : null}
              <div className="space-y-3">
                {block.entries.map(({ item, index }, optionIndex) => (
                  <div key={item.id || index}>
                    {optionIndex > 0 && block.alternative ? <div className="my-3 flex items-center gap-3"><div className="h-px flex-1 bg-violet-200" /><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black tracking-widest text-violet-800">OPPURE</span><div className="h-px flex-1 bg-violet-200" /></div> : null}
                    <LineSummary
                      item={item}
                      onOptionalChange={value => patchLine(index, { optional: value, default_selected: value ? item.default_selected !== false : true })}
                      onBadgeChange={value => patchLine(index, { sales_badge: value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nessun servizio di attivazione o supporto inserito.</p>}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        <Settings2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Prezzi, sconti, pagamento mensile/annuale, catalogo e configurazioni tecniche restano nell'editor avanzato. Qui gestisci prima la struttura commerciale, l'opzionalità e i badge che vedrà il cliente.</p>
      </div>
    </div>
  )
}
