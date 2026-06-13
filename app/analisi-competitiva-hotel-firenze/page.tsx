import Link from "next/link"
import { TrendingUp, Target, Eye, BarChart3, CheckCircle2, MapPin, Users, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Analisi Competitiva Hotel Firenze | Revenue Management | 4BID.IT",
  description:
    "Analisi competitiva strategica per hotel a Firenze. Monitora la concorrenza, ottimizza prezzi e posizionamento per massimizzare i ricavi del tuo hotel nel mercato fiorentino.",
  keywords:
    "analisi competitiva hotel, hotel firenze, competitive set firenze, rate shopping firenze, pricing hotel firenze, mercato alberghiero firenze, revenue management firenze",
  openGraph: {
    title: "Analisi Competitiva Hotel Firenze | Revenue Management | 4BID.IT",
    description:
      "Analisi strategica del competitive set per hotel a Firenze. Monitora la concorrenza e ottimizza il posizionamento.",
    url: "https://www.4bid.it/analisi-competitiva-hotel-firenze",
    type: "article",
  },
  alternates: {
    canonical: "https://www.4bid.it/analisi-competitiva-hotel-firenze",
  },
}

const faqData = [
  {
    question: "Cos'è l'analisi competitiva per hotel?",
    answer:
      "L'analisi competitiva è lo studio sistematico dei competitor diretti per identificare opportunità di pricing, posizionamento e differenziazione. Include il monitoraggio delle tariffe, delle strategie promozionali e delle performance relative al mercato.",
  },
  {
    question: "Come si identifica il competitive set di un hotel a Firenze?",
    answer:
      "Il competitive set si identifica analizzando hotel con caratteristiche simili: stessa categoria (stelle), zona (Centro Storico, Oltrarno, etc.), target di clientela e fascia di prezzo. Tipicamente si selezionano 10-15 competitor diretti.",
  },
  {
    question: "Quali eventi influenzano i prezzi degli hotel a Firenze?",
    answer:
      "I principali eventi che influenzano i prezzi sono: Pitti Immagine Uomo/Donna, Firenze Fashion Week, le fiere alla Fortezza da Basso, il Maggio Musicale Fiorentino, Firenze Rocks e gli eventi al Mandela Forum.",
  },
]

export default function AnalisiCompetitivaHotelFirenzePage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Analisi Competitiva Hotel Firenze"
        description="Analisi strategica del competitive set per hotel a Firenze"
        faq={faqData}
      />
      <LandingPageTracker slug="analisi-competitiva-hotel-firenze" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-6 w-6 text-primary-blue" />
              <span className="text-primary-blue font-semibold">Firenze & Toscana</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Analisi Competitiva per Hotel a Firenze
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Monitora la concorrenza, ottimizza il tuo posizionamento e massimizza i ricavi nel competitivo mercato
              alberghiero fiorentino. Analisi strategica del competitive set e rate shopping professionale.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Analisi Gratuita
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO RMS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Firenze */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Il Mercato Alberghiero Fiorentino</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Users className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Alta Competizione</h3>
              <p className="text-muted-foreground">
                Oltre 400 hotel a Firenze competono per turisti business, leisure e MICE. Conoscere i competitor è
                fondamentale.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Stagionalità Marcata</h3>
              <p className="text-muted-foreground">
                Eventi culturali, fiere e stagioni turistiche creano oscillazioni di prezzo fino al 300%. Serve una
                strategia dinamica.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Destination Premium</h3>
              <p className="text-muted-foreground">
                Firenze è una meta premium. Il pricing deve riflettere il valore percepito rispetto al competitive set.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Analyze */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Cosa Analizziamo per il Tuo Hotel</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Analisi approfondita del mercato, dei competitor e delle opportunità di posizionamento
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
              <Eye className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Competitive Set Analysis</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Identificazione dei 10-15 competitor diretti per location, categoria e target</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Analisi delle tariffe giornaliere su tutti i canali di distribuzione</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Studio delle politiche di cancellazione e restrizioni minimo soggiorno</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Monitoring delle strategie promozionali e pacchetti speciali</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
              <BarChart3 className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Market Intelligence</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Trend di domanda per zona (Centro Storico, Oltrarno, Porta Romana, ecc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Analisi degli eventi culturali, fiere e manifestazioni che impattano i prezzi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Studio del comportamento di prenotazione del target (lead time, durata soggiorno)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Benchmarking KPI: ADR, RevPAR, Occupancy vs competitive set</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Insights */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Gli Insight Strategici che Ottieni</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Gap Analysis",
                description: "Identifichiamo opportunità di pricing dove la concorrenza è debole",
              },
              {
                title: "Positioning Map",
                description: "Visualizzazione chiara del tuo posizionamento vs competitor",
              },
              {
                title: "Forecast Demand",
                description: "Previsioni di domanda basate su dati storici e eventi futuri",
              },
              {
                title: "Pricing Strategy",
                description: "Raccomandazioni specifiche per ogni periodo e segmento",
              },
              {
                title: "Distribution Mix",
                description: "Ottimizzazione del canale mix per ridurre costi e aumentare direct",
              },
              {
                title: "Review Analysis",
                description: "Confronto recensioni e reputazione online vs competitive set",
              },
              {
                title: "Seasonal Patterns",
                description: "Analisi delle performance stagionali per anticipare la domanda",
              },
              {
                title: "Action Plan",
                description: "Piano operativo mensile con azioni concrete e KPI misurabili",
              },
            ].map((insight, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <TrendingUp className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{insight.title}</h3>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study Firenze */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Case Study: Hotel 4* Centro Firenze</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="text-sm opacity-80 mb-2">Prima dell'Analisi</p>
              <p className="text-3xl font-bold mb-2">€145</p>
              <p className="text-sm">ADR medio</p>
              <p className="text-sm opacity-80 mt-4">Posizionamento poco chiaro, pricing reattivo alla concorrenza</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="text-sm opacity-80 mb-2">Dopo 6 Mesi</p>
              <p className="text-3xl font-bold mb-2">€189</p>
              <p className="text-sm">ADR medio (+30%)</p>
              <p className="text-sm opacity-80 mt-4">
                Strategia di pricing dinamico, segmentazione target, promozioni mirate
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="text-sm opacity-80 mb-2">RevPAR Incremento</p>
              <p className="text-3xl font-bold mb-2">+€48K</p>
              <p className="text-sm">Revenue mensile</p>
              <p className="text-sm opacity-80 mt-4">
                Miglioramento netto del fatturato mantenendo occupancy stabile all'82%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specific Zones */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Esperienza Specifica su Firenze</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border border-border">
              <MapPin className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Zone Analizzate</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>✓ Centro Storico (Duomo, Signoria, Ponte Vecchio)</p>
                <p>✓ Santa Croce e San Lorenzo</p>
                <p>✓ Oltrarno (Santo Spirito, San Frediano)</p>
                <p>✓ Porta Romana e Boboli</p>
                <p>✓ Fortezza da Basso (zona Fiere)</p>
                <p>✓ Periferia e Business District</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 rounded-2xl p-8 border border-border">
              <Award className="h-12 w-12 text-yellow mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Eventi Monitorati</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>✓ Pitti Immagine Uomo/Donna</p>
                <p>✓ Firenze Fashion Week</p>
                <p>✓ Fiere Fortezza da Basso</p>
                <p>✓ Maggio Musicale Fiorentino</p>
                <p>✓ Settimana Santa e Scoppio del Carro</p>
                <p>✓ Concerti Firenze Rocks e eventi Mandela Forum</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Vuoi Battere la Concorrenza a Firenze?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi competitiva gratuita. Ti mostreremo esattamente dove sono le opportunità per il tuo
            hotel nel mercato fiorentino.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Analisi Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
