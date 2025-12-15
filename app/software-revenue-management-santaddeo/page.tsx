import Image from "next/image"
import Link from "next/link"
import { Bot, Brain, TrendingUp, Zap, Globe, CheckCircle2, Euro, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"

export const metadata = {
  title: "SANTADDEO - Software Revenue Management Hotel AI | 4BID.IT",
  description:
    "SANTADDEO: il primo software di Revenue Management con AI trasparente che spiega ogni decisione di pricing. Sistema intelligente per hotel che combina algoritmi avanzati e logica umana.",
  keywords:
    "software revenue management, RMS hotel, revenue management AI, pricing dinamico hotel, SANTADDEO, gestionale hotel, software alberghiero",
}

export default function SoftwareRevenueManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Bot className="h-12 w-12 text-primary-blue" />
                <h1 className="text-5xl font-bold text-foreground">SANTADDEO</h1>
              </div>
              <p className="text-2xl text-muted-foreground mb-4">The Human Revenue Manager</p>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
                Il primo software di Revenue Management con AI trasparente che spiega ogni decisione di pricing.
                Personalizza i pesi delle variabili e comprendi ogni scelta strategica.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href="/#contact">
                  <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                    Richiedi Demo
                  </Button>
                </Link>
                <Link href="/progetti/santaddeo">
                  <Button size="lg" variant="outline">
                    Scopri il Progetto
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
              <Image src="/santaddeo-logo.png" alt="SANTADDEO Logo" width={400} height={150} className="mb-6 w-full" />
              <h3 className="text-2xl font-bold mb-4 text-card-foreground">Perché SANTADDEO è Diverso</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Explainable AI:</strong> ogni prezzo ha una spiegazione chiara
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Personalizzabile:</strong> configura i pesi di ogni variabile
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Zero Rischio:</strong> pagamento a performance sui risultati
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Funzionalità Innovative</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            SANTADDEO combina intelligenza artificiale avanzata con la trasparenza e il controllo che gli albergatori
            richiedono
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Brain className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">AI Trasparente</h3>
              <p className="text-muted-foreground">
                Ogni decisione di pricing è spiegata in linguaggio chiaro. Saprai sempre perché il sistema propone un
                determinato prezzo.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Settings className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Personalizzazione Totale</h3>
              <p className="text-muted-foreground">
                Regola i pesi delle variabili (meteo, eventi, domanda, OTA, ecc.) secondo le esigenze specifiche della
                tua struttura.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <TrendingUp className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Pricing Dinamico Avanzato</h3>
              <p className="text-muted-foreground">
                Ottimizzazione continua delle tariffe basata su domanda in tempo reale, stagionalità, competitor e trend
                di mercato.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Globe className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Integrazione Globale</h3>
              <p className="text-muted-foreground">
                Compatibile con tutti i principali PMS, Channel Manager e OTA internazionali. Setup rapido e
                sincronizzazione automatica.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <BarChart3 className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Analytics Avanzati</h3>
              <p className="text-muted-foreground">
                Dashboard con KPI in tempo reale, report dettagliati e previsioni accurate per massimizzare RevPAR e
                ADR.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Zap className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Automazione Intelligente</h3>
              <p className="text-muted-foreground">
                Aggiornamento automatico delle tariffe su tutti i canali di distribuzione, con alert e notifiche per
                situazioni critiche.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Come Funziona SANTADDEO</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Integrazione e Setup",
                  description:
                    "Colleghiamo SANTADDEO al tuo PMS e ai tuoi canali di distribuzione. Setup completato in 48 ore.",
                },
                {
                  step: "2",
                  title: "Analisi e Apprendimento",
                  description:
                    "Il sistema analizza i dati storici della tua struttura, il mercato locale e i competitor per creare il modello di pricing ottimale.",
                },
                {
                  step: "3",
                  title: "Configurazione Personalizzata",
                  description:
                    "Definisci i pesi delle variabili secondo le tue priorità strategiche. SANTADDEO si adatta alla tua filosofia di gestione.",
                },
                {
                  step: "4",
                  title: "Ottimizzazione Continua",
                  description:
                    "L'AI monitora costantemente il mercato e aggiorna le tariffe in tempo reale, spiegando ogni decisione presa.",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-blue text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Model */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Modelli di Prezzo</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border-2 border-primary-blue/20">
              <Euro className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">SaaS Subscription</h3>
              <p className="text-muted-foreground mb-6">
                Abbonamento mensile con accesso completo a tutte le funzionalità e moduli extra personalizzabili.
              </p>
              <div className="space-y-2 mb-6">
                <p className="text-3xl font-bold text-primary-blue">€99 - €499</p>
                <p className="text-sm text-muted-foreground">al mese, in base alla dimensione della struttura</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm">Setup incluso</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm">Supporto prioritario</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm">Aggiornamenti automatici</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 rounded-2xl p-8 border-2 border-yellow/20">
              <TrendingUp className="h-12 w-12 text-yellow mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Performance Based</h3>
              <p className="text-muted-foreground mb-6">
                Nessun costo fisso. Paghi solo una percentuale sull'incremento di fatturato generato dal sistema.
              </p>
              <div className="space-y-2 mb-6">
                <p className="text-3xl font-bold text-yellow">% sui Risultati</p>
                <p className="text-sm text-muted-foreground">Zero rischio, massima resa</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow" />
                  <span className="text-sm">Nessun costo anticipato</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow" />
                  <span className="text-sm">Consulenza inclusa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow" />
                  <span className="text-sm">ROI garantito</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <Bot className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Pronto a Rivoluzionare il Revenue Management?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Richiedi una demo personalizzata di SANTADDEO e scopri come aumentare i ricavi del tuo hotel con l'AI
            trasparente.
          </p>
          <Link href="/#contact">
            <Button size="lg" variant="secondary" className="bg-white text-primary-blue hover:bg-white/90">
              Richiedi Demo Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
