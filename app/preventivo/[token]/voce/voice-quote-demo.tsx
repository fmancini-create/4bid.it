"use client"

import Image from "next/image"
import { ArrowLeft, Check, Mic2, Sparkles, Volume2 } from "lucide-react"
import QuoteNarration from "../quote-narration"
import { ProjectBrand } from "@/components/quotes/project-brand"
import { quoteBenefits } from "@/lib/quotes/branding"
import { calculateQuoteLine, formatQuoteAmount, type QuoteLineItem } from "@/lib/quotes/types"

type Props = {
  token: string
  quoteNumber: string | null
  title: string
  description: string | null
  clientName: string | null
  clientCompany: string | null
  lineItems: QuoteLineItem[]
}

const periodLabel: Record<string, string> = {
  one_time: "una tantum",
  monthly: "/mese",
  quarterly: "/trimestre",
  yearly: "/anno",
}

export default function VoiceQuoteDemo({ token, quoteNumber, title, description, clientName, clientCompany, lineItems }: Props) {
  const recipient = clientName || clientCompany || "Cliente"
  const visibleItems = lineItems.filter((item) => item.name || item.description)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Image src="/logo.png" alt="4BID" width={110} height={44} className="h-10 w-auto object-contain brightness-0 invert" priority />
          <a href={`/preventivo/${token}`} className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Torna al preventivo
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                <Mic2 className="h-3.5 w-3.5" /> Proposta raccontata dall'AI
              </div>
              <p className="text-sm text-white/60">{quoteNumber ? `Preventivo ${quoteNumber}` : "Proposta commerciale 4BID"}</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
              {description ? <p className="mt-5 max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-white/70">{description}</p> : null}
              <p className="mt-6 text-sm text-white/60">Preparato per <strong className="text-white">{[clientName, clientCompany].filter(Boolean).join(" · ") || recipient}</strong></p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-black/20 p-5 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-300/20"><Sparkles className="h-5 w-5 text-blue-200" /></span>
                <div>
                  <p className="font-bold">Ciao {clientName || ""}</p>
                  <p className="text-sm text-white/60">Ti racconto perché abbiamo costruito questa soluzione per te.</p>
                </div>
              </div>
              <div className="[&_button]:w-full [&_button]:justify-center [&>div]:border-white/10 [&>div]:bg-white/[0.04] [&>div]:text-white [&_p]:text-white/60">
                <QuoteNarration token={token} label="Ascolta il tuo preventivo" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Esplora la proposta</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Ogni modulo può spiegarsi da solo</h2>
            </div>
            <p className="max-w-xl text-sm text-white/55">Il testo non è preregistrato: viene generato sul modulo realmente presente nel preventivo, con funzionalità, condizioni e vantaggi della proposta.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {visibleItems.map((item, index) => {
              const calc = calculateQuoteLine(item)
              const benefits = quoteBenefits(item, 3)
              return (
                <article key={item.id || `${item.name}-${index}`} className="group rounded-3xl border border-white/10 bg-white/[0.055] p-6 transition hover:border-white/20 hover:bg-white/[0.075]">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <ProjectBrand project={item.project} compact />
                      <h3 className="mt-3 text-xl font-black leading-tight">{item.name || item.description}</h3>
                      {item.name && item.description && item.name !== item.description ? <p className="mt-2 text-sm leading-relaxed text-white/60">{item.description}</p> : null}
                    </div>
                    <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:text-right">
                      <p className="text-xl font-black">{formatQuoteAmount(calc.amount, "eur")}</p>
                      <p className="text-xs text-white/45">{periodLabel[calc.billing_period || "one_time"] || calc.billing_period}</p>
                    </div>
                  </div>

                  {benefits.length ? (
                    <div className="mt-5 space-y-2">
                      {benefits.map((benefit, benefitIndex) => <div key={`${benefit}-${benefitIndex}`} className="flex items-start gap-2 text-sm text-white/75"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10"><Check className="h-3.5 w-3.5 text-emerald-300" /></span><span>{benefit}</span></div>)}
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <div className="flex items-center gap-2 text-xs text-white/45"><Volume2 className="h-4 w-4" /> 25–35 secondi</div>
                    {item.id ? <div className="[&_button]:border-white/15 [&_button]:bg-white/10 [&_button]:text-white [&_button:hover]:bg-white/15"><QuoteNarration token={token} lineId={item.id} compact label="Spiegami cos'è" /></div> : <span className="text-xs text-white/35">Audio non disponibile</span>}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-300/15 bg-blue-400/[0.06] p-6 text-center sm:p-8">
          <p className="text-lg font-bold">Questa è una prova separata dalla pagina ufficiale.</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/60">Se il risultato ti convince, gli stessi controlli vocali vengono inseriti direttamente nel preventivo pubblico: racconto generale in alto e pulsante “Spiegami cos'è” su ogni modulo.</p>
        </section>
      </main>
    </div>
  )
}
