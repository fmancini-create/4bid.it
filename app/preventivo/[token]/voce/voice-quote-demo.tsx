"use client"

import Image from "next/image"
import { ArrowLeft, Check, FileText, Mic2, Volume2 } from "lucide-react"
import QuoteNarration from "../quote-narration"
import { ProjectBrand } from "@/components/quotes/project-brand"
import { quoteBenefits, quoteBrand } from "@/lib/quotes/branding"
import { calculateQuoteLine, formatQuoteAmount, type QuoteLineItem } from "@/lib/quotes/types"

type Props = {
  token: string
  quoteNumber: string | null
  title: string
  description: string | null
  clientName: string | null
  clientCompany: string | null
  currency: string
  lineItems: QuoteLineItem[]
}

const periodLabel: Record<string, string> = {
  one_time: "una tantum",
  monthly: "/mese",
  quarterly: "/trimestre",
  yearly: "/anno",
}

export default function VoiceQuoteDemo({ token, quoteNumber, title, description, clientName, clientCompany, currency, lineItems }: Props) {
  const visibleItems = lineItems.filter((item) => item.name || item.description)
  const client = clientCompany || clientName || "Cliente"

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Image src="/logo.png" alt="4BID" width={110} height={44} className="h-10 w-auto object-contain" priority />
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">Proposta commerciale</p>
              {quoteNumber ? <p className="text-xs text-muted-foreground">N. {quoteNumber}</p> : null}
            </div>
            <a href={`/preventivo/${token}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Preventivo originale
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="bg-primary px-6 py-7 text-primary-foreground">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium opacity-90">
              <FileText className="h-4 w-4" /> 4BID · Soluzioni digitali e consulenza
            </div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {description ? <p className="mt-3 whitespace-pre-wrap text-sm opacity-90">{description}</p> : null}
          </div>
          <div className="px-6 py-5">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Cliente</p>
              <p className="mt-1 text-lg font-semibold">{client}</p>
              {clientName && clientCompany ? <p className="mt-1 text-sm text-muted-foreground">Referente: {clientName}</p> : null}
            </div>
          </div>
        </section>

        <QuoteNarration token={token} label="Ascolta il tuo preventivo" />

        <section className="rounded-2xl border bg-card p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Mic2 className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="text-xl font-bold">I moduli della tua proposta</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ogni voce può spiegarsi con una breve presentazione vocale costruita sui dati reali del preventivo.</p>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {visibleItems.map((item, index) => {
            const calc = calculateQuoteLine(item)
            const benefits = quoteBenefits(item, 3)
            const brand = quoteBrand(item.project)
            const active = item.optional ? item.customer_selected !== false && item.default_selected !== false : true

            return (
              <article key={item.id || `${item.name}-${index}`} className={`group overflow-hidden rounded-2xl border bg-background transition-all ${active ? "border-primary/35 shadow-sm" : "border-border opacity-70"}`}>
                <div className="border-b bg-gradient-to-r from-muted/60 via-background to-background px-5 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.optional ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {item.optional ? "Puoi scegliere" : "Incluso nella soluzione"}
                    </span>
                    {item.trial_days ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Provalo {item.trial_days} giorni</span> : null}
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">{brand.promise}</p>
                      <div className="flex items-center gap-3">
                        <ProjectBrand project={item.project} compact />
                        <h3 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{item.name || item.description}</h3>
                      </div>
                      {item.name && item.description && item.name !== item.description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{item.description}</p> : null}
                    </div>
                    <div className="shrink-0 rounded-xl border bg-muted/20 px-4 py-3 text-left sm:min-w-[10rem] sm:text-right">
                      <p className="text-2xl font-black">{formatQuoteAmount(calc.amount, currency)}</p>
                      <p className="text-xs text-muted-foreground">{periodLabel[calc.billing_period || "one_time"] || calc.billing_period}</p>
                    </div>
                  </div>

                  {benefits.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {benefits.map((benefit, benefitIndex) => (
                        <div key={`${benefit}-${benefitIndex}`} className="flex items-start gap-2 rounded-xl bg-muted/35 px-3 py-2.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Volume2 className="h-4 w-4" /> Spiegazione breve del modulo</div>
                    {item.id ? <QuoteNarration token={token} lineId={item.id} compact label="Spiegami cos'è" /> : null}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-muted-foreground">
          Questa è ancora una preview separata: la grafica ora segue lo stesso linguaggio visivo del preventivo pubblico. Dopo il test definitivo, i controlli vocali possono essere inseriti direttamente nella pagina ufficiale.
        </section>
      </main>
    </div>
  )
}
