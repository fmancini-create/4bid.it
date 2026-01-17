import Link from "next/link"
import { BarChart3, TrendingUp, Target, Activity, CheckCircle2, LineChart, PieChart, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "KPI e Metriche Hotel: Monitora le Performance | 4BID.IT",
  description:
    "Guida completa ai KPI e metriche essenziali per hotel: RevPAR, ADR, occupazione, TRevPAR. Scopri come monitorare e migliorare le performance della tua struttura ricettiva.",
  keywords:
    "KPI hotel, metriche hotel, RevPAR, ADR, occupazione hotel, TRevPAR, performance hotel, indicatori revenue management, analytics hotel",
  openGraph: {
    title: "KPI e Metriche Hotel: Monitora le Performance | 4BID.IT",
    description: "Guida completa ai KPI essenziali per hotel: RevPAR, ADR, occupazione, TRevPAR.",
    url: "https://www.4bid.it/kpi-metriche-hotel",
    type: "article",
  },
  alternates: {
    canonical: "https://www.4bid.it/kpi-metriche-hotel",
  },
}

const faqData = [
  {
    question: "Come si calcola il RevPAR di un hotel?",
    answer:
      "Il RevPAR (Revenue Per Available Room) si calcola: Ricavi Camere ÷ Camere Disponibili. Oppure: ADR × Occupazione. È il KPI più importante perché combina tariffa e occupazione in un'unica metrica.",
  },
  {
    question: "Qual è la differenza tra RevPAR e TRevPAR?",
    answer:
      "Il RevPAR considera solo i ricavi camere, mentre il TRevPAR (Total RevPAR) include tutti i ricavi: camere, F&B, spa, servizi ancillari. Il TRevPAR è più completo per valutare la redditività totale.",
  },
  {
    question: "Come si calcola l'ADR (Average Daily Rate)?",
    answer:
      "L'ADR si calcola: Ricavi Totali Camere ÷ Numero Camere Vendute. Indica il prezzo medio delle camere vendute ed è fondamentale per le strategie di pricing.",
  },
]

export default function KPIMetricheHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="KPI e Metriche Hotel: Monitora le Performance"
        description="Guida completa ai KPI e metriche essenziali per hotel"
        faq={faqData}
      />
      <LandingPageTracker slug="kpi-metriche-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BarChart3 className="h-16 w-16 text-primary-blue mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              KPI e Metriche Essenziali per il Tuo Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Scopri i Key Performance Indicators fondamentali per monitorare e ottimizzare le performance del tuo
              hotel. Dati precisi per decisioni vincenti.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Analisi KPI Gratuita
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main KPIs */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">I KPI Fondamentali</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Le metriche che ogni hotel manager deve monitorare quotidianamente per massimizzare i ricavi
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <DollarSign className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">RevPAR</h3>
              <p className="text-sm text-muted-foreground mb-4">Revenue Per Available Room</p>
              <p className="text-muted-foreground mb-4">
                Il KPI più importante: misura il ricavo per camera disponibile. Formula: ADR × Occupazione
              </p>
              <div className="bg-primary-blue/10 rounded p-4">
                <p className="text-sm font-mono text-foreground">RevPAR = Ricavi Camere ÷ Camere Disponibili</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">ADR</h3>
              <p className="text-sm text-muted-foreground mb-4">Average Daily Rate</p>
              <p className="text-muted-foreground mb-4">
                Tariffa media giornaliera: indica il prezzo medio delle camere vendute
              </p>
              <div className="bg-primary-blue/10 rounded p-4">
                <p className="text-sm font-mono text-foreground">ADR = Ricavi Camere ÷ Camere Vendute</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Activity className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Occupazione</h3>
              <p className="text-sm text-muted-foreground mb-4">Occupancy Rate</p>
              <p className="text-muted-foreground mb-4">Percentuale di camere vendute rispetto alle disponibili</p>
              <div className="bg-primary-blue/10 rounded p-4">
                <p className="text-sm font-mono text-foreground">OCC = (Camere Vendute ÷ Disponibili) × 100</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <PieChart className="h-12 w-12 text-yellow mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">TRevPAR</h3>
              <p className="text-sm text-muted-foreground mb-4">Total Revenue Per Available Room</p>
              <p className="text-muted-foreground mb-4">
                RevPAR evoluto: include tutti i ricavi (camere, F&B, spa, servizi)
              </p>
              <div className="bg-yellow/10 rounded p-4">
                <p className="text-sm font-mono text-foreground">TRevPAR = Ricavi Totali ÷ Camere Disponibili</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <LineChart className="h-12 w-12 text-yellow mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">GOP</h3>
              <p className="text-sm text-muted-foreground mb-4">Gross Operating Profit</p>
              <p className="text-muted-foreground mb-4">Profitto operativo lordo: misura la redditività effettiva</p>
              <div className="bg-yellow/10 rounded p-4">
                <p className="text-sm font-mono text-foreground">GOP = Ricavi Totali - Costi Operativi</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Target className="h-12 w-12 text-yellow mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">LOS</h3>
              <p className="text-sm text-muted-foreground mb-4">Length of Stay</p>
              <p className="text-muted-foreground mb-4">
                Durata media del soggiorno: fondamentale per previsioni e strategie
              </p>
              <div className="bg-yellow/10 rounded p-4">
                <p className="text-sm font-mono text-foreground">LOS = Totale Notti ÷ Numero Prenotazioni</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Metrics */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Metriche Avanzate</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                metric: "NRevPAR",
                name: "Net Revenue Per Available Room",
                description: "RevPAR netto dopo commissioni OTA e costi di distribuzione",
              },
              {
                metric: "RGI",
                name: "Revenue Generation Index",
                description: "Performance relativa rispetto al competitive set (RevPAR Hotel / RevPAR Mercato × 100)",
              },
              {
                metric: "RevPOR",
                name: "Revenue Per Occupied Room",
                description: "Ricavo totale per camera occupata, include tutti i servizi ancillari",
              },
              {
                metric: "CPOR",
                name: "Cost Per Occupied Room",
                description: "Costo operativo per camera occupata, essenziale per calcolare margini",
              },
              {
                metric: "Pickup",
                name: "Booking Pace",
                description: "Velocità di acquisizione prenotazioni rispetto a periodi precedenti",
              },
              {
                metric: "Cancellation Rate",
                name: "Tasso di Cancellazione",
                description: "Percentuale prenotazioni cancellate, importante per overbooking strategy",
              },
            ].map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-md border border-border">
                <h3 className="text-xl font-bold text-primary-blue mb-2">{item.metric}</h3>
                <p className="text-sm font-semibold text-card-foreground mb-2">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monitoring Dashboard */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Dashboard di Monitoraggio</h2>
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border border-primary-blue/20">
            <h3 className="text-2xl font-bold text-foreground mb-6">Con SANTADDEO hai tutto sotto controllo</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-card-foreground mb-3">Monitoraggio Real-time:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Dashboard interattive con tutti i KPI in tempo reale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Grafici trend storici e comparazioni con periodi precedenti</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Alert automatici quando i KPI escono dai range ottimali</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Report automatizzati giornalieri, settimanali e mensili</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-card-foreground mb-3">Analytics Avanzate:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Forecast automatico basato su dati storici e trend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Segmentazione clienti per provenienza, canale e comportamento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Analisi competitiva con benchmark di mercato</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Suggerimenti AI per ottimizzazione pricing e strategie</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Best Practice per Monitoraggio KPI</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">Frequenza</h3>
              <p className="text-sm opacity-90">
                Monitora KPI primari (RevPAR, ADR, OCC) quotidianamente. KPI secondari settimanalmente. TRevPAR e GOP
                mensilmente.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">Benchmark</h3>
              <p className="text-sm opacity-90">
                Confronta sempre i tuoi KPI con il competitive set e i dati dell'anno precedente per contestualizzare le
                performance.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">Azione</h3>
              <p className="text-sm opacity-90">
                I KPI devono guidare decisioni concrete: ajusta pricing, cambia strategie di distribuzione, ottimizza
                operazioni.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Vuoi Ottimizzare i KPI del Tuo Hotel?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita dei tuoi KPI attuali. Ti mostreremo dove puoi migliorare e come aumentare i
            ricavi.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Analisi KPI Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
