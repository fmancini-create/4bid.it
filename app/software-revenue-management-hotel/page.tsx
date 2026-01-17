import Link from "next/link"
import { Bot, Brain, TrendingUp, Zap, Globe, CheckCircle2, BarChart3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Software Revenue Management Hotel | Soluzioni RMS Professionali | 4BID.IT",
  description:
    "Software Revenue Management per hotel con AI, dynamic pricing e analytics avanzati. Ottimizza tariffe, massimizza RevPAR e aumenta i ricavi con il nostro RMS intelligente.",
  keywords:
    "software revenue management hotel, RMS hotel, sistema revenue management, software alberghiero, dynamic pricing hotel, gestionale hotel, revenue management system",
  alternates: {
    canonical: "https://4bid.it/software-revenue-management-hotel",
  },
}

export default function SoftwareRevenueManagementHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="SoftwareApplication"
        title="Software Revenue Management Hotel"
        description="Software Revenue Management per hotel con AI, dynamic pricing e analytics avanzati. Ottimizza tariffe, massimizza RevPAR e aumenta i ricavi."
        url="https://4bid.it/software-revenue-management-hotel"
        softwareCategory="BusinessApplication"
        operatingSystem="Web"
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Software Revenue Management Hotel", url: "https://4bid.it/software-revenue-management-hotel" },
        ]}
      />
      <LandingPageTracker slug="software-revenue-management-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Bot className="h-16 w-16 text-primary-blue" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Software Revenue Management per Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Sistemi RMS intelligenti che ottimizzano automaticamente le tariffe del tuo hotel, aumentano il RevPAR e
              massimizzano i ricavi attraverso AI avanzata e analytics predittivi.
            </p>
            {/* Updated In Sintesi section */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto border border-border/50 text-left">
              <p className="text-sm font-semibold text-primary-blue mb-3">In sintesi:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Automazione pricing e controllo coerenza tra canali di vendita</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Forecast e scenari per supportare decisioni operative quotidiane</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>RMS progettato per strutture italiane, con configurazione semplice</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Consulenza Gratuita
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

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">
            Perché Serve un Software Revenue Management
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Un RMS professionale automatizza decisioni complesse e ottimizza i ricavi 24/7
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <TrendingUp className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Aumento RevPAR +25-40%</h3>
              <p className="text-muted-foreground">
                Ottimizzazione automatica delle tariffe in base alla domanda reale porta a incrementi misurabili di
                RevPAR e fatturato complessivo.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Zap className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Automazione Totale</h3>
              <p className="text-muted-foreground">
                Il sistema gestisce automaticamente prezzi, restrizioni e inventory su tutti i canali, eliminando ore di
                lavoro manuale quotidiano.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Brain className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Decisioni Data-Driven</h3>
              <p className="text-muted-foreground">
                L'AI analizza milioni di dati (meteo, eventi, competitor, trend) per prendere decisioni ottimali basate
                su logica e non intuito.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Globe className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Gestione Multi-Canale</h3>
              <p className="text-muted-foreground">
                Sincronizza prezzi e disponibilità su Booking, Expedia e tutti gli OTA in tempo reale, evitando
                overbooking e rate parity issues.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <BarChart3 className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Forecast Accurato</h3>
              <p className="text-muted-foreground">
                Previsioni di occupazione e fatturato con precisione 90%+ per pianificare staffing, approvvigionamenti e
                strategie commerciali.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Users className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Competitive Intelligence</h3>
              <p className="text-muted-foreground">
                Monitora costantemente i prezzi dei competitor e adatta automaticamente le tue tariffe per mantenere
                competitività e margini.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Funzionalità Essenziali di un RMS Professionale
          </h2>
          <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-blue text-white">
                  <tr>
                    <th className="text-left p-4">Funzionalità</th>
                    <th className="text-center p-4">Importanza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { feature: "Dynamic Pricing", importance: "Essenziale" },
                    { feature: "Integrazione PMS", importance: "Essenziale" },
                    { feature: "Channel Manager", importance: "Essenziale" },
                    { feature: "Competitor Analysis", importance: "Alta" },
                    { feature: "Demand Forecasting", importance: "Alta" },
                    { feature: "Rate Shopping", importance: "Alta" },
                    { feature: "Inventory Management", importance: "Essenziale" },
                    { feature: "Reporting & Analytics", importance: "Essenziale" },
                    { feature: "Mobile App", importance: "Media" },
                    { feature: "API Integration", importance: "Alta" },
                  ].map((item, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                          <span className="font-medium">{item.feature}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            item.importance === "Essenziale"
                              ? "bg-primary-blue/10 text-primary-blue"
                              : item.importance === "Alta"
                                ? "bg-yellow/10 text-yellow"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.importance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SANTADDEO CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-12 border-2 border-primary-blue/20">
            <div className="flex items-center gap-4 mb-6">
              <Bot className="h-16 w-16 text-primary-blue" />
              <div>
                <h2 className="text-3xl font-bold text-foreground">SANTADDEO: Il Nostro RMS Innovativo</h2>
                <p className="text-muted-foreground">The Human Revenue Manager</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              SANTADDEO è il primo software di Revenue Management con AI trasparente. A differenza degli RMS "black
              box", SANTADDEO spiega ogni decisione di pricing e ti permette di personalizzare i pesi delle variabili
              secondo la tua strategia.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Explainable AI:</strong> Comprendi ogni scelta
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Personalizzabile:</strong> Adattato alla tua struttura
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Performance Based:</strong> Paghi solo sui risultati
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Made in Italy:</strong> Supporto diretto in italiano
                </span>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Link href="/progetti/santaddeo">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Scopri SANTADDEO
                </Button>
              </Link>
              <Link href="/software-revenue-management-santaddeo">
                <Button size="lg" variant="outline">
                  Dettagli Tecnici
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Calcolo ROI Indicativo</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Stima conservativa dell'impatto di un RMS professionale sui ricavi del tuo hotel
          </p>
          <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-xl p-8 border border-border">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-primary-blue/5 rounded-lg p-6">
                  <p className="text-sm text-muted-foreground mb-2">Fatturato Annuo Attuale</p>
                  <p className="text-3xl font-bold text-primary-blue">€500.000</p>
                </div>
                <div className="bg-yellow/5 rounded-lg p-6">
                  <p className="text-sm text-muted-foreground mb-2">Incremento RevPAR Medio</p>
                  <p className="text-3xl font-bold text-yellow">+28%</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-blue to-blue-grey text-white rounded-lg p-6">
                <p className="text-sm opacity-90 mb-2">Incremento Fatturato Annuo Stimato</p>
                <p className="text-4xl font-bold">+€140.000</p>
                <p className="text-sm opacity-75 mt-2">Risultati basati su case studies reali</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm text-muted-foreground">ROI raggiunto in 3-6 mesi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm text-muted-foreground">Payback period: 4-8 mesi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto a Implementare un RMS Professionale?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Richiedi una consulenza gratuita per scoprire quale software Revenue Management si adatta meglio alle
            esigenze del tuo hotel.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/#contact">
              <Button size="lg" variant="secondary" className="bg-white text-primary-blue hover:bg-white/90">
                Richiedi Consulenza Gratuita
              </Button>
            </Link>
            <Link href="/progetti/santaddeo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                Scopri SANTADDEO
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
