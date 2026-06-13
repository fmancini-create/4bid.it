import Link from "next/link"
import { TrendingUp, Target, Calendar, BarChart3, CheckCircle2, Clock, PieChart, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Forecast e Budgeting Hotel | Previsioni Revenue Management | 4BID.IT",
  description:
    "Servizi professionali di forecast e budgeting per hotel. Previsioni accurate di occupazione, ADR e revenue con analisi predittiva avanzata per massimizzare i risultati.",
  keywords:
    "forecast hotel, budgeting alberghiero, previsioni revenue, budget hotel, pianificazione finanziaria hotel, forecasting occupazione",
  openGraph: {
    title: "Forecast e Budgeting Hotel | Previsioni Revenue Management | 4BID.IT",
    description: "Previsioni accurate e pianificazione finanziaria strategica per il tuo hotel.",
    url: "https://www.4bid.it/forecast-budgeting-hotel",
    type: "website",
  },
  alternates: {
    canonical: "https://www.4bid.it/forecast-budgeting-hotel",
  },
}

const faqData = [
  {
    question: "Cos'è il forecast nel revenue management alberghiero?",
    answer:
      "Il forecast è la previsione della domanda futura basata su dati storici, trend di mercato, eventi e altri fattori. Permette di anticipare occupazione, ADR e RevPAR per prendere decisioni strategiche su pricing, staffing e inventory.",
  },
  {
    question: "Qual è l'accuratezza delle previsioni di forecast?",
    answer:
      "I nostri forecast hanno un'accuratezza media del 92% rispetto ai risultati effettivi, con uno scostamento budget vs actual di ±3%. L'orizzonte previsionale copre 12 mesi.",
  },
  {
    question: "Quali KPI vengono previsti nel forecast hotel?",
    answer:
      "I principali KPI previsti sono: Occupancy Rate, ADR (Average Daily Rate), RevPAR, Booking Pace, Revenue Totale per periodo e segmento, Pickup Analysis e GOP (Gross Operating Profit).",
  },
]

export default function ForecastBudgetingHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Forecast e Budgeting Hotel"
        description="Previsioni accurate e pianificazione finanziaria per hotel"
        faq={faqData}
      />
      <LandingPageTracker slug="forecast-budgeting-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Forecast e Budgeting Professionale per Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Previsioni accurate e pianificazione finanziaria strategica per il tuo hotel. Anticipa la domanda,
              ottimizza le risorse e massimizza i risultati con analisi predittiva avanzata.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Analisi Forecast
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Importanza del Forecast */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Perché il Forecast è Fondamentale</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Un forecast accurato ti permette di prendere decisioni strategiche basate sui dati, ottimizzare le risorse e
            anticipare la domanda di mercato
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Calendar className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Pianificazione Strategica</h3>
              <p className="text-muted-foreground">
                Anticipa la domanda per periodi futuri e pianifica pricing, staffing e inventory con largo anticipo
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <PieChart className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Ottimizzazione Budget</h3>
              <p className="text-muted-foreground">
                Alloca le risorse in modo efficiente basandoti su previsioni realistiche di revenue e occupazione
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <LineChart className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Decisioni Data-Driven</h3>
              <p className="text-muted-foreground">
                Prendi decisioni strategiche basate su analisi predittive e non su intuizioni o esperienze passate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metodologia */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">La Nostra Metodologia di Forecasting</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Analisi Storica</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Dati Storici Multi-Anno</p>
                    <p className="text-sm text-muted-foreground">
                      Analisi di occupazione, ADR e RevPAR degli ultimi 3-5 anni per identificare pattern e trend
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Segmentazione Mercato</p>
                    <p className="text-sm text-muted-foreground">
                      Studio del comportamento per segmento (business, leisure, gruppi) e canale di distribuzione
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Eventi e Stagionalità</p>
                    <p className="text-sm text-muted-foreground">
                      Mappatura di eventi ricorrenti, fiere, festività e periodi di alta/bassa stagione
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Previsioni Future</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Modelli Predittivi</p>
                    <p className="text-sm text-muted-foreground">
                      Utilizzo di algoritmi di machine learning per previsioni accurate di domanda e pricing ottimale
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Analisi Competitiva</p>
                    <p className="text-sm text-muted-foreground">
                      Monitoraggio continuo dei competitor per anticipare movimenti di mercato e strategie pricing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Scenari Multiple</p>
                    <p className="text-sm text-muted-foreground">
                      Forecast ottimistico, realistico e pessimistico per pianificare strategie in ogni scenario
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Forecast */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">KPI e Metriche di Forecast</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Monitoriamo e prevediamo tutte le metriche essenziali per il successo del tuo hotel
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                metric: "Occupancy Rate",
                description: "Previsione accurata del tasso di occupazione per ogni periodo",
              },
              {
                metric: "ADR (Average Daily Rate)",
                description: "Forecast della tariffa media giornaliera ottimale",
              },
              {
                metric: "RevPAR",
                description: "Revenue per camera disponibile previsto e target da raggiungere",
              },
              {
                metric: "Booking Pace",
                description: "Velocità di prenotazione confrontata con periodi analoghi",
              },
              {
                metric: "Revenue Totale",
                description: "Previsione revenue complessivo per periodo e per segmento",
              },
              {
                metric: "Pickup Analysis",
                description: "Analisi dell'andamento prenotazioni rispetto al forecast",
              },
              {
                metric: "Budget vs Actual",
                description: "Confronto continuo tra budget pianificato e risultati effettivi",
              },
              {
                metric: "GOP Forecast",
                description: "Previsione del profitto operativo lordo",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <BarChart3 className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{item.metric}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Budgeting Process */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Processo di Budgeting</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-5xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-3">Analisi Storica</h3>
              <p className="text-sm opacity-90">
                Raccolta e analisi dei dati storici degli ultimi anni per identificare trend e pattern ricorrenti
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-5xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-3">Forecast Dettagliato</h3>
              <p className="text-sm opacity-90">
                Creazione di forecast mensili e settimanali per ogni KPI chiave con scenari multipli
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-5xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-3">Budget Finale</h3>
              <p className="text-sm opacity-90">
                Definizione del budget annuale con obiettivi chiari, misurabili e raggiungibili per ogni reparto
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Cosa Ricevi</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border-2 border-primary-blue/20">
              <Clock className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Forecast Mensile</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Previsioni dettagliate per i prossimi 12 mesi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Dashboard interattiva con KPI principali</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Analisi pickup settimanale vs forecast</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Aggiornamenti in tempo reale</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 rounded-2xl p-8 border-2 border-yellow/20">
              <Target className="h-12 w-12 text-yellow mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Budget Annuale</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Piano finanziario completo per l'anno</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Obiettivi chiari per ogni reparto</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Scenari ottimistico, realistico, pessimistico</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Report budget vs actual mensile</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <TrendingUp className="h-16 w-16 text-primary-blue mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-foreground mb-6">Accuratezza delle Previsioni</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            I nostri forecast hanno un'accuratezza media del 92% rispetto ai risultati effettivi, permettendoti di
            pianificare con fiducia
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <p className="text-5xl font-bold text-primary-blue mb-2">92%</p>
              <p className="text-sm text-muted-foreground">Accuratezza Forecast</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <p className="text-5xl font-bold text-primary-blue mb-2">±3%</p>
              <p className="text-sm text-muted-foreground">Scostamento Budget vs Actual</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <p className="text-5xl font-bold text-primary-blue mb-2">12 mesi</p>
              <p className="text-sm text-muted-foreground">Orizzonte Previsionale</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Inizia a Pianificare il Futuro del Tuo Hotel</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita. Ti prepareremo un forecast di esempio per mostrarti il potenziale della tua
            struttura.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Forecast Gratuito
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
