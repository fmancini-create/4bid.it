import Link from "next/link"
import { TrendingUp, Calendar, Target, Users, CheckCircle2, BarChart3, Zap, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Yield Management Hotel: Ottimizza Occupazione e RevPAR +35% | 4BID.IT",
  description:
    "Yield management professionale per hotel: gestione capacità, pricing dinamico, restrizioni LOS intelligenti, overbooking controllato. Massimizza RevPAR con strategie avanzate.",
  keywords:
    "yield management hotel, gestione capacità hotel, ottimizzazione occupazione alberghiera, yield optimization, capacity management hotel, gestione inventario camere strategica",
}

export default function YieldManagementHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="yield-management-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Yield Management per Hotel: Massimizza Occupazione e Ricavi
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Ottimizza la gestione della capacità del tuo hotel con strategie avanzate di Yield Management. Vendi la
              camera giusta, al cliente giusto, al momento giusto, al prezzo giusto.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Consulenza Gratuita
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO Yield System
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">+35% Ricavi</h3>
              <p className="text-muted-foreground">
                Aumenta i ricavi fino al 35% ottimizzando il mix tra occupazione e tariffa media con strategie di yield
                management.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Zap className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Decisioni Real-Time</h3>
              <p className="text-muted-foreground">
                Adatta tariffe e disponibilità in tempo reale in base a domanda, eventi, meteo e comportamento
                competitivo.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Metodologia Consolidata</h3>
              <p className="text-muted-foreground">
                Applichiamo le best practice di Yield Management utilizzate dalle principali catene alberghiere
                internazionali.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is Yield Management */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-foreground mb-6">Cos'è il Yield Management?</h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Il Yield Management è una strategia di pricing dinamico che ottimizza i ricavi gestendo l'inventario di
              camere in base alla domanda prevista
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-xl p-8 border border-border">
                <Calendar className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-3">Gestione Inventario</h3>
                <p className="text-muted-foreground mb-4">
                  Il Yield Management ti permette di allocare le camere in modo ottimale tra diversi segmenti di mercato
                  e canali distributivi.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Restrizioni di soggiorno minimo (MinLOS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Close to Arrival/Departure strategici</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Overbooking controllato e sicuro</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card rounded-xl p-8 border border-border">
                <BarChart3 className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-3">Pricing Dinamico</h3>
                <p className="text-muted-foreground mb-4">
                  Le tariffe vengono adattate continuamente in base a molteplici fattori per massimizzare il RevPAR
                  giornaliero.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Analisi domanda storica e forecast</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Monitoraggio competizione in tempo reale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Ottimizzazione per segmento e canale</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Yield Management Strategies */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Strategie di Yield Management</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tecniche avanzate per ottimizzare la performance del tuo hotel
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Forecasting Domanda",
                description:
                  "Previsioni accurate della domanda futura basate su dati storici, eventi, trend e stagionalità",
              },
              {
                title: "Segmentazione Mercato",
                description: "Identificazione e targetizzazione dei segmenti più profittevoli per il tuo hotel",
              },
              {
                title: "Price Optimization",
                description:
                  "Determinazione del prezzo ottimale per massimizzare revenue in base a domanda e competizione",
              },
              {
                title: "Capacity Control",
                description: "Gestione restrizioni booking (MinLOS, CTA, CTD) per proteggere periodi ad alta domanda",
              },
              {
                title: "Overbooking Strategy",
                description: "Overbooking controllato per compensare no-show e cancellazioni senza rischi",
              },
              {
                title: "Last Minute Tactics",
                description: "Strategie specifiche per vendere l'inventario residuo nei giorni a ridosso dell'arrivo",
              },
            ].map((strategy, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <Target className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{strategy.title}</h3>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            KPI Fondamentali del Yield Management
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                metric: "RevPAR",
                description: "Revenue Per Available Room",
                formula: "ADR × Occupazione",
              },
              {
                metric: "ADR",
                description: "Average Daily Rate",
                formula: "Ricavi camere / Camere vendute",
              },
              {
                metric: "Occupazione",
                description: "Tasso di occupazione",
                formula: "Camere vendute / Camere disponibili",
              },
              {
                metric: "Yield %",
                description: "Yield Percentage",
                formula: "RevPAR attuale / RevPAR potenziale",
              },
            ].map((kpi, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border text-center">
                <h3 className="text-2xl font-bold text-primary-blue mb-2">{kpi.metric}</h3>
                <p className="text-sm text-card-foreground font-semibold mb-2">{kpi.description}</p>
                <p className="text-xs text-muted-foreground">{kpi.formula}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <Users className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Risultati Misurabili</h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
            I nostri clienti ottengono incrementi significativi di RevPAR e profittabilità applicando strategie di Yield
            Management
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+35%</p>
              <p className="text-sm">RevPAR incrementato</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+20%</p>
              <p className="text-sm">ADR ottimizzato</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+12%</p>
              <p className="text-sm">Occupazione media</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Implementa il Yield Management nel Tuo Hotel</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una consulenza gratuita. Analizzeremo il tuo hotel e ti mostreremo come ottimizzare capacità e
            tariffe per massimizzare i ricavi.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Consulenza Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
