import Link from "next/link"
import { TrendingUp, Target, Users, BarChart3, CheckCircle2, Euro, Clock, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Consulenza Revenue Management Hotel | 4BID.IT",
  description:
    "Servizio di consulenza Revenue Management per hotel, resort e strutture ricettive. Aumenta i ricavi del tuo hotel con strategie di pricing dinamico e ottimizzazione tariffe.",
  keywords:
    "consulenza revenue management, revenue manager hotel, consulenza alberghiera, pricing hotel, ottimizzazione tariffe hotel, revenue management Italia",
}

export default function ConsulenzaRevenueManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="consulenza-revenue-management-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Consulenza Revenue Management per Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Aumenta i ricavi del tuo hotel fino al 30% con strategie personalizzate di pricing dinamico e
              ottimizzazione tariffe. Esperti di Revenue Management al tuo servizio.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Consulenza Gratuita
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

      {/* Value Proposition */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Euro className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Zero Rischio</h3>
              <p className="text-muted-foreground">
                Paghi solo una percentuale sui risultati ottenuti. Nessun costo fisso, massima trasparenza.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Clock className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Risultati Rapidi</h3>
              <p className="text-muted-foreground">
                I primi miglioramenti sono visibili entro 30 giorni dall'implementazione delle strategie.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Esperienza Consolidata</h3>
              <p className="text-muted-foreground">
                Oltre 50 strutture gestite con successo in tutta Italia, dal boutique hotel al resort di lusso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Il Tuo Hotel Perde Ricavi?</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-destructive/10 rounded-2xl p-8 border border-destructive/20">
              <Target className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">I Problemi Comuni</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Prezzi troppo bassi rispetto alla domanda di mercato</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Tariffe statiche che non si adattano agli eventi e alle stagioni</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Commissioni OTA troppo alte e scarsa percentuale di prenotazioni dirette</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Mancanza di strategie di upselling e cross-selling efficaci</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary-blue/10 rounded-2xl p-8 border border-primary-blue/20">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">La Nostra Soluzione</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Analisi approfondita del mercato locale e della tua concorrenza</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Strategie di pricing dinamico basate su domanda, eventi e stagionalità</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Ottimizzazione della distribuzione online e gestione OTA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Formazione del team e supporto continuo per massimizzare i risultati</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">I Nostri Servizi</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Soluzioni complete di Revenue Management personalizzate per ogni tipo di struttura ricettiva
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Analisi Revenue",
                description: "Studio completo di mercato, posizionamento e opportunità di crescita",
              },
              {
                title: "Pricing Strategico",
                description: "Definizione tariffe ottimali per ogni periodo e segmento di mercato",
              },
              {
                title: "Gestione OTA",
                description: "Ottimizzazione della presenza e delle commissioni sui portali online",
              },
              {
                title: "Forecast & Budget",
                description: "Previsioni accurate e pianificazione finanziaria per il tuo hotel",
              },
              {
                title: "Formazione Staff",
                description: "Training del personale sulle best practice di Revenue Management",
              },
              {
                title: "Software Integration",
                description: "Integrazione con PMS, Channel Manager e strumenti di Business Intelligence",
              },
              {
                title: "Direct Booking",
                description: "Strategie per aumentare le prenotazioni dirette e ridurre le commissioni",
              },
              {
                title: "Reporting Mensile",
                description: "Report dettagliati con KPI, performance e azioni correttive",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <BarChart3 className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
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
            I nostri clienti ottengono risultati concreti e misurabili in termini di aumento dei ricavi e ottimizzazione
            delle performance
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+30%</p>
              <p className="text-sm">RevPAR medio</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+25%</p>
              <p className="text-sm">ADR incrementato</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+40%</p>
              <p className="text-sm">Direct Booking</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Model */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Modello di Collaborazione</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border-2 border-primary-blue/20">
              <h3 className="text-2xl font-bold text-foreground mb-4">Performance Based</h3>
              <p className="text-muted-foreground mb-6">
                Nessun costo fisso. Paghi solo una percentuale calcolata sull'incremento di fatturato generato dalla
                nostra consulenza.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm">Zero rischio per la tua struttura</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm">Massima trasparenza sui risultati</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm">Siamo motivati al tuo successo</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 rounded-2xl p-8 border-2 border-yellow/20">
              <h3 className="text-2xl font-bold text-foreground mb-4">Consulenza Tradizionale</h3>
              <p className="text-muted-foreground mb-6">
                Per progetti specifici o strutture che preferiscono un compenso fisso, offriamo anche consulenze con fee
                mensile o forfait.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow" />
                  <span className="text-sm">Budget definito e prevedibile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow" />
                  <span className="text-sm">Supporto continuativo garantito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow" />
                  <span className="text-sm">Ideale per progetti a lungo termine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Pronto a Massimizzare i Ricavi del Tuo Hotel?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una consulenza gratuita. Analizzeremo la tua struttura e ti proporremo un piano personalizzato per
            aumentare i tuoi ricavi.
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
