"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Check, CheckCircle2, Loader2, Plus, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { applyBillingPreference, getCommercialMeta, hasAnnualBillingOption } from "@/lib/quotes/commercial"
import { ecosystemDiscountLabel, isEcosystemOfferSelected } from "@/lib/quotes/ecosystem"
import { calculateQuoteLine, formatQuoteAmount, type QuoteLineItem } from "@/lib/quotes/types"

const PROJECT_LABELS: Record<string, string> = {
  hotelaccelerator: "HotelAccelerator",
  santaddeo: "Santaddeo",
  hotelprofitai: "HotelProfitAI",
  manubot: "ManuBot",
}

const PROJECT_PROMISES: Record<string, string> = {
  hotelaccelerator: "Vendita, CRM, comunicazioni e operatività in un unico ecosistema.",
  santaddeo: "Revenue Management e pricing guidati dai dati.",
  hotelprofitai: "Controllo economico, costi, margini e profittabilità.",
  manubot: "Manutenzioni, housekeeping e attività operative organizzate.",
}

function PriceBlock({ item, currency }: { item: QuoteLineItem; currency: string }) {
  const monthly = applyBillingPreference(item, "monthly")
  const monthlyCalc = calculateQuoteLine(monthly)
  const yearly = hasAnnualBillingOption(item) ? calculateQuoteLine(applyBillingPreference(item, "yearly")) : null
  const discountLabel = ecosystemDiscountLabel(item)
  const list = Number(monthlyCalc.list_amount || 0)
  const net = Number(monthlyCalc.amount || 0)

  return (
    <div className="rounded-xl border bg-muted/25 p-3">
      {discountLabel ? <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">{discountLabel}</p> : null}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {list > net + 0.005 ? <span className="text-sm text-muted-foreground line-through">{formatQuoteAmount(list, currency)}</span> : null}
        <span className="text-xl font-black">{formatQuoteAmount(net, currency)}</span>
        <span className="text-xs text-muted-foreground">/ mese</span>
      </div>
      {yearly && yearly.billing_period === "yearly" ? <p className="mt-1 text-xs font-semibold text-emerald-800">Annuale: {formatQuoteAmount(yearly.amount, currency)} / anno</p> : null}
    </div>
  )
}

export default function EcosystemBrowser({
  token,
  offers,
  currency,
  locked,
}: {
  token: string
  offers: QuoteLineItem[]
  currency: string
  locked: boolean
}) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const grouped = new Map<string, QuoteLineItem[]>()
  for (const offer of offers) {
    const project = offer.project || "custom"
    grouped.set(project, [...(grouped.get(project) || []), offer])
  }

  async function toggle(item: QuoteLineItem, selected: boolean) {
    if (!item.id || locked) return
    setPendingId(item.id)
    try {
      const response = await fetch(`/api/quotes/shared/${token}/ecosystem`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line_id: item.id, selected }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || "Impossibile aggiornare il preventivo")
      toast.success(selected ? "Soluzione aggiunta al preventivo" : "Soluzione rimossa dal preventivo")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'aggiornamento")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Ecosistema 4BID</p>
            <h1 className="text-2xl font-black sm:text-3xl">Amplia la tua soluzione</h1>
          </div>
          <Button asChild variant="outline"><Link href={`/preventivo/${token}`}><ArrowLeft className="mr-2 h-4 w-4" />Torna al preventivo</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <h2 className="text-xl font-bold text-emerald-950">Più prodotti, un unico ecosistema</h2>
              <p className="mt-1 text-sm leading-relaxed text-emerald-950/80">Qui trovi le soluzioni che 4BID ha preparato come possibile estensione della proposta. Prezzi e sconti sono già congelati nel preventivo: puoi scegliere cosa aggiungere, ma non puoi modificarli.</p>
            </div>
          </div>
        </section>

        {offers.length === 0 ? <div className="rounded-2xl border bg-card p-8 text-center"><p className="font-semibold">Non ci sono ancora proposte integrative disponibili.</p><p className="mt-1 text-sm text-muted-foreground">Contatta 4BID se vuoi valutare altri moduli.</p></div> : null}

        {Array.from(grouped.entries()).map(([project, items]) => (
          <section key={project} className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{PROJECT_LABELS[project] || project}</p>
              <h2 className="text-2xl font-black">{PROJECT_LABELS[project] || project}</h2>
              <p className="text-sm text-muted-foreground">{PROJECT_PROMISES[project] || "Soluzioni digitali 4BID per la gestione alberghiera."}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map(item => {
                const selected = isEcosystemOfferSelected(item, false)
                const busy = pendingId === item.id
                const dependency = getCommercialMeta(item).dependency
                return (
                  <article key={item.id} className={`rounded-2xl border-2 bg-card p-5 shadow-sm ${selected ? "border-emerald-400" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black">{item.name || item.description}</h3>
                          {selected ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Nel preventivo</span> : null}
                        </div>
                        {item.name && item.description && item.description !== item.name ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p> : null}
                      </div>
                    </div>

                    <div className="mt-4"><PriceBlock item={item} currency={currency} /></div>

                    {item.features?.length ? <details className="mt-4 rounded-xl border bg-muted/15 p-4" open><summary className="cursor-pointer font-bold">Tutte le funzionalità ({item.features.length})</summary><ul className="mt-3 space-y-2">{item.features.map((feature, index) => <li key={`${feature}-${index}`} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><span>{feature}</span></li>)}</ul></details> : null}

                    {dependency?.requires_base ? <p className="mt-3 text-xs text-muted-foreground">Questo modulo richiede il piano base {PROJECT_LABELS[dependency.project || project] || dependency.project || project}. Se necessario, viene aggiunto insieme al modulo.</p> : null}

                    <Button type="button" className="mt-5 w-full" variant={selected ? "outline" : "default"} disabled={locked || busy} onClick={() => toggle(item, !selected)}>
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : selected ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                      {locked ? "Preventivo non più modificabile" : selected ? "Rimuovi dal preventivo" : "Aggiungi al preventivo"}
                    </Button>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
