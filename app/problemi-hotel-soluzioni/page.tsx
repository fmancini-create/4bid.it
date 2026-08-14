import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { RelatedSolutions } from "@/components/related-solutions"
import ProblemSolutionFinder from "@/components/problem-solution-finder"
import {
  KIND_LABEL,
  KIND_STYLE,
  PROBLEMS,
  SOLUTIONS,
  getProblemsForSolution,
  getSolutionsForProblem,
} from "@/lib/problem-solutions"

const PAGE_URL = "https://www.4bid.it/problemi-hotel-soluzioni"
const TITLE = "Problemi dell'Hotel e Soluzioni: Trova la Tua in 1 Minuto | 4BID.IT"
const DESCRIPTION =
  "18 problemi ricorrenti di hotel, B&B e agriturismi e la soluzione 4BID per ciascuno: software, consulenza o progetto su misura. Scegli i tuoi e vedi cosa fare."

// Il canonical va SEMPRE dichiarato nella singola pagina: se lo si lascia
// ereditare dal layout, la pagina dichiara la home come versione ufficiale e
// si autoesclude dai risultati di ricerca.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords:
    "problemi hotel soluzioni, problemi gestione hotel, software gestione hotel, come aumentare prenotazioni dirette, ridurre commissioni OTA, controllo di gestione hotel, manutenzioni hotel, consulenza hotel",
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://www.4bid.it/4bid-colorful-logo.jpg",
        width: 1200,
        height: 630,
        alt: "4BID.IT - Problemi dell'hotel e soluzioni",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["https://www.4bid.it/4bid-colorful-logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

/**
 * Pagina dedicata "problema -> soluzione".
 * Il selettore interattivo è un componente client: da solo non darebbe nulla
 * da leggere ai motori di ricerca. Per questo la pagina rende anche, lato
 * server, l'elenco completo dei 18 problemi con le soluzioni collegate e le
 * FAQ: contenuto testuale reale + link interni verso tutte le pagine
 * soluzione, che è ciò che conta per l'indicizzazione.
 */
/**
 * FAQ scritte a mano: le etichette dei problemi sono affermazioni in prima
 * persona ("Non so a che prezzo vendere..."), non domande. Trasformarle con
 * una regex produrrebbe frasi sgrammaticate nei risultati di ricerca.
 * La risposta cita i nomi reali delle soluzioni collegate nella mappa dati.
 */
const FAQS = [
  {
    question: "Come faccio a capire a che prezzo vendere le camere?",
    answer:
      "Serve un sistema che legga domanda, storico e concorrenza al posto tuo. SANTADDEO calcola il prezzo consigliato giorno per giorno spiegando il motivo di ogni proposta; con la consulenza di revenue management di 4BID definiamo prima la strategia tariffaria e gli obiettivi.",
  },
  {
    question: "Come posso ridurre le commissioni pagate alle OTA?",
    answer:
      "Riequilibrando il mix distributivo e spostando volume sul canale diretto. Con l'ottimizzazione OTA lavoriamo su canali, tariffe e restrizioni, mentre HOTEL ACCELERATOR ti dà sito, CRM ed email marketing per far crescere le prenotazioni dirette.",
  },
  {
    question: "Perché ricevo poche prenotazioni dirette dal mio sito?",
    answer:
      "Di solito il percorso di prenotazione è lungo, il sito non è convincente o non c'è nessuna attività di marketing sul canale diretto. HOTEL ACCELERATOR, le strategie di vendita diretta e il web marketing per hotel agiscono su questi tre fronti.",
  },
  {
    question: "Come faccio a sapere quanto guadagno davvero, non solo quanto fatturo?",
    answer:
      "Con un controllo di gestione che separi costi, ricavi e margini per reparto. HOTELPROFIT AI mostra costi, margini e cassa in tempo reale con il supporto di commercialisti specializzati nel settore ricettivo.",
  },
  {
    question: "Come tengo sotto controllo cassa e scadenze future?",
    answer:
      "Servono scadenziario e previsioni collegati ai dati reali: HOTELPROFIT AI tiene insieme incassi, pagamenti e scadenze, mentre il servizio di forecast e budgeting costruisce le previsioni di periodo.",
  },
  {
    question: "Quali KPI deve misurare un hotel?",
    answer:
      "I principali sono RevPAR, ADR e occupazione, letti insieme e non separatamente. SANTADDEO e HOTELPROFIT AI li calcolano automaticamente; nella consulenza di revenue management ti insegniamo a interpretarli per decidere.",
  },
  {
    question: "Come evito che le richieste di manutenzione si perdano?",
    answer:
      "Smettendo di gestirle a voce. MANUBOT raccoglie guasti e manutenzioni via WhatsApp e Telegram, assegna la richiesta alla persona giusta e tiene traccia di chi ha ricevuto, letto e chiuso l'intervento.",
  },
  {
    question: "Cosa posso fare se i software standard non coprono il mio caso?",
    answer:
      "Sviluppiamo la soluzione su misura e la integriamo con i sistemi che già usi: dal preventivo per progetti personalizzati partiamo dall'analisi del tuo processo reale prima di scrivere codice.",
  },
]

export default function ProblemiHotelSoluzioniPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="WebPage"
        title="Problemi dell'hotel e soluzioni 4BID"
        description={DESCRIPTION}
        url={PAGE_URL}
        keywords={["problemi hotel", "soluzioni hotel", "software hotel", "consulenza hotel"]}
        faqs={FAQS}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Problemi e soluzioni", url: PAGE_URL },
        ]}
        speakable={["h1", "#problemi-elenco h3"]}
      />

      <Header />

      {/* Hero: pt-28 su mobile perché l'header fisso è più basso che su desktop */}
      <section className="bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <nav aria-label="Percorso" className="mb-6 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-foreground">
                Problemi e soluzioni
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <h1 className="mb-5 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl text-balance">
              Qual è il problema della tua struttura? Ecco la soluzione
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
              Prezzi decisi a intuito, troppe commissioni alle OTA, margini poco chiari, manutenzioni che si perdono a
              voce. Seleziona i problemi che riconosci nella tua struttura: ti mostriamo quale piattaforma, consulenza o
              progetto su misura di 4BID li risolve.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                <a href="#selettore">Scegli i tuoi problemi</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/prenota-demo">Prenota una demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Selettore interattivo */}
      <section id="selettore" className="scroll-mt-24 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <ProblemSolutionFinder titleAs="h2" />
        </div>
      </section>

      {/* Elenco statico: il contenuto che i motori di ricerca leggono davvero */}
      <section
        id="problemi-elenco"
        aria-labelledby="problemi-elenco-title"
        className="border-t border-border bg-muted/30 py-12 md:py-16"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <h2
            id="problemi-elenco-title"
            className="mb-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl text-balance"
          >
            I {PROBLEMS.length} problemi più frequenti nelle strutture ricettive
          </h2>
          <p className="mb-8 max-w-3xl leading-relaxed text-muted-foreground text-pretty md:mb-10">
            Sono i problemi che ci sentiamo raccontare più spesso da hotel, B&amp;B, agriturismi e resort. Per ognuno
            trovi le soluzioni 4BID che lo affrontano.
          </p>

          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {PROBLEMS.map((problem) => (
              <li
                key={problem.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
              >
                <h3 className="mb-4 text-base font-bold text-card-foreground sm:text-lg text-pretty">
                  {problem.label}
                </h3>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Come lo risolviamo
                </p>
                <ul className="flex flex-col gap-3">
                  {getSolutionsForProblem(problem).map((solution) => (
                    <li key={solution.id} className="flex items-start gap-3">
                      <Check className="mt-1 h-4 w-4 flex-none text-primary-blue" aria-hidden="true" />
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        <Link href={solution.href} className="font-semibold text-foreground hover:underline">
                          {solution.name}
                        </Link>{" "}
                        &mdash; {solution.claim}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Le soluzioni, viste dal lato opposto: cosa risolve ciascuna */}
      <section aria-labelledby="soluzioni-title" className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2
            id="soluzioni-title"
            className="mb-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl text-balance"
          >
            Le {SOLUTIONS.length} soluzioni 4BID per il turismo
          </h2>
          <p className="mb-8 max-w-3xl leading-relaxed text-muted-foreground text-pretty md:mb-10">
            Cinque piattaforme software, otto aree di consulenza e lo sviluppo su misura: ogni scheda elenca i problemi
            che quella soluzione risolve.
          </p>

          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((solution) => {
              const problems = getProblemsForSolution(solution.id)
              return (
                <li
                  key={solution.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${KIND_STYLE[solution.kind]}`}
                    >
                      {KIND_LABEL[solution.kind]}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {problems.length === 1 ? "1 problema" : `${problems.length} problemi`}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-card-foreground">{solution.name}</h3>
                  <p className="mb-4 leading-relaxed text-muted-foreground text-pretty">{solution.claim}</p>

                  <ul className="mb-6 flex flex-col gap-2">
                    {problems.map((p) => (
                      <li key={p.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-primary-blue" aria-hidden="true" />
                        <span>{p.short}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full justify-between bg-transparent">
                      <Link href={solution.href}>
                        <span>Scopri di più</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {solution.externalUrl && (
                      <Button asChild className="w-full justify-between bg-primary-blue hover:bg-primary-blue/90">
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
              )
            })}
          </ul>
        </div>
      </section>

      {/* FAQ: il markup FAQPage richiede che le domande siano visibili in pagina */}
      <section
        aria-labelledby="faq-title"
        className="border-t border-border bg-muted/30 py-12 md:py-16"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <h2 id="faq-title" className="mb-8 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl text-balance">
            Domande frequenti
          </h2>
          <div className="mx-auto max-w-3xl divide-y divide-border">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-base font-semibold text-foreground marker:content-none sm:text-lg">
                  <span className="text-pretty">{faq.question}</span>
                  <ArrowRight
                    className="mt-1 h-5 w-5 flex-none text-primary-blue transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="bg-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl text-balance">
              Non trovi il tuo problema nell&apos;elenco?
            </h2>
            <p className="mb-8 leading-relaxed text-gray-300 text-pretty md:text-lg">
              Raccontacelo: analizziamo la tua struttura e ti diciamo se serve una nostra piattaforma, una consulenza o
              un progetto sviluppato su misura.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-[#F4B942] text-gray-900 hover:bg-[#e0a72f]">
                <Link href="/prenota-demo">Prenota una demo gratuita</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white"
              >
                <Link href="/preventivi-progetti-personalizzati-hotel">Chiedi un preventivo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <RelatedSolutions currentSlug="problemi-hotel-soluzioni" />

      <Footer />
    </div>
  )
}
