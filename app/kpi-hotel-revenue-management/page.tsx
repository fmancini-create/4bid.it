import Link from "next/link"
import { BarChart3, TrendingUp, Target, AlertTriangle, CheckCircle2, Calendar, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "KPI Hotel Revenue Management: Monitora Performance e Massimizza Ricavi | 4BID.IT",
  description:
    "Scopri i KPI essenziali del Revenue Management hotel: RevPAR, ADR, RGI, Pickup. Dashboard real-time, alert automatici e decisioni data-driven per ottimizzare i ricavi.",
  keywords:
    "KPI revenue management, KPI hotel, RevPAR, RGI, pickup rate, ADR optimization, metriche revenue management, dashboard hotel, performance hotel",
}

export default function KPIHotelRevenueManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="kpi-hotel-revenue-management" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BarChart3 className="h-16 w-16 text-primary-blue mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              KPI Revenue Management: Dati che Generano Ricavi
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Monitora i KPI giusti, al momento giusto, con gli strumenti giusti. Trasforma i dati in decisioni che
              aumentano RevPAR e profitti.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Setup Dashboard KPI Gratuito
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Vedi SANTADDEO Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-6 mb-12">
              <div className="flex gap-4">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Il 73% degli hotel monitora i KPI sbagliati
                  </h3>
                  <p className="text-muted-foreground">
                    Occupazione alta ma ricavi bassi? ADR in crescita ma margini in calo? I KPI tradizionali non bastano
                    più. Serve un sistema integrato che connetta metriche operative a risultati finanziari.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Management KPIs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">I 7 KPI del Revenue Manager</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Le metriche che i revenue manager professionisti controllano ogni giorno
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <Target className="h-10 w-10 text-primary-blue" />
                <span className="bg-primary-blue/10 text-primary-blue text-xs font-bold px-3 py-1 rounded-full">
                  #1
                </span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">RevPAR Index (RGI)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                La metrica più importante: misura la tua performance relativa al mercato. RGI 100 = pari al mercato, 120
                = +20% vs competitori.
              </p>
              <div className="bg-primary-blue/10 rounded p-3">
                <p className="text-xs font-mono text-foreground">RGI = (Tuo RevPAR / CompSet RevPAR) × 100</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <TrendingUp className="h-10 w-10 text-primary-blue" />
                <span className="bg-primary-blue/10 text-primary-blue text-xs font-bold px-3 py-1 rounded-full">
                  #2
                </span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Pickup Rate</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Velocità di acquisizione prenotazioni. Confronta pickup attuale vs stesso periodo anno scorso per
                anticipare trend.
              </p>
              <div className="bg-primary-blue/10 rounded p-3">
                <p className="text-xs font-mono text-foreground">Pickup = Pren. Oggi - Pren. 7gg fa</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <Calendar className="h-10 w-10 text-primary-blue" />
                <span className="bg-primary-blue/10 text-primary-blue text-xs font-bold px-3 py-1 rounded-full">
                  #3
                </span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Booking Window</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Quanto tempo prima prenotano i clienti. Fondamentale per pricing dinamico e forecast accuracy.
              </p>
              <div className="bg-primary-blue/10 rounded p-3">
                <p className="text-xs font-mono text-foreground">BW = Data Check-in - Data Prenotazione</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <Users className="h-10 w-10 text-yellow" />
                <span className="bg-yellow/10 text-yellow text-xs font-bold px-3 py-1 rounded-full">#4</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Segment Mix</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Distribuzione ricavi per segmento (leisure, corporate, gruppi). Ottimizza il mix per massimizzare
                TRevPAR.
              </p>
              <div className="bg-yellow/10 rounded p-3">
                <p className="text-xs font-mono text-foreground">Mix% = Ricavi Segmento / Ricavi Totali</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <Zap className="h-10 w-10 text-yellow" />
                <span className="bg-yellow/10 text-yellow text-xs font-bold px-3 py-1 rounded-full">#5</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Conversion Rate</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Percentuale visite sito che si trasformano in prenotazioni. Indica efficacia pricing e user experience.
              </p>
              <div className="bg-yellow/10 rounded p-3">
                <p className="text-xs font-mono text-foreground">CR = (Prenotazioni / Visite) × 100</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <BarChart3 className="h-10 w-10 text-yellow" />
                <span className="bg-yellow/10 text-yellow text-xs font-bold px-3 py-1 rounded-full">#6</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Net RevPAR</h3>
              <p className="text-sm text-muted-foreground mb-3">
                RevPAR al netto di commissioni OTA e costi distribuzione. Il vero indicatore di profittabilità.
              </p>
              <div className="bg-yellow/10 rounded p-3">
                <p className="text-xs font-mono text-foreground">NRevPAR = RevPAR - Commissioni</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard System */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Sistema Dashboard SANTADDEO</h2>
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border border-primary-blue/20">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Monitoraggio Real-Time</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Dashboard con tutti i KPI aggiornati ogni ora</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Alert automatici quando RGI scende sotto soglia critica</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Grafici pickup vs forecast per anticipare problemi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Comparazioni YoY, MoM, WoW automatiche</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Analytics Predittive</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Forecast RevPAR basato su trend pickup e booking window</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Simulazione impatto pricing su Net RevPAR</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Analisi segment mix ottimale per periodo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Raccomandazioni AI su azioni correttive</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
              <h2 className="text-3xl font-bold text-card-foreground mb-6">
                Case Study: Hotel 4★ Firenze - Dashboard KPI
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-bold text-card-foreground mb-3">Situazione Iniziale:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Monitoraggio KPI manuale su Excel</li>
                    <li>• Dati aggiornati con 2-3 giorni di ritardo</li>
                    <li>• RGI non tracciato (no dati competitivi)</li>
                    <li>• Decisioni pricing basate su "sensazione"</li>
                    <li>• Net RevPAR sconosciuto</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-card-foreground mb-3">Con SANTADDEO:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Dashboard real-time accessibile H24</li>
                    <li>• Alert automatici su pickup anomalo</li>
                    <li>• RGI monitorato vs 5 competitori diretti</li>
                    <li>• Decisioni data-driven su pricing</li>
                    <li>• Net RevPAR ottimizzato riducendo OTA</li>
                  </ul>
                </div>
              </div>
              <div className="bg-primary-blue/10 rounded-xl p-6">
                <h4 className="font-bold text-foreground mb-4">Risultati 12 mesi:</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary-blue">+28%</p>
                    <p className="text-sm text-muted-foreground">RevPAR</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary-blue">RGI 118</p>
                    <p className="text-sm text-muted-foreground">da 94 a 118</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary-blue">+€67k</p>
                    <p className="text-sm text-muted-foreground">Net Revenue/anno</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Setup Dashboard KPI Gratuito</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ti configuriamo una dashboard KPI personalizzata gratuitamente. Vedrai subito dove stai perdendo ricavi e
            come recuperarli.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Setup Gratuito
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
