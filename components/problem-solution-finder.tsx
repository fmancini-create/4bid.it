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

/**
 * Selettore "qual è il tuo problema?" per la Suite turismo.
 * L'albergatore seleziona uno o più problemi reali e la pagina propone
 * le soluzioni 4BID pertinenti (piattaforme, consulenza, progetti su misura),
 * ordinate per numero di problemi risolti. Nessun form: solo rimandi alle
 * pagine soluzione, alla demo e al preventivo su misura.
 */

type SolutionKind = "piattaforma" | "consulenza" | "su-misura"

type Solution = {
  id: string
  name: string
  kind: SolutionKind
  claim: string
  href: string
  externalUrl?: string
}

type Problem = {
  id: string
  label: string
  /** Motivo mostrato nella soluzione: "perché hai indicato ..." */
  short: string
  solutions: string[]
}

const KIND_LABEL: Record<SolutionKind, string> = {
  piattaforma: "Piattaforma",
  consulenza: "Consulenza",
  "su-misura": "Su misura",
}

const KIND_STYLE: Record<SolutionKind, string> = {
  piattaforma: "bg-[#5B9BD5]/10 text-[#3A7AB2]",
  consulenza: "bg-[#F4B942]/15 text-[#946A00]",
  "su-misura": "bg-emerald-100 text-emerald-700",
}

const SOLUTIONS: Solution[] = [
  {
    id: "santaddeo",
    name: "SANTADDEO",
    kind: "piattaforma",
    claim:
      "Revenue management intelligente che decide i prezzi giorno per giorno e ti spiega sempre il perché.",
    href: "/progetti/santaddeo",
    externalUrl: "https://santaddeo.com",
  },
  {
    id: "hotelprofit-ai",
    name: "HOTELPROFIT AI",
    kind: "piattaforma",
    claim:
      "Controllo di gestione, costi, margini e cassa in tempo reale, con commercialisti specializzati a supporto.",
    href: "/progetti/hotelprofit-ai",
    externalUrl: "https://hotelprofitai.com",
  },
  {
    id: "hotel-accelerator",
    name: "HOTEL ACCELERATOR",
    kind: "piattaforma",
    claim:
      "Sito, CRM, email marketing e inbox omnicanale in un unico gestionale per far crescere le prenotazioni dirette.",
    href: "/progetti/hotel-accelerator",
  },
  {
    id: "manubot",
    name: "MANUBOT",
    kind: "piattaforma",
    claim:
      "Manutenzioni, guasti e comunicazioni allo staff via WhatsApp e Telegram: nulla si perde più a voce.",
    href: "/progetti/manubot",
    externalUrl: "https://www.manubot.it",
  },
  {
    id: "ecomobility",
    name: "4BID ECOMOBILITY",
    kind: "piattaforma",
    claim:
      "Noleggio di e-bike, scooter e monopattini in struttura: un servizio in più per gli ospiti e un ricavo extra per te.",
    href: "/ecomobility/noleggio-mobilita-elettrica-hotel",
  },
  {
    id: "consulenza-revenue",
    name: "Consulenza di revenue management",
    kind: "consulenza",
    claim:
      "Un revenue manager al tuo fianco per strategia tariffaria, distribuzione e obiettivi di fatturato.",
    href: "/consulenza-revenue-management-hotel",
  },
  {
    id: "distribuzione",
    name: "Ottimizzazione OTA e canali",
    kind: "consulenza",
    claim:
      "Riequilibriamo il mix distributivo per ridurre commissioni e dipendenza dai portali.",
    href: "/ottimizzazione-ota-hotel",
  },
  {
    id: "dirette",
    name: "Strategie di vendita diretta",
    kind: "consulenza",
    claim:
      "Booking engine, offerte e percorsi di prenotazione pensati per vendere dal tuo sito.",
    href: "/strategie-prenotazioni-dirette-hotel",
  },
  {
    id: "webmarketing",
    name: "Web marketing per hotel",
    kind: "consulenza",
    claim:
      "Immagine online, contenuti e campagne per farti trovare e scegliere prima dei concorrenti.",
    href: "/webmarketing-hotel-prenotazioni",
  },
  {
    id: "forecast",
    name: "Forecast e budgeting",
    kind: "consulenza",
    claim:
      "Costruiamo budget e previsioni affidabili per pianificare stagioni, prezzi e investimenti.",
    href: "/forecast-budgeting-hotel",
  },
  {
    id: "formazione",
    name: "Formazione del tuo team",
    kind: "consulenza",
    claim:
      "Percorsi pratici di revenue management per rendere autonomo il personale della struttura.",
    href: "/formazione-revenue-management-hotel",
  },
  {
    id: "consulenza-personalizzata",
    name: "Consulenza personalizzata",
    kind: "consulenza",
    claim:
      "Analizziamo la tua struttura e mettiamo in fila le priorità, anche su temi organizzativi e di personale.",
    href: "/consulenza-personalizzata-hotel",
  },
  {
    id: "catene",
    name: "Gestione multi-struttura",
    kind: "consulenza",
    claim:
      "Metodo e strumenti per governare più strutture o un gruppo con dati confrontabili.",
    href: "/revenue-management-catene-hotel",
  },
  {
    id: "su-misura",
    name: "Progetto su misura",
    kind: "su-misura",
    claim:
      "Quando i software standard non bastano, sviluppiamo la soluzione che ti serve e la integriamo con i tuoi sistemi.",
    href: "/preventivi-progetti-personalizzati-hotel",
  },
]

const PROBLEMS: Problem[] = [
  {
    id: "prezzi",
    label: "Non so a che prezzo vendere le camere: decido a intuito",
    short: "prezzi decisi a intuito",
    solutions: ["santaddeo", "consulenza-revenue"],
  },
  {
    id: "ota",
    label: "Dipendo troppo dalle OTA e pago troppe commissioni",
    short: "troppa dipendenza dalle OTA",
    solutions: ["distribuzione", "hotel-accelerator", "consulenza-revenue"],
  },
  {
    id: "dirette",
    label: "Ricevo poche prenotazioni dirette dal mio sito",
    short: "poche prenotazioni dirette",
    solutions: ["hotel-accelerator", "dirette", "webmarketing"],
  },
  {
    id: "margini",
    label: "Fatturo ma non so quanto guadagno davvero: costi e margini poco chiari",
    short: "margini non chiari",
    solutions: ["hotelprofit-ai", "consulenza-personalizzata"],
  },
  {
    id: "cassa",
    label: "Non ho visibilità su cassa, scadenze e pagamenti futuri",
    short: "cassa e scadenze senza visibilità",
    solutions: ["hotelprofit-ai", "forecast"],
  },
  {
    id: "kpi",
    label: "Non riesco a leggere i miei KPI (RevPAR, ADR, occupazione)",
    short: "KPI non misurati",
    solutions: ["santaddeo", "hotelprofit-ai", "consulenza-revenue"],
  },
  {
    id: "budget",
    label: "Non riesco a pianificare l'anno: budget e previsioni sempre approssimativi",
    short: "budget approssimativo",
    solutions: ["forecast", "hotelprofit-ai"],
  },
  {
    id: "manutenzioni",
    label: "Guasti e manutenzioni segnalati a voce: richieste che si perdono",
    short: "manutenzioni gestite a voce",
    solutions: ["manubot"],
  },
  {
    id: "staff-comunicazione",
    label: "La comunicazione con lo staff è caotica: nessuno sa chi fa cosa",
    short: "comunicazione con lo staff caotica",
    solutions: ["manubot", "hotel-accelerator"],
  },
  {
    id: "richieste-ospiti",
    label: "Richieste degli ospiti sparse tra mail, WhatsApp e telefono",
    short: "richieste ospiti sparse su troppi canali",
    solutions: ["hotel-accelerator", "manubot"],
  },
  {
    id: "reputazione",
    label: "Recensioni e reputazione online da migliorare",
    short: "reputazione online da migliorare",
    solutions: ["hotel-accelerator", "webmarketing"],
  },
  {
    id: "immagine",
    label: "Sito e immagine online datati rispetto ai concorrenti",
    short: "immagine online datata",
    solutions: ["webmarketing", "hotel-accelerator"],
  },
  {
    id: "formazione",
    label: "Il mio team non è autonomo: servirebbe formazione",
    short: "team non autonomo",
    solutions: ["formazione", "consulenza-revenue"],
  },
  {
    id: "personale",
    label: "Faccio fatica a trovare e trattenere personale qualificato",
    short: "difficoltà a trovare personale",
    solutions: ["consulenza-personalizzata"],
  },
  {
    id: "extra",
    label: "Vorrei offrire servizi extra agli ospiti e creare nuovi ricavi",
    short: "nuovi ricavi dai servizi extra",
    solutions: ["ecomobility", "consulenza-personalizzata"],
  },
  {
    id: "multi",
    label: "Gestisco più strutture e non riesco a confrontare i dati",
    short: "più strutture da confrontare",
    solutions: ["catene", "hotelprofit-ai", "santaddeo"],
  },
  {
    id: "strumenti",
    label: "Uso troppi strumenti scollegati e ricopio i dati a mano",
    short: "strumenti scollegati",
    solutions: ["hotel-accelerator", "su-misura"],
  },
  {
    id: "software-standard",
    label: "I software standard non coprono il mio caso: mi serve qualcosa di mio",
    short: "serve una soluzione dedicata",
    solutions: ["su-misura", "consulenza-personalizzata"],
  },
]

export default function ProblemSolutionFinder() {
  const [selected, setSelected] = useState<string[]>([])
  const resultsRef = useRef<HTMLDivElement>(null)

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
    <div className="mb-16 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-10">
      <div className="mb-8 max-w-3xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F4B942]/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#946A00]">
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
          Trova la tua soluzione
        </span>
        <h4 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl text-balance">
          Qual è il problema della tua struttura?
        </h4>
        <p className="text-lg leading-relaxed text-gray-600 text-pretty">
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
          <button
            type="button"
            onClick={() => setSelected([])}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Azzera selezione
          </button>
        )}
      </div>

      <div ref={resultsRef} aria-live="polite">
        {showResults && (
          <div className="mt-10 border-t border-gray-200 pt-10">
            <div className="mb-8 flex items-start gap-3">
              <span className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#5B9BD5] to-[#3A7AB2]">
                <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <div>
                <h5 className="text-xl font-bold text-gray-900 md:text-2xl">
                  {matches.length === 1
                    ? "La soluzione 4BID per te"
                    : `${matches.length} soluzioni 4BID per il tuo caso`}
                </h5>
                <p className="mt-1 text-gray-600 text-pretty">
                  In ordine di impatto sui problemi che hai indicato.
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {matches.map(({ solution, reasons }) => (
                <li
                  key={solution.id}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50/60 p-6"
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

                  <h6 className="mb-2 text-lg font-bold text-gray-900">{solution.name}</h6>
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

            <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-gray-900 p-6 sm:flex-row sm:items-center sm:justify-between">
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
