"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  Check,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { KIND_LABEL, KIND_STYLE, PROBLEMS, SOLUTIONS } from "@/lib/problem-solutions"

/**
 * Selettore "qual è il tuo problema?" per la Suite turismo.
 * L'albergatore seleziona uno o più problemi reali e la pagina propone
 * le soluzioni 4BID pertinenti (piattaforme, consulenza, progetti su misura),
 * ordinate per numero di problemi risolti. Nessun form: solo rimandi alle
 * pagine soluzione, alla demo e al preventivo su misura.
 *
 * I dati stanno in lib/problem-solutions.ts perché li usa anche la pagina
 * dedicata /problemi-hotel-soluzioni, che ne rende una versione statica
 * leggibile dai motori di ricerca.
 */

type Props = {
  /**
   * Livello del titolo interno: "h4" in home (dove esiste già un h2/h3 di
   * sezione), "h2" sulla pagina dedicata dove il blocco è la sezione
   * principale sotto l'h1. Serve a non rompere la gerarchia dei titoli (SEO).
   */
  titleAs?: "h2" | "h4"
  /** Link "vedi tutto": mostrato in home per portare alla pagina dedicata. */
  moreHref?: string
  moreLabel?: string
  className?: string
}

export default function ProblemSolutionFinder({
  titleAs = "h4",
  moreHref,
  moreLabel = "Vedi tutti i problemi e le soluzioni",
  className = "",
}: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const resultsRef = useRef<HTMLDivElement>(null)
  const Title = titleAs
  const ResultsTitle = titleAs === "h2" ? "h3" : "h5"
  const CardTitle = titleAs === "h2" ? "h4" : "h6"

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  /**
   * Punteggio = numero di problemi selezionati che quella soluzione risolve.
   * L'ordine dei pareggi segue l'ordine di SOLUTIONS (piattaforme prima),
   * così il risultato è stabile e non cambia a ogni click.
   */
  const matches = useMemo(() => {
    if (selected.length === 0) return []
    const chosen = PROBLEMS.filter((p) => selected.includes(p.id))

    return SOLUTIONS.map((solution) => {
      const reasons = chosen.filter((p) => p.solutions.includes(solution.id))
      return { solution, reasons }
    })
      .filter((m) => m.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length)
  }, [selected])

  const showResults = selected.length > 0

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-lg sm:rounded-3xl sm:p-6 md:p-10 ${className}`}
    >
      <div className="mb-6 max-w-3xl md:mb-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F4B942]/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#946A00]">
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
          Trova la tua soluzione
        </span>
        <Title className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl text-balance">
          Qual è il problema della tua struttura?
        </Title>
        <p className="leading-relaxed text-gray-600 sm:text-lg text-pretty">
          Seleziona uno o più problemi che riconosci: ti mostriamo subito quali piattaforme, consulenze o progetti su
          misura di 4BID li risolvono.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Seleziona i problemi della tua struttura</legend>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PROBLEMS.map((problem) => {
            const isOn = selected.includes(problem.id)
            return (
              <li key={problem.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    isOn
                      ? "border-[#5B9BD5] bg-[#5B9BD5]/5"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggle(problem.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border ${
                      isOn ? "border-[#5B9BD5] bg-[#5B9BD5] text-white" : "border-gray-300 bg-white"
                    }`}
                  >
                    {isOn && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`text-sm leading-relaxed ${isOn ? "text-gray-900" : "text-gray-700"}`}>
                    {problem.label}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <p className="text-sm text-gray-500" aria-live="polite">
          {selected.length === 0
            ? "Nessun problema selezionato"
            : `${selected.length} ${selected.length === 1 ? "problema selezionato" : "problemi selezionati"}`}
        </p>
        {selected.length > 0 && (
          <>
            {/* Su mobile i risultati finiscono sotto 18 voci: senza questo
                salto l'utente non vede che qualcosa è comparso. */}
            <button
              type="button"
              onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5B9BD5]/10 px-3 py-2 text-sm font-semibold text-[#3A7AB2] hover:bg-[#5B9BD5]/20 lg:hidden"
            >
              Vai alle soluzioni
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Azzera selezione
            </button>
          </>
        )}
        {moreHref && (
          <Link
            href={moreHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3A7AB2] underline-offset-4 hover:underline"
          >
            {moreLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* scroll-mt-24: senza margine di scorrimento l'header fisso copre il
          titolo dei risultati quando si usa "Vai alle soluzioni" (visto in
          browser a 390px). */}
      <div ref={resultsRef} aria-live="polite" className="scroll-mt-24">
        {showResults && (
          <div className="mt-8 border-t border-gray-200 pt-8 md:mt-10 md:pt-10">
            <div className="mb-6 flex items-start gap-3 md:mb-8">
              <span className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#5B9BD5] to-[#3A7AB2]">
                <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <div>
                <ResultsTitle className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">
                  {matches.length === 1
                    ? "La soluzione 4BID per te"
                    : `${matches.length} soluzioni 4BID per il tuo caso`}
                </ResultsTitle>
                <p className="mt-1 text-gray-600 text-pretty">
                  In ordine di impatto sui problemi che hai indicato.
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {matches.map(({ solution, reasons }) => (
                <li
                  key={solution.id}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50/60 p-5 sm:p-6"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${KIND_STYLE[solution.kind]}`}
                    >
                      {KIND_LABEL[solution.kind]}
                    </span>
                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-700">
                      {reasons.length === 1 ? "1 problema risolto" : `${reasons.length} problemi risolti`}
                    </span>
                  </div>

                  <CardTitle className="mb-2 text-lg font-bold text-gray-900">{solution.name}</CardTitle>
                  <p className="mb-4 leading-relaxed text-gray-600 text-pretty">{solution.claim}</p>

                  <ul className="mb-6 flex flex-col gap-2">
                    {reasons.map((reason) => (
                      <li key={reason.id} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-[#5B9BD5]" aria-hidden="true" />
                        <span>Risponde a: {reason.short}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" className="flex-1 justify-between bg-white">
                      <Link href={solution.href}>
                        <span>Scopri di più</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {solution.externalUrl && (
                      <Button
                        asChild
                        className="flex-1 justify-between bg-gradient-to-r from-[#5B9BD5] to-[#3A7AB2] text-white hover:opacity-90"
                      >
                        <a
                          href={solution.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visita il sito di ${solution.name} (si apre in una nuova scheda)`}
                        >
                          <span>Visita il sito</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-stretch gap-4 rounded-2xl bg-gray-900 p-5 sm:items-center sm:p-6 md:mt-10 md:flex-row md:justify-between">
              <p className="text-gray-200 text-pretty">
                Vuoi vedere come funzionano sui numeri della tua struttura? Prenota una demo o chiedi un progetto su
                misura.
              </p>
              <div className="flex flex-none flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-[#F4B942] text-gray-900 hover:bg-[#e0a72f]">
                  <Link href="/prenota-demo">Prenota una demo</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white"
                >
                  <Link href="/preventivi-progetti-personalizzati-hotel">Chiedi un preventivo</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
