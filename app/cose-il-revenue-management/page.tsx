import Link from "next/link"
import type { Metadata } from "next"
import {
  TrendingUp,
  Target,
  Hotel,
  Building2,
  Home,
  Palmtree,
  Calculator,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  LineChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata: Metadata = {
  title: "Cos'è il Revenue Management Hotel? Guida Completa 2025 | 4BID.IT",
  description:
    "Cos'è il revenue management spiegato semplice: definizione, dove si applica (hotel, B&B, resort), perché è necessario, come funziona. Guida completa con esempi pratici. +30% ricavi medi.",
  keywords:
    "cos'è revenue management, cosa significa revenue management, revenue management spiegazione semplice, revenue management definizione hotel, guida revenue management completa, revenue management come funziona",
  alternates: {
    canonical: "https://4bid.it/cose-il-revenue-management",
  },
  openGraph: {
    title: "Cos'è il Revenue Management Hotel? Guida Completa 2025",
    description:
      "Cos'è il revenue management spiegato semplice: definizione, dove si applica (hotel, B&B, resort), perché è necessario, come funziona. Guida completa con esempi pratici. +30% ricavi medi.",
    url: "https://4bid.it/cose-il-revenue-management",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "article",
    images: [
      {
        url: "https://4bid.it/4bid-colorful-logo.jpg",
        width: 1200,
        height: 630,
        alt: "4BID.IT Revenue Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cos'è il Revenue Management Hotel? Guida Completa 2025",
    description: "Guida semplice e completa al Revenue Management per hotel e strutture ricettive.",
    images: ["https://4bid.it/4bid-colorful-logo.jpg"],
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

export default function CoseIlRevenueManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Cos'è il Revenue Management Hotel? Guida Completa"
        description="Guida completa per comprendere cos'è il Revenue Management Hotel, dove si applica e perché è fondamentale per massimizzare i ricavi."
        url="https://4bid.it/cose-il-revenue-management"
      />

      <LandingPageTracker slug="cose-il-revenue-management" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">Cos'è il Revenue Management Hotel?</h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Una guida semplice e completa per capire cos'è il Revenue Management Hotel, dove si applica e perché è
              fondamentale per hotel, B&B, resort e agriturismi.
            </p>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto border border-border/50 text-left">
              <p className="text-sm font-semibold text-primary-blue mb-3">In sintesi:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Disciplina che ottimizza prezzo e disponibilità per massimizzare ricavi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Utile quando l'inventario è limitato e deperibile (camere, posti)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Applicabile a hotel e ad altri settori con domanda variabile</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Per Chi è Indispensabile il Revenue Management? */}
      <section className="py-20 bg-yellow/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow/10 rounded-2xl p-10 border-2 border-yellow/30">
              <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <TrendingUp className="h-10 w-10 text-yellow" />
                Per Chi è Indispensabile il Revenue Management?
              </h2>
              <p className="text-lg text-foreground leading-relaxed mb-6">
                Il Revenue Management è{" "}
                <strong>necessario per tutte quelle attività che non possono fare magazzino</strong> e i cui
                prodotti/servizi hanno un'<strong>alta deperibilità</strong>.
              </p>

              <div className="bg-card/50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-card-foreground mb-4">L'Esempio delle Camere d'Hotel</h3>
                <p className="text-muted-foreground mb-4">
                  Una camera d'hotel <strong className="text-foreground">dura solo 24 ore</strong>. Se non viene venduta
                  oggi, quella opportunità di ricavo è persa per sempre. Non puoi "metterla in magazzino" per venderla
                  domani.
                </p>
                <p className="text-muted-foreground">
                  Inoltre, i <strong className="text-foreground">costi fissi rimangono invariati</strong>{" "}
                  indipendentemente dall'occupazione: personale, utenze, manutenzione, affitto. Una camera vuota genera
                  zero ricavi ma i costi continuano a essere sostenuti.
                </p>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-4">
                Settori Dove il Revenue Management è Fondamentale
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    title: "Turismo e Hospitality",
                    examples: "Hotel, B&B, Resort, Agriturismi, Case vacanza, Ostelli",
                  },
                  {
                    title: "Trasporti",
                    examples: "Biglietti aerei, Treni, Autobus, Traghetti, Noleggio auto",
                  },
                  {
                    title: "Intrattenimento",
                    examples: "Cinema, Teatri, Concerti, Eventi sportivi, Parchi tematici",
                  },
                  {
                    title: "Altri Settori",
                    examples: "Ristoranti, Spa e centri benessere, Parcheggi, Coworking",
                  },
                ].map((sector, index) => (
                  <div key={index} className="bg-card rounded-lg p-5 border border-border">
                    <h4 className="font-bold text-card-foreground mb-2">{sector.title}</h4>
                    <p className="text-sm text-muted-foreground">{sector.examples}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-5 bg-primary-blue/10 rounded-lg border-l-4 border-primary-blue">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Regola generale:</strong> Se il tuo prodotto/servizio ha una
                  "scadenza" (ore, giorni, settimane) e non puoi accumulare inventory, il Revenue Management può
                  aumentare drasticamente i tuoi ricavi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Definizione Semplice */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary-blue/10 rounded-2xl p-10 border-2 border-primary-blue/20 mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Definizione Semplice</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Il <strong className="text-foreground">Revenue Management</strong> è una strategia aziendale che
                consiste nel{" "}
                <strong>vendere la camera giusta, al cliente giusto, al momento giusto, al prezzo giusto</strong>,
                attraverso il canale di distribuzione più appropriato.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                In altre parole, significa <strong className="text-foreground">massimizzare i ricavi</strong> della tua
                struttura ricettiva modificando dinamicamente i prezzi in base alla domanda del mercato, alla
                stagionalità, agli eventi locali e alla concorrenza.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl p-8 border border-border">
                <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-3">Esempio Pratico</h3>
                <p className="text-muted-foreground">
                  Un hotel che applica il Revenue Management non ha un prezzo fisso tutto l'anno. Durante eventi
                  importanti o alta stagione, aumenta le tariffe quando la domanda è alta. Nei periodi più tranquilli,
                  propone offerte competitive per mantenere alto il livello di occupazione.
                </p>
              </div>

              <div className="bg-card rounded-xl p-8 border border-border">
                <Calculator className="h-12 w-12 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-3">Il Risultato</h3>
                <p className="text-muted-foreground">
                  Applicando correttamente il Revenue Management, un hotel può aumentare i propri ricavi del{" "}
                  <strong className="text-foreground">20-35%</strong> senza aumentare i costi operativi o il numero di
                  camere disponibili. È pura ottimizzazione.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dove si Applica */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">
            Dove si Applica il Revenue Management?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Il Revenue Management è applicabile a tutte le strutture ricettive e alle aziende che hanno una capacità
            limitata da vendere
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Hotel className="h-10 w-10" />,
                title: "Hotel e Alberghi",
                description:
                  "Da hotel indipendenti a catene alberghiere, il Revenue Management ottimizza tariffe e occupazione massimizzando RevPAR e ADR.",
              },
              {
                icon: <Building2 className="h-10 w-10" />,
                title: "Resort e Spa",
                description:
                  "Gestione completa non solo delle camere ma anche di servizi ancillari come spa, ristoranti, congressi ed eventi.",
              },
              {
                icon: <Home className="h-10 w-10" />,
                title: "Bed & Breakfast",
                description:
                  "Anche le strutture più piccole beneficiano del Revenue Management per competere con OTA e aumentare prenotazioni dirette.",
              },
              {
                icon: <Palmtree className="h-10 w-10" />,
                title: "Agriturismi",
                description:
                  "Ottimizzazione del revenue mix tra alloggi, ristorazione ed esperienze turistiche legate al territorio rurale.",
              },
              {
                icon: <Building2 className="h-10 w-10" />,
                title: "Boutique Hotel",
                description:
                  "Strategie premium per hotel di charme che puntano su posizionamento di lusso e brand value pricing.",
              },
              {
                icon: <Users className="h-10 w-10" />,
                title: "Ostelli e Camping",
                description:
                  "Gestione dinamica delle tariffe per camerate, piazzole e bungalow con focus su segmenti giovani e famiglie.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <div className="text-primary-blue mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-card-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perché è Necessario */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Perché il Revenue Management è Necessario?
          </h2>

          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-2xl p-8 border-l-4 border-destructive">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Target className="h-8 w-8 text-destructive" />
                Senza Revenue Management perdi ricavi ogni giorno
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>
                    <strong>Prezzi troppo bassi</strong>: Vendi camere a tariffe inferiori al loro valore reale di
                    mercato, lasciando soldi sul tavolo
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>
                    <strong>Prezzi troppo alti</strong>: Nelle stagioni basse, camere vuote significano ricavi zero
                    invece di ricavi ridotti ma positivi
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>
                    <strong>Commissioni OTA eccessive</strong>: Senza strategia di direct booking, paghi il 15-25% di
                    commissioni su ogni prenotazione
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>
                    <strong>Decisioni a 'sensazione'</strong>: Senza dati e analisi, le decisioni di pricing sono basate
                    sull'intuito invece che sui numeri
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-primary-blue/10 to-blue-grey/5 rounded-2xl p-8 border-l-4 border-primary-blue">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-primary-blue" />
                Con il Revenue Management ottieni vantaggi concreti
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Aumento del RevPAR del 20-35%</strong>: Massimizzi il ricavo per
                    camera disponibile ottimizzando prezzi e occupazione
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Decisioni data-driven</strong>: Ogni scelta di prezzo è
                    supportata da analisi di mercato, pickup e forecast accurati
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Competitività aumentata</strong>: Monitora e reagisci ai
                    cambiamenti di prezzo dei competitor in tempo reale
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Ottimizzazione canali di vendita</strong>: Riduci le commissioni
                    OTA aumentando le prenotazioni dirette
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Previsioni accurate</strong>: Forecast precisi ti permettono di
                    pianificare staffing, acquisti e investimenti
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Come Funziona il Revenue Management?</h2>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                number: "01",
                title: "Analisi del Mercato",
                description:
                  "Studio del competitive set, analisi della domanda locale, eventi e stagionalità. Identificazione opportunità e gap nel posizionamento.",
              },
              {
                number: "02",
                title: "Segmentazione Clientela",
                description:
                  "Classificazione dei clienti in segmenti (leisure, business, gruppi, eventi) per applicare strategie di pricing differenziate.",
              },
              {
                number: "03",
                title: "Definizione Strategie di Pricing",
                description:
                  "Creazione di tariffe dinamiche (BAR, packages, LOS restrictions, early booking, last minute) basate sulla domanda prevista.",
              },
              {
                number: "04",
                title: "Forecast e Budgeting",
                description:
                  "Previsione accurata di occupazione e ricavi per i prossimi 365 giorni, con aggiornamenti settimanali basati sul pickup reale.",
              },
              {
                number: "05",
                title: "Gestione Distribuzione",
                description:
                  "Ottimizzazione del mix di canali (OTA, sito diretto, GDS, wholesaler) per massimizzare i ricavi netti e ridurre le commissioni.",
              },
              {
                number: "06",
                title: "Monitoraggio KPI",
                description:
                  "Tracking continuo di RevPAR, ADR, Occupazione, RGI, Pickup, Pace e altri indicatori chiave per valutare performance e strategia.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-8 border border-border shadow-md hover:shadow-lg transition-shadow flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-blue">{step.number}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chi Fa Revenue Management */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Chi si Occupa di Revenue Management?</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-8 border border-border">
              <Users className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Revenue Manager Interno</h3>
              <p className="text-muted-foreground mb-4">
                Un professionista assunto direttamente dall'hotel che si dedica full-time all'ottimizzazione dei ricavi.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Ideale per:</strong> Hotel con 50+ camere, catene alberghiere, resort
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border border-border">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Consulente Esterno</h3>
              <p className="text-muted-foreground mb-4">
                Un esperto freelance o società di consulenza che gestisce il Revenue Management per più strutture.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Ideale per:</strong> Hotel indipendenti, B&B, agriturismi, boutique hotel
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border border-border">
              <BarChart3 className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Software RMS</h3>
              <p className="text-muted-foreground mb-4">
                Sistemi automatizzati come SANTADDEO che analizzano dati e suggeriscono o applicano automaticamente le
                tariffe ottimali.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Ideale per:</strong> Tutte le strutture che vogliono automatizzare il processo
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              In 4BID.IT combiniamo <strong className="text-foreground">consulenza personalizzata</strong> e{" "}
              <strong className="text-foreground">software avanzato SANTADDEO</strong> per offrirti il meglio di
              entrambi i mondi.
            </p>
            <Link href="/consulenza-revenue-management-hotel">
              <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                Scopri i Nostri Servizi
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Domande Frequenti</h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "Il Revenue Management funziona anche per hotel piccoli?",
                answer:
                  "Assolutamente sì. Anche un B&B con 5 camere può beneficiare del Revenue Management. Non serve una struttura grande per applicare strategie di pricing dinamico e ottimizzazione dei ricavi. Anzi, le strutture più piccole hanno spesso maggiore flessibilità nel modificare i prezzi rapidamente.",
              },
              {
                question: "Quanto costa implementare il Revenue Management?",
                answer:
                  "Con 4BID.IT offriamo un modello performance-based: paghi solo una percentuale sull'incremento di fatturato generato. Zero costi fissi, zero rischi. In alternativa, offriamo anche consulenze tradizionali con fee mensile per chi preferisce un budget definito.",
              },
              {
                question: "In quanto tempo si vedono i risultati?",
                answer:
                  "I primi miglioramenti sono visibili entro 30-60 giorni dall'implementazione delle strategie. I risultati più significativi si consolidano nei primi 6 mesi quando il sistema di pricing dinamico è completamente ottimizzato e calibrato sul tuo mercato specifico.",
              },
              {
                question: "Ho già un Channel Manager, serve altro?",
                answer:
                  "Il Channel Manager distribuisce le tue tariffe sui vari canali, ma non le ottimizza. Il Revenue Management DECIDE quali tariffe applicare, quando e a chi. I due sistemi lavorano insieme: il Revenue Management definisce la strategia, il Channel Manager la implementa tecnicamente.",
              },
              {
                question: "Il Revenue Management sostituisce il mio staff?",
                answer:
                  "No, il Revenue Management è uno strumento che POTENZIA il tuo team. Fornisce dati, analisi e raccomandazioni che permettono al tuo staff di prendere decisioni migliori. Spesso offriamo anche formazione per rendere il tuo team autonomo nell'applicare le strategie.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-card rounded-xl p-8 border border-border shadow-md">
                <div className="flex gap-4">
                  <HelpCircle className="h-6 w-6 text-primary-blue flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-card-foreground mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Finale */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <LineChart className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Pronto a Iniziare con il Revenue Management?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Scopri come aumentare i ricavi del tuo hotel fino al 30% con strategie di Revenue Management personalizzate
            e senza rischi.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/consulenza-revenue-management-hotel">
              <Button size="lg" variant="secondary">
                Scopri i Nostri Servizi
              </Button>
            </Link>
            <Link href="/#contact">
              <Button size="lg" className="bg-white text-primary-blue hover:bg-white/90">
                Richiedi Consulenza Gratuita
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
