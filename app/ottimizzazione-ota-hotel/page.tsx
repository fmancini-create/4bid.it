import Link from "next/link"
import { TrendingUp, Target, CheckCircle2, AlertCircle, BarChart3, Percent, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Ottimizzazione OTA Hotel | Riduci Commissioni e Aumenta Visibilità | 4BID.IT",
  description:
    "Servizio di ottimizzazione OTA per hotel. Riduci le commissioni fino al 40%, aumenta la visibilità su Booking, Expedia e altri portali. Strategia channel management efficace.",
  keywords:
    "ottimizzazione OTA hotel, gestione booking.com, ridurre commissioni OTA, channel management hotel, visibilità portali turistici, strategia OTA",
}

export default function OttimizzazioneOTAPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="ottimizzazione-ota-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">Ottimizzazione OTA per Hotel</h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Riduci le commissioni fino al 40% e aumenta la visibilità del tuo hotel su Booking.com, Expedia e altri
              portali. Strategia OTA efficace per massimizzare profitti e prenotazioni.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Analisi OTA Gratuita
                </Button>
              </Link>
              <Link href="/strategie-prenotazioni-dirette-hotel">
                <Button size="lg" variant="outline">
                  Direct Booking Strategy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-destructive/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-lg border-2 border-destructive/20">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-4">Il Problema delle Commissioni OTA</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Le OTA (Online Travel Agencies) sono essenziali per la visibilità, ma le commissioni del 15-25% erodono
                drasticamente i margini. Molti hotel dipendono troppo dalle OTA, pagando commissioni eccessive e
                perdendo il controllo sulla relazione con i clienti.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-destructive/10 rounded-lg p-4">
                  <p className="font-bold text-foreground mb-2">Commissione Media OTA</p>
                  <p className="text-3xl font-bold text-destructive">18-22%</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-4">
                  <p className="font-bold text-foreground mb-2">Perdita Annua Tipica</p>
                  <p className="text-3xl font-bold text-destructive">€45.000+</p>
                  <p className="text-sm text-muted-foreground">per hotel 30 camere</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">La Nostra Strategia di Ottimizzazione</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Un approccio integrato per ridurre le commissioni OTA mantenendo e aumentando le prenotazioni totali
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Channel Mix Ottimale</h3>
              <p className="text-muted-foreground mb-4">
                Bilanciamento strategico tra OTA, direct booking e altri canali per massimizzare profitti e ridurre
                dipendenza.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Analisi del mix di canali attuale</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Definizione target per ogni canale</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Monitoraggio e ottimizzazione continua</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Percent className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Negoziazione Commissioni</h3>
              <p className="text-muted-foreground mb-4">
                Riduzione delle commissioni OTA attraverso negoziazione strategica e programmi di incentivazione.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Valutazione delle condizioni attuali</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Negoziazione con account manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Accesso a programmi speciali</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Visibilità Massima</h3>
              <p className="text-muted-foreground mb-4">
                Ottimizzazione della presenza su OTA per massimizzare ranking, recensioni e tasso di conversione.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>SEO interno delle OTA principali</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Gestione recensioni e rating</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Ottimizzazione foto e descrizioni</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OTA Specific Strategies */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Strategie per Ogni OTA Principale</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-md border border-border">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Booking.com</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Genius Program:</strong> sfruttare sconti Genius per aumentare visibilità
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Preferred Partner:</strong> accedere al programma per commissioni ridotte
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Mobile Rate:</strong> strategie per tassi di conversione mobile più alti
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Visibility Booster:</strong> utilizzo strategico di promozioni temporanee
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-md border border-border">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Expedia Group</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Expedia Collect:</strong> gestione strategica dei pagamenti
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>TripAdvisor Integration:</strong> sinergia recensioni e prenotazioni
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Hotels.com Rewards:</strong> ottimizzare programma fedeltà
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>EPIC Deals:</strong> promozioni strategiche per alta stagione
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-md border border-border">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Airbnb</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Superhost Status:</strong> mantenimento standard per visibilità extra
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Smart Pricing:</strong> ottimizzazione algoritmo prezzi dinamici
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Instant Book:</strong> strategia per prenotazioni immediate
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-md border border-border">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Altri Canali</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Google Hotel Ads:</strong> commission per acquisizione diretta
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Metasearch:</strong> Trivago, Kayak, TripAdvisor per visibilità
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Niche OTA:</strong> canali specializzati per target specifici
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Results & Case Study */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Risultati Reali di Ottimizzazione OTA
          </h2>
          <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 max-w-4xl mx-auto border-2 border-primary-blue/20">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Hotel Boutique - Firenze</h3>
                <p className="text-muted-foreground mb-4">
                  Resort 4 stelle con 45 camere nel centro storico. Alta dipendenza da Booking.com (78% prenotazioni)
                  con commissione media 19%.
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Situazione iniziale:</strong> 78% OTA, 22% Direct
                  </p>
                  <p className="text-sm">
                    <strong>Dopo 12 mesi:</strong> 55% OTA, 45% Direct
                  </p>
                  <p className="text-sm">
                    <strong>Commissione media ridotta:</strong> da 19% a 12%
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Riduzione Commissioni</p>
                  <p className="text-3xl font-bold text-primary-blue">-37%</p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Risparmio Annuo</p>
                  <p className="text-3xl font-bold text-primary-blue">€38.400</p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Aumento Prenotazioni Totali</p>
                  <p className="text-3xl font-bold text-primary-blue">+18%</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-bold text-card-foreground mb-3">Azioni Implementate</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Negoziazione commissioni Booking.com da 19% a 14%</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Ottimizzazione ranking e visibilità su tutte le OTA</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Implementazione strategia Direct Booking efficace</span>
                  </p>
                </div>
                <div>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Gestione recensioni per migliorare rating da 8.2 a 9.1</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Diversificazione canali con Google Hotel Ads</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Training team su gestione multicanale</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">KPI da Monitorare</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-90" />
              <p className="text-sm mb-2 opacity-90">Channel Mix</p>
              <p className="text-2xl font-bold">OTA vs Direct</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Percent className="h-10 w-10 mx-auto mb-3 opacity-90" />
              <p className="text-sm mb-2 opacity-90">Commissione Media</p>
              <p className="text-2xl font-bold">Target &lt;15%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-90" />
              <p className="text-sm mb-2 opacity-90">Conversion Rate</p>
              <p className="text-2xl font-bold">Per OTA</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-90" />
              <p className="text-sm mb-2 opacity-90">Guest Score</p>
              <p className="text-2xl font-bold">Rating &gt;9.0</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Riduci le Commissioni OTA del Tuo Hotel</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita del tuo channel mix. Ti mostreremo come ridurre le commissioni mantenendo e
            aumentando le prenotazioni totali.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                Analisi OTA Gratuita
              </Button>
            </Link>
            <Link href="/progetti/santaddeo">
              <Button size="lg" variant="outline">
                Scopri SANTADDEO RMS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
