"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { applyBillingPreference, getCommercialMeta, hasAnnualBillingOption } from "@/lib/quotes/commercial"
import { ecosystemDiscountLabel, isEcosystemOffer, isEcosystemOfferSelected } from "@/lib/quotes/ecosystem"
import { calculateQuoteLine, formatQuoteAmount, type QuoteLineItem } from "@/lib/quotes/types"

type ProductKey = "hotelaccelerator" | "santaddeo" | "hotelprofitai" | "manubot"

const PRODUCT_ORDER: ProductKey[] = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"]

const PRODUCT_META: Record<ProductKey, {
  label: string
  category: string
  promise: string
  description: string
  benefits: string[]
  surface: string
  iconSurface: string
  accent: string
  selected: string
}> = {
  hotelaccelerator: {
    label: "HotelAccelerator",
    category: "Vendite, CRM e comunicazioni",
    promise: "Trasforma ogni richiesta in una vendita meglio gestita.",
    description: "Unifica email, WhatsApp, telefono, CRM e attività commerciali per capire cosa chiedono gli ospiti, seguire il team e aumentare le conversioni.",
    benefits: ["Inbox multicanale", "CRM e follow-up", "Analisi delle conversazioni"],
    surface: "border-sky-200 bg-sky-50/70",
    iconSurface: "bg-sky-100 text-sky-800",
    accent: "text-sky-800",
    selected: "border-sky-500 ring-2 ring-sky-100",
  },
  santaddeo: {
    label: "Santaddeo",
    category: "Revenue Management",
    promise: "Decidi i prezzi con i dati, non a intuito.",
    description: "Analizza domanda, booking pace, mercato e performance della struttura per proteggere ADR, occupazione e ricavi durante tutto l'anno.",
    benefits: ["Motore prezzi", "Domanda e booking pace", "Revenue intelligence"],
    surface: "border-emerald-200 bg-emerald-50/70",
    iconSurface: "bg-emerald-100 text-emerald-800",
    accent: "text-emerald-800",
    selected: "border-emerald-500 ring-2 ring-emerald-100",
  },
  hotelprofitai: {
    label: "HotelProfitAI",
    category: "Controllo di gestione",
    promise: "Sai dove guadagni e dove stai perdendo margine.",
    description: "Riunisce costi, budget, fatture, KPI e profittabilità per trasformare i numeri dell'hotel in decisioni operative semplici e tempestive.",
    benefits: ["Costi e margini", "Budget e forecast", "Insight AI sui conti"],
    surface: "border-amber-200 bg-amber-50/70",
    iconSurface: "bg-amber-100 text-amber-900",
    accent: "text-amber-900",
    selected: "border-amber-500 ring-2 ring-amber-100",
  },
  manubot: {
    label: "ManuBot",
    category: "Operations e housekeeping",
    promise: "Meno caos operativo, attività tracciate e camere sotto controllo.",
    description: "Organizza manutenzioni, housekeeping e task del team anche da WhatsApp o Telegram, trasformando messaggi e vocali in attività assegnate e verificabili.",
    benefits: ["Manutenzioni", "Housekeeping", "Task via bot"],
    surface: "border-violet-200 bg-violet-50/70",
    iconSurface: "bg-violet-100 text-violet-900",
    accent: "text-violet-900",
    selected: "border-violet-500 ring-2 ring-violet-100",
  },
}

const PERIOD_LABELS: Record<string, string> = {
  monthly: "mese",
  quarterly: "trimestre",
  yearly: "anno",
  one_time: "una tantum",
}

function ProductIcon({ project, className = "h-6 w-6" }: { project: ProductKey; className?: string }) {
  if (project === "hotelaccelerator") return <Building2 className={className} />
  if (project === "santaddeo") return <TrendingUp className={className} />
  if (project === "hotelprofitai") return <CircleDollarSign className={className} />
  return <Wrench className={className} />
}

function PriceBlock({ item, currency }: { item: QuoteLineItem; currency: string }) {
  const meta = getCommercialMeta(item)
  const hasMonthly = item.billing_period === "monthly" || Number(meta.billing_options?.monthly?.unit_amount) > 0
  const primary = calculateQuoteLine(hasMonthly ? applyBillingPreference(item, "monthly") : item)
  const yearly = hasMonthly && hasAnnualBillingOption(item)
    ? calculateQuoteLine(applyBillingPreference(item, "yearly"))
    : null
  const discountLabel = ecosystemDiscountLabel(item)
  const list = Number(primary.list_amount || 0)
  const net = Number(primary.amount || 0)
  const period = PERIOD_LABELS[primary.billing_period || "one_time"] || primary.billing_period || "una tantum"

  return (
    <div className="rounded-2xl border bg-background p-4">
      {discountLabel ? <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">{discountLabel}</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {primary.billing_period === "one_time" ? "Prezzo" : "Formula mensile"}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            {list > net + 0.005 ? <span className="text-sm text-muted-foreground line-through">{formatQuoteAmount(list, currency)}</span> : null}
            <span className="text-2xl font-black">{formatQuoteAmount(net, currency)}</span>
            <span className="text-xs text-muted-foreground">{primary.billing_period === "one_time" ? "una tantum" : `/ ${period}`}</span>
          </div>
        </div>
        {yearly && yearly.billing_period === "yearly" ? (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Formula annuale</p>
            <p className="font-black text-emerald-950">{formatQuoteAmount(yearly.amount, currency)} / anno</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CompactFeatures({ item }: { item: QuoteLineItem }) {
  const features = item.features || []
  if (!features.length) return null
  const visible = features.slice(0, 3)
  const extra = features.slice(3)
  return (
    <div className="mt-4">
      <ul className="grid gap-2 sm:grid-cols-2">
        {visible.map((feature, index) => (
          <li key={`${feature}-${index}`} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {extra.length ? (
        <details className="mt-3 rounded-xl border bg-muted/15 p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Vedi altre {extra.length} funzionalità</summary>
          <ul className="mt-3 space-y-2">
            {extra.map((feature, index) => (
              <li key={`${feature}-${index}`} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

function ProductStatus({ included, availableModules }: { included: boolean; availableModules: number }) {
  if (included) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Già nel preventivo</span>
  }
  if (availableModules > 0) {
    return <span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold text-foreground shadow-sm ring-1 ring-border">Disponibile</span>
  }
  return <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">Su configurazione</span>
}

export default function EcosystemBrowser({
  token,
  offers,
  includedItems,
  currency,
  locked,
}: {
  token: string
  offers: QuoteLineItem[]
  includedItems: QuoteLineItem[]
  currency: string
  locked: boolean
}) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const busy = pendingId !== null

  const initialProject = useMemo(() => {
    const included = PRODUCT_ORDER.find(project => includedItems.some(item => item.project === project && (item.kind === "plan" || item.kind === "module")))
    if (included) return included
    return PRODUCT_ORDER.find(project => offers.some(item => item.project === project)) || PRODUCT_ORDER[0]
  }, [includedItems, offers])

  const [selectedProject, setSelectedProject] = useState<ProductKey>(initialProject)
  const includedIds = useMemo(() => new Set(includedItems.map(item => item.id).filter(Boolean)), [includedItems])

  const projectIncluded = includedItems.filter(item => item.project === selectedProject && (item.kind === "plan" || item.kind === "module"))
  const projectOffers = offers.filter(item => item.project === selectedProject && (item.kind === "plan" || item.kind === "module"))
  const includedPlan = projectIncluded.find(item => item.kind === "plan")
  const includedModules = projectIncluded.filter(item => item.kind === "module")
  const planOffers = projectOffers.filter(item => item.kind === "plan" && !includedIds.has(item.id))
  const moduleOffers = projectOffers.filter(item => item.kind === "module" && !includedIds.has(item.id))
  const selectedMeta = PRODUCT_META[selectedProject]

  async function toggle(item: QuoteLineItem, selected: boolean) {
    if (!item.id || locked || pendingRef.current) return
    pendingRef.current = true
    setPendingId(item.id)
    try {
      const discovered = item.id.startsWith("catalog:")
      const payload = discovered
        ? { catalog_item_id: item.source_product_id, project: item.project, selected: true }
        : { line_id: item.id, selected }
      const response = await fetch(`/api/quotes/shared/${token}/ecosystem`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || "Impossibile aggiornare il preventivo")
      toast.success(selected ? "Soluzione aggiunta al preventivo" : "Soluzione rimossa dal preventivo")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'aggiornamento")
    } finally {
      pendingRef.current = false
      setPendingId(null)
    }
  }

  function chooseProduct(project: ProductKey) {
    setSelectedProject(project)
    window.requestAnimationFrame(() => document.getElementById("product-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  function renderOffer(item: QuoteLineItem, typeLabel: string) {
    const discovered = Boolean(item.id?.startsWith("catalog:"))
    const selected = discovered ? false : isEcosystemOfferSelected(item, false)
    const currentBusy = pendingId === item.id
    const dependency = getCommercialMeta(item).dependency
    return (
      <article key={item.id} className={`rounded-2xl border-2 bg-card p-5 shadow-sm transition ${selected ? "border-emerald-400" : "border-border hover:border-foreground/20"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{typeLabel}</span>
              {selected ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Nel preventivo</span> : null}
            </div>
            <h3 className="mt-3 text-xl font-black">{item.name || item.description}</h3>
            {item.name && item.description && item.description !== item.name ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p> : null}
          </div>
        </div>

        <div className="mt-4"><PriceBlock item={item} currency={currency} /></div>
        <CompactFeatures item={item} />

        {dependency?.requires_base ? (
          <div className="mt-4 rounded-xl bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Richiede il piano base {PRODUCT_META[(dependency.project || selectedProject) as ProductKey]?.label || dependency.project || selectedMeta.label}. Se non è già presente, il sistema prova ad aggiungerlo insieme al modulo.
          </div>
        ) : null}

        <Button type="button" className="mt-5 w-full" variant={selected ? "outline" : "default"} disabled={locked || busy} onClick={() => toggle(item, !selected)}>
          {currentBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : selected ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {locked ? "Preventivo non più modificabile" : selected ? "Rimuovi dal preventivo" : "Aggiungi al preventivo"}
        </Button>
      </article>
    )
  }

  function renderIncluded(item: QuoteLineItem, typeLabel: string) {
    const removable = isEcosystemOffer(item) && item.optional
    const currentBusy = pendingId === item.id
    return (
      <article key={item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/45 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground ring-1 ring-border">{typeLabel}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Già incluso</span>
            </div>
            <h3 className="mt-3 text-lg font-black">{item.name || item.description}</h3>
            {item.name && item.description && item.description !== item.name ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
          </div>
        </div>
        {removable ? (
          <Button type="button" variant="outline" className="mt-4" disabled={locked || busy} onClick={() => toggle(item, false)}>
            {currentBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Rimuovi
          </Button>
        ) : null}
      </article>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Ecosistema 4BID</p>
            <p className="text-lg font-black sm:text-xl">Completa la tua soluzione</p>
          </div>
          <Button asChild variant="outline"><Link href={`/preventivo/${token}`}><ArrowLeft className="mr-2 h-4 w-4" />Torna al preventivo</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:py-12">
        <section className="overflow-hidden rounded-3xl border bg-background shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <Sparkles className="h-4 w-4" />
                Prima scegli il prodotto, poi i moduli
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Quattro prodotti diversi. Un solo ecosistema per far lavorare meglio il tuo hotel.</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Ogni prodotto risolve un problema preciso. Selezionalo per capire cosa fa; soltanto dopo vedrai il piano base e gli eventuali moduli acquistabili.
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Come funziona</p>
              <ol className="mt-3 space-y-3 text-sm">
                <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-black text-background">1</span><span><strong>Capisci il prodotto</strong><br /><span className="text-muted-foreground">Cosa risolve e perché può servirti.</span></span></li>
                <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-black text-background">2</span><span><strong>Scegli piano e moduli</strong><br /><span className="text-muted-foreground">Vedi solo le opzioni compatibili.</span></span></li>
                <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-black text-background">3</span><span><strong>Aggiungi al preventivo</strong><br /><span className="text-muted-foreground">Il totale si aggiorna automaticamente.</span></span></li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">1 · Scegli il prodotto</p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">Di cosa ha bisogno la tua struttura?</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PRODUCT_ORDER.map(project => {
              const meta = PRODUCT_META[project]
              const productIncluded = includedItems.some(item => item.project === project && (item.kind === "plan" || item.kind === "module"))
              const availableModules = offers.filter(item => item.project === project && item.kind === "module" && !includedIds.has(item.id)).length
              const availablePlans = offers.filter(item => item.project === project && item.kind === "plan" && !includedIds.has(item.id)).length
              const isSelected = project === selectedProject
              return (
                <button
                  key={project}
                  type="button"
                  onClick={() => chooseProduct(project)}
                  className={`group flex min-h-[270px] flex-col rounded-3xl border-2 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${meta.surface} ${isSelected ? meta.selected : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${meta.iconSurface}`}><ProductIcon project={project} /></span>
                    <ProductStatus included={productIncluded} availableModules={availableModules + availablePlans} />
                  </div>
                  <p className={`mt-5 text-xs font-bold uppercase tracking-[0.13em] ${meta.accent}`}>{meta.category}</p>
                  <h3 className="mt-1 text-2xl font-black">{meta.label}</h3>
                  <p className="mt-2 text-sm font-semibold leading-snug">{meta.promise}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{meta.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-5 text-sm font-bold">
                    <span>{availableModules > 0 ? `${availableModules} moduli disponibili` : productIncluded ? "Vedi cosa è incluso" : "Scopri il prodotto"}</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section id="product-detail" className="scroll-mt-24 space-y-7">
          <div className={`overflow-hidden rounded-3xl border-2 ${selectedMeta.surface}`}>
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:items-start">
              <div>
                <div className="flex items-start gap-4">
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${selectedMeta.iconSurface}`}><ProductIcon project={selectedProject} className="h-7 w-7" /></span>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${selectedMeta.accent}`}>{selectedMeta.category}</p>
                    <h2 className="mt-1 text-3xl font-black">{selectedMeta.label}</h2>
                    <p className="mt-2 text-lg font-bold">{selectedMeta.promise}</p>
                  </div>
                </div>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">{selectedMeta.description}</p>
              </div>
              <div className="rounded-2xl bg-background/80 p-5 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">In pratica ti aiuta a</p>
                <ul className="mt-3 space-y-3">
                  {selectedMeta.benefits.map(benefit => <li key={benefit} className="flex items-start gap-2 text-sm font-semibold"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{benefit}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">2 · Il prodotto</p>
                <h3 className="mt-1 text-2xl font-black">Piano base {selectedMeta.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Il piano base attiva il prodotto. I moduli vengono scelti separatamente sotto.</p>
              </div>
            </div>

            {includedPlan ? (
              <div>{renderIncluded(includedPlan, "Piano base")}</div>
            ) : planOffers.length ? (
              <div className="grid gap-4 lg:grid-cols-2">{planOffers.map(item => renderOffer(item, "Piano base"))}</div>
            ) : (
              <div className="rounded-2xl border bg-card p-6">
                <p className="font-bold">Piano base su configurazione</p>
                <p className="mt-1 text-sm text-muted-foreground">Per questo prodotto non c'è al momento un piano base acquistabile direttamente online. I moduli che richiedono una configurazione commerciale vengono comunque bloccati prima dell'aggiunta.</p>
              </div>
            )}
          </div>

          {includedModules.length ? (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Già scelti</p>
                <h3 className="mt-1 text-xl font-black">Moduli già nel tuo preventivo</h3>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">{includedModules.map(item => renderIncluded(item, "Modulo"))}</div>
            </div>
          ) : null}

          <div>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">3 · Personalizza</p>
              <h3 className="mt-1 text-2xl font-black">Moduli acquistabili</h3>
              <p className="mt-1 text-sm text-muted-foreground">Aggiungi soltanto le funzioni che ti servono. Ogni modulo mostra prezzo, dipendenze e funzionalità principali.</p>
            </div>

            {moduleOffers.length ? (
              <div className="grid gap-4 lg:grid-cols-2">{moduleOffers.map(item => renderOffer(item, "Modulo aggiuntivo"))}</div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-card p-7 text-center">
                <p className="font-bold">Nessun altro modulo acquistabile online per {selectedMeta.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">Hai già selezionato quelli disponibili oppure gli altri richiedono una configurazione commerciale dedicata.</p>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border bg-background p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black">Hai finito di personalizzare?</p>
            <p className="mt-1 text-sm text-muted-foreground">Torna al preventivo per vedere il totale aggiornato e completare la scelta della formula mensile o annuale.</p>
          </div>
          <Button asChild size="lg"><Link href={`/preventivo/${token}`}>Torna al preventivo<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
      </main>
    </div>
  )
}
