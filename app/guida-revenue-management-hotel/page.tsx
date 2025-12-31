import Link from "next/link"
import type { Metadata } from "next"
import { BookOpen, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { ContactButton } from "@/components/contact-button"

function getUpdateDate(): string {
  const months = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ]

  // Try to get commit date from Vercel environment
  const commitDate = process.env.VERCEL_GIT_COMMIT_DATE

  if (commitDate) {
    const date = new Date(commitDate)
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Fallback to current date (deploy time for SSR)
  const now = new Date()
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
}

export const metadata: Metadata = {
  title: "Guida Completa al Revenue Management Hotel | 4BID.IT",
  description:
    "Guida completa al Revenue Management per hotel: cos'è, come funziona, checklist operativa, errori comuni e glossario. Risorse gratuite per albergatori.",
  keywords:
    "guida revenue management hotel, revenue management cos'è, come funziona revenue management, manuale revenue hotel",
  alternates: {
    canonical: "https://www.4bid.it/guida-revenue-management-hotel",
  },
  openGraph: {
    title: "Guida Completa al Revenue Management Hotel | 4BID.IT",
    description:
      "Guida completa al Revenue Management per hotel: cos'è, come funziona, checklist operativa, errori comuni e glossario.",
    url: "https://www.4bid.it/guida-revenue-management-hotel",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function GuidaRevenueManagementPage() {
  const updateDate = getUpdateDate()
  const isDeployDate = !process.env.VERCEL_GIT_COMMIT_DATE

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Guida Completa al Revenue Management Hotel"
        description="Guida completa al Revenue Management per hotel: cos'è, come funziona, checklist operativa, errori comuni e glossario."
        url="https://www.4bid.it/guida-revenue-management-hotel"
        keywords={["revenue management", "hotel", "guida", "pricing", "yield management"]}
      />

      <LandingPageTracker slug="guida-revenue-management-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-primary-blue mb-4">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-medium">Guida Completa</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Guida al Revenue Management per Hotel
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Aggiornato{isDeployDate ? " (deploy)" : ""}: {updateDate}
            </p>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Tutto quello che devi sapere sul Revenue Management alberghiero: dalla teoria alla pratica, con checklist
              operative e glossario completo.
            </p>

            {/* In sintesi box */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <p className="text-sm font-semibold text-primary-blue mb-3">In sintesi:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    Il Revenue Management ottimizza prezzi e disponibilità per massimizzare i ricavi totali della
                    struttura
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    Si applica a qualsiasi struttura ricettiva: hotel, B&B, resort, agriturismi e case vacanza
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    Richiede analisi continua di domanda, concorrenza e storico per prendere decisioni informate
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cos'è */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Cos'è il Revenue Management</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                Il Revenue Management è una disciplina gestionale che mira a vendere il prodotto giusto, al cliente
                giusto, al momento giusto e al prezzo giusto. Nel settore alberghiero, questo significa ottimizzare
                l'equilibrio tra tariffa media e occupazione per massimizzare il ricavo totale.
              </p>
              <p>
                A differenza del semplice controllo dei prezzi, il Revenue Management considera l'intera strategia
                commerciale: segmentazione della clientela, gestione dei canali di distribuzione, restrizioni tariffarie
                e previsione della domanda.
              </p>
              <p>
                L'obiettivo finale non è riempire l'hotel a qualsiasi costo, né vendere solo a tariffe elevate, ma
                trovare il punto di equilibrio che genera il massimo ricavo complessivo considerando tutti i fattori in
                gioco.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Per chi è */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Per Chi è il Revenue Management</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Hotel indipendenti",
                  desc: "Strutture che vogliono competere con le catene senza disporre delle stesse risorse",
                },
                {
                  title: "Boutique hotel",
                  desc: "Realtà che puntano su posizionamento premium e clientela selezionata",
                },
                {
                  title: "Resort e strutture stagionali",
                  desc: "Attività con forte variabilità della domanda durante l'anno",
                },
                {
                  title: "B&B e agriturismi",
                  desc: "Piccole strutture che vogliono ottimizzare ricavi con risorse limitate",
                },
                {
                  title: "Catene alberghiere",
                  desc: "Gruppi che necessitano di strategie coordinate tra più proprietà",
                },
                {
                  title: "Case vacanza e affitti brevi",
                  desc: "Proprietari che gestiscono una o più unità su piattaforme online",
                },
              ].map((item, index) => (
                <div key={index} className="bg-card rounded-lg p-5 border border-border">
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Come Funziona: 5 Step</h2>
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Raccolta dati",
                  desc: "Analisi dello storico prenotazioni, tariffe passate, occupazione e ricavi per periodo. Identificazione dei pattern di domanda.",
                },
                {
                  step: 2,
                  title: "Analisi del mercato",
                  desc: "Studio della concorrenza, eventi locali, stagionalità e fattori esterni che influenzano la domanda nella tua zona.",
                },
                {
                  step: 3,
                  title: "Segmentazione clientela",
                  desc: "Identificazione dei diversi tipi di ospiti (business, leisure, famiglie, coppie) e delle loro sensibilità al prezzo.",
                },
                {
                  step: 4,
                  title: "Definizione strategia tariffaria",
                  desc: "Creazione di una struttura di prezzi flessibile con tariffe base, restrizioni e regole di variazione automatica.",
                },
                {
                  step: 5,
                  title: "Monitoraggio e ottimizzazione",
                  desc: "Controllo continuo delle performance, confronto con forecast e aggiustamento della strategia in base ai risultati.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checklist operativa */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Checklist Operativa</h2>
            <div className="bg-card rounded-xl p-6 border border-border">
              <ul className="space-y-3">
                {[
                  "Definire i KPI principali da monitorare (RevPAR, ADR, Occupancy)",
                  "Mappare tutti i canali di distribuzione attivi e le relative commissioni",
                  "Creare un calendario eventi della zona per i prossimi 12 mesi",
                  "Analizzare lo storico prenotazioni degli ultimi 2-3 anni",
                  "Identificare i competitor diretti e monitorare le loro tariffe",
                  "Segmentare la clientela in base a provenienza, motivo del soggiorno e canale",
                  "Definire una struttura tariffaria con almeno 3-4 livelli di prezzo",
                  "Impostare regole di variazione automatica basate su occupazione e lead time",
                  "Stabilire una routine di revisione settimanale delle performance",
                  "Documentare le decisioni prese e i risultati ottenuti per creare storico",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Errori comuni */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Errori Comuni da Evitare</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  error: "Tariffe statiche tutto l'anno",
                  desc: "Non adattare i prezzi alla domanda lascia soldi sul tavolo nei periodi di alta stagione.",
                },
                {
                  error: "Guardare solo l'occupazione",
                  desc: "Riempire l'hotel a prezzi troppo bassi può generare meno ricavi di una occupazione minore a tariffe più alte.",
                },
                {
                  error: "Ignorare i competitor",
                  desc: "Non sapere come si posizionano gli altri rende impossibile definire una strategia efficace.",
                },
                {
                  error: "Reagire invece di prevedere",
                  desc: "Modificare i prezzi solo quando l'hotel è già pieno o vuoto è troppo tardi per ottimizzare.",
                },
                {
                  error: "Dipendenza da un solo canale",
                  desc: "Concentrare le vendite su una OTA espone a rischi e riduce il potere negoziale.",
                },
                {
                  error: "Non misurare i risultati",
                  desc: "Senza dati è impossibile capire se le decisioni prese stanno funzionando o meno.",
                },
              ].map((item, index) => (
                <div key={index} className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.error}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Glossario */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Glossario Minimo</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { term: "RevPAR", def: "Revenue Per Available Room - ricavo medio per camera disponibile" },
                { term: "ADR", def: "Average Daily Rate - tariffa media giornaliera delle camere vendute" },
                { term: "Occupancy Rate", def: "Percentuale di camere vendute rispetto a quelle disponibili" },
                { term: "Yield Management", def: "Gestione del rendimento attraverso variazione dinamica dei prezzi" },
                { term: "BAR", def: "Best Available Rate - miglior tariffa disponibile al pubblico" },
                { term: "LOS", def: "Length of Stay - durata del soggiorno, usata come leva tariffaria" },
                { term: "Pick-up", def: "Andamento delle prenotazioni per una data specifica nel tempo" },
                { term: "Comp Set", def: "Competitive Set - gruppo di hotel concorrenti di riferimento" },
              ].map((item, index) => (
                <div key={index} className="bg-card rounded-lg p-4 border border-border">
                  <span className="font-mono text-primary-blue font-semibold">{item.term}</span>
                  <p className="text-sm text-muted-foreground mt-1">{item.def}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Risorse correlate */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Risorse Correlate</h2>
            <div className="space-y-3">
              {[
                { title: "Cos'è il Revenue Management", url: "/cose-il-revenue-management" },
                { title: "Consulenza Revenue Management Hotel", url: "/consulenza-revenue-management-hotel" },
                { title: "Dynamic Pricing per Hotel", url: "/dynamic-pricing-hotel" },
                { title: "KPI e Metriche Hotel", url: "/kpi-metriche-hotel" },
                { title: "Software Revenue Management SANTADDEO", url: "/software-revenue-management-santaddeo" },
              ].map((link, index) => (
                <Link key={index} href={link.url} className="flex items-center gap-2 text-primary-blue hover:underline">
                  <ExternalLink className="h-4 w-4" />
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Vuoi Approfondire?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Se hai domande sul Revenue Management o vuoi capire come applicarlo alla tua struttura, contattaci per una
            consulenza.
          </p>
          <ContactButton size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
            Richiedi Informazioni
          </ContactButton>
        </div>
      </section>

      <Footer />
    </div>
  )
}
