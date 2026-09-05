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
  PROBLEM_CATEGORIES,
  SOLUTIONS,
  getProblemsForCategory,
  getProblemsForSolution,
  getSolutionsForProblem,
} from "@/lib/problem-solutions"
import { getProblemSlug } from "@/lib/problem-seo"

const PAGE_URL = "https://www.4bid.it/problemi-hotel-soluzioni"
const TITLE = "Problemi Hotel: Soluzioni per Revenue, Costi e Gestione | 4BID.IT"
const DESCRIPTION = `${PROBLEMS.length} problemi reali di hotel, resort, B&B e agriturismi divisi per area: revenue, OTA, marketing, controllo di gestione, manutenzioni, staff e tecnologia. Trova subito le soluzioni 4BID più adatte.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords:
    "problemi hotel, problemi gestione hotel, soluzioni hotel, software hotel, revenue management hotel, prezzi camere hotel, ridurre commissioni OTA, prenotazioni dirette hotel, controllo di gestione hotel, costi hotel, manutenzione hotel, housekeeping hotel, CRM hotel, automazione hotel",
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
 * Il selettore interattivo è un componente client; per SEO la pagina rende
 * anche lato server l'intera mappa problemi/soluzioni, organizzata in cluster
 * tematici e con link interni verso ogni soluzione.
 */
const FAQS = [
  {
    question: "Come faccio a capire a che prezzo vendere le camere?",
    answer:
      "Serve un sistema che legga domanda, storico, pickup e concorrenza al posto tuo. SANTADDEO supporta pricing, KPI e forecast; con la consulenza di revenue management di 4BID definiamo strategia tariffaria e obiettivi.",
  },
  {
    question: "Come posso ridurre le commissioni pagate a Booking, Expedia e alle OTA?",
    answer:
      "Bisogna riequilibrare il mix distributivo e aumentare il peso del canale diretto. L'ottimizzazione OTA lavora su canali e strategia, mentre HOTEL ACCELERATOR e le strategie di vendita diretta aiutano a gestire contatti e prenotazioni senza dipendere solo dai portali.",
  },
  {
    question: "Perché ricevo poche prenotazioni dirette dal mio sito?",
    answer:
      "Di solito il problema è una combinazione di visibilità, proposta commerciale, percorso di prenotazione e follow-up. HOTEL ACCELERATOR, le strategie di vendita diretta e il web marketing lavorano insieme su questi passaggi.",
  },
  {
    question: "Come faccio a sapere quanto guadagno davvero, non solo quanto fatturo?",
    answer:
      "Serve un controllo di gestione che separi costi, ricavi e margini per reparto. HOTELPROFIT AI organizza documenti, centri di costo, scadenze e dati economici per rendere leggibile la redditività della struttura.",
  },
  {
    question: "Come tengo sotto controllo cassa, fatture e scadenze future?",
    answer:
      "HOTELPROFIT AI riunisce documenti contabili, pagamenti, scadenziario e classificazione delle spese; il servizio di forecast e budgeting completa il lavoro con una previsione economica di periodo.",
  },
  {
    question: "Quali KPI deve misurare un hotel?",
    answer:
      "ADR, occupazione e RevPAR sono il punto di partenza, ma vanno letti insieme a pickup, forecast, mix dei canali, costi e margini. SANTADDEO e HOTELPROFIT AI coprono le due prospettive revenue ed economico-finanziaria.",
  },
  {
    question: "Come evito che le richieste di manutenzione si perdano?",
    answer:
      "Con un flusso tracciato invece delle segnalazioni a voce. MANUBOT gestisce interventi, manutenzioni programmate, assegnazioni, asset e comunicazioni operative anche attraverso WhatsApp e Telegram.",
  },
  {
    question: "Come posso gestire manutenzione preventiva, asset e QR code in hotel?",
    answer:
      "MANUBOT consente di strutturare manutenzioni programmate e schede asset, collegando le attrezzature a QR code per arrivare rapidamente a storico e attività operative.",
  },
  {
    question: "Come posso organizzare housekeeping, biancheria e controlli camera?",
    answer:
      "MANUBOT copre attività operative di housekeeping, controlli camera, biancheria e minibar, così le informazioni restano collegate ai task invece di disperdersi tra fogli, chat e telefonate.",
  },
  {
    question: "Come centralizzo email, WhatsApp e altri messaggi degli ospiti?",
    answer:
      "HOTEL ACCELERATOR riunisce i canali di comunicazione in una inbox operativa e li collega al CRM, riducendo il rischio di perdere richieste o duplicare le risposte.",
  },
  {
    question: "Come faccio se PMS, CRM e altri software dell'hotel non comunicano tra loro?",
    answer:
      "Possiamo integrare i sistemi esistenti e, quando serve, sviluppare un progetto su misura. L'obiettivo è eliminare ricopiature, accessi inutili e dati disallineati senza sostituire per forza ciò che funziona già.",
  },
  {
    question: "Cosa posso fare se i software standard non coprono il mio caso?",
    answer:
      "4BID sviluppa soluzioni su misura e integrazioni partendo dal processo reale della struttura, così il software si adatta al lavoro invece di costringere il team a lavorare intorno al software.",
  },
]

export default function ProblemiHotelSoluzioniPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="WebPage"
        title="Problemi di gestione hotel e soluzioni 4BID"
        description={DESCRIPTION}
        url={PAGE_URL}
        keywords={[
          "problemi hotel",
          "soluzioni hotel",
          "revenue management hotel",
          "controllo di gestione hotel",
          "manutenzione hotel",
          "CRM hotel",
        ]}
        faqs={FAQS}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Problemi e soluzioni", url: PAGE_URL },
        ]}
        speakable={["h1", "#problemi-elenco h3"]}
      />

      <Header />

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

          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary-blue">
              {PROBLEMS.length} problemi reali · 6 aree · una mappa di soluzioni
            </p>
            <h1 className="mb-5 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl text-balance">
              Problemi di gestione hotel? Trova la soluzione giusta
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
              Prezzi, Booking e OTA, prenotazioni dirette, fatture, costi, manutenzioni, housekeeping, staff, PMS e
              automazioni. Cerca il problema oppure scegli una categoria: ti mostriamo quali piattaforme, consulenze e
              progetti 4BID possono affrontarlo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                <a href="#selettore">Trova la mia soluzione</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/prenota-demo">Prenota una demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="selettore" className="scroll-mt-24 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <ProblemSolutionFinder titleAs="h2" />
        </div>
      </section>

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
            Guida completa ai {PROBLEMS.length} problemi più frequenti nella gestione di un hotel
          </h2>
          <p className="mb-6 max-w-4xl leading-relaxed text-muted-foreground text-pretty">
            Questa è la versione completa, leggibile anche dai motori di ricerca: i problemi sono raggruppati per tema.
            Ogni problema ha una guida dedicata e rimanda alle soluzioni 4BID pertinenti; usa il selettore sopra per una
            ricerca più veloce.
          </p>

          <nav aria-label="Indice dei problemi" className="mb-10 flex flex-wrap gap-2">
            {PROBLEM_CATEGORIES.map((category) => (
              <a
                key={category.id}
                href={`#problemi-${category.id}`}
                className="rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:border-primary-blue hover:text-primary-blue"
              >
                {category.label}
              </a>
            ))}
          </nav>

          <div className="space-y-12">
            {PROBLEM_CATEGORIES.map((category) => {
              const categoryProblems = getProblemsForCategory(category.id)
              return (
                <section
                  key={category.id}
                  id={`problemi-${category.id}`}
                  aria-labelledby={`problemi-${category.id}-title`}
                  className="scroll-mt-28"
                >
                  <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                    <div className="max-w-3xl">
                      <h3
                        id={`problemi-${category.id}-title`}
                        className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl"
                      >
                        {category.label}
                      </h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{category.description}</p>
                    </div>
                    <span className="flex-none text-sm font-semibold text-muted-foreground">
                      {categoryProblems.length} problemi
                    </span>
                  </div>

                  <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {categoryProblems.map((problem) => (
                      <li
                        key={problem.id}
                        className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                      >
                        <h4 className="mb-2 text-base font-bold text-card-foreground sm:text-lg text-pretty">
                          <Link
                            href={`/problemi-hotel/${getProblemSlug(problem)}`}
                            className="transition-colors hover:text-primary-blue hover:underline"
                          >
                            {problem.label}
                          </Link>
                        </h4>
                        <Link
                          href={`/problemi-hotel/${getProblemSlug(problem)}`}
                          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-blue hover:underline"
                        >
                          Leggi la guida completa
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Come lo affrontiamo
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
                </section>
              )
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="soluzioni-title" className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2
            id="soluzioni-title"
            className="mb-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl text-balance"
          >
            Le {SOLUTIONS.length} soluzioni 4BID per il turismo
          </h2>
          <p className="mb-8 max-w-3xl leading-relaxed text-muted-foreground text-pretty md:mb-10">
            Piattaforme software, consulenze specialistiche e sviluppo su misura: ogni soluzione è collegata ai problemi
            concreti che può affrontare.
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
                    {problems.slice(0, 6).map((problem) => (
                      <li key={problem.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-primary-blue" aria-hidden="true" />
                        <span>{problem.short}</span>
                      </li>
                    ))}
                  </ul>
                  {problems.length > 6 && (
                    <p className="mb-5 text-sm font-medium text-muted-foreground">
                      + altri {problems.length - 6} problemi collegati
                    </p>
                  )}

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

      <section aria-labelledby="faq-title" className="border-t border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 id="faq-title" className="mb-8 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl text-balance">
            Domande frequenti sulla gestione hotel
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

      <section className="bg-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl text-balance">
              Il tuo problema non rientra in nessuna categoria?
            </h2>
            <p className="mb-8 leading-relaxed text-gray-300 text-pretty md:text-lg">
              Raccontacelo: analizziamo il processo e ti diciamo se serve una piattaforma 4BID, una consulenza,
              un'integrazione oppure un progetto sviluppato su misura.
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
