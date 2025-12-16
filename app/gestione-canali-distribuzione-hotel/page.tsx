import Link from "next/link"
import { Globe, TrendingUp, DollarSign, Target, CheckCircle2, BarChart3, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Gestione Canali Distribuzione Hotel | Ottimizzazione OTA | 4BID.IT",
  description:
    "Gestione strategica dei canali di distribuzione online per hotel. Ottimizza OTA, aumenta prenotazioni dirette e riduci le commissioni. Consulenza specializzata Channel Management.",
  keywords:
    "gestione canali distribuzione hotel, ottimizzazione OTA, channel manager hotel, prenotazioni dirette, commissioni booking, distribuzione online hotel",
}

export default function GestioneCanaliDistribuzioneHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="gestione-canali-distribuzione-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Gestione Strategica Canali di Distribuzione per Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Ottimizza la presenza del tuo hotel sui canali OTA, aumenta le prenotazioni dirette fino al 40% e riduci
              le commissioni. Gestione professionale della distribuzione online.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Analisi Gratuita
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

      {/* Value Proposition */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <DollarSign className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Riduci Commissioni</h3>
              <p className="text-muted-foreground">
                Diminuisci fino al 30% le commissioni OTA spostando il traffico verso canali diretti più profittevoli.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Aumenta Visibilità</h3>
              <p className="text-muted-foreground">
                Ottimizza posizionamento e ranking su tutti i canali OTA per massimizzare le prenotazioni.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Shield className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Controllo Totale</h3>
              <p className="text-muted-foreground">
                Gestisci tariffe, disponibilità e contenuti su tutti i canali da un'unica piattaforma centralizzata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            I Canali di Distribuzione Erodono i Tuoi Margini?
          </h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-destructive/10 rounded-2xl p-8 border border-destructive/20">
              <Target className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Le Sfide Comuni</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Commissioni OTA troppo elevate (15-25%) che riducono i margini</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Scarsa visibilità sui portali online e ranking basso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Gestione manuale e dispersiva di decine di canali diversi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Poche prenotazioni dirette dal sito web dell'hotel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Difficoltà nel mantenere rate parity tra i canali</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary-blue/10 rounded-2xl p-8 border border-primary-blue/20">
              <Globe className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">La Nostra Strategia</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Ottimizzazione presenza e contenuti su tutti i principali OTA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Strategie per aumentare prenotazioni dirette e ridurre commissioni</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Gestione centralizzata tariffe e disponibilità con Channel Manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Analisi performance per canale e ottimizzazione continua del mix</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Monitoraggio rate parity e gestione recensioni online</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Channels */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Canali Gestiti</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Ottimizziamo la tua presenza sui principali canali di distribuzione online
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Booking.com",
                description: "Ottimizzazione Genius, Preferred Partner e visibilità",
              },
              {
                title: "Expedia Group",
                description: "Gestione Expedia, Hotels.com, Vrbo e altri brand",
              },
              {
                title: "Google Hotel Ads",
                description: "Campagne pay-per-click e posizionamento organico",
              },
              {
                title: "Airbnb",
                description: "Ottimizzazione listing e strategia prezzi dinamici",
              },
              {
                title: "TripAdvisor",
                description: "Gestione recensioni e TripAdvisor Instant Booking",
              },
              {
                title: "Sito Web Diretto",
                description: "Strategie per aumentare conversioni e prenotazioni dirette",
              },
              {
                title: "Metasearch",
                description: "Trivago, Kayak, Skyscanner e altri comparatori",
              },
              {
                title: "GDS & Bedbanks",
                description: "Canali B2B per agenzie viaggi e tour operator",
              },
            ].map((channel, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <Globe className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{channel.title}</h3>
                <p className="text-sm text-muted-foreground">{channel.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">I Nostri Servizi</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Gestione completa della distribuzione online con focus sui risultati
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: BarChart3,
                title: "Audit Distributivo",
                description:
                  "Analisi completa del tuo mix distributivo attuale, identificazione opportunità e benchmark competitivo",
              },
              {
                icon: Target,
                title: "Strategia Multicanale",
                description:
                  "Definizione della strategia ottimale per il tuo hotel: quali canali presidiare e come allocare l'inventario",
              },
              {
                icon: DollarSign,
                title: "Pricing per Canale",
                description:
                  "Tariffe differenziate per canale in base a commissioni, audience e obiettivi di revenue management",
              },
              {
                icon: Users,
                title: "Content Optimization",
                description:
                  "Ottimizzazione descrizioni, foto, servizi e USP su tutti i canali per massimizzare conversione",
              },
              {
                icon: TrendingUp,
                title: "Performance Marketing",
                description: "Campagne Google Hotel Ads, Meta Ads e strategie SEM per aumentare prenotazioni dirette",
              },
              {
                icon: Shield,
                title: "Rate Parity Control",
                description: "Monitoraggio continuo rate parity e azioni correttive per proteggere il canale diretto",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <service.icon className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <Globe className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Risultati Concreti</h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
            Miglioramento del mix distributivo e incremento della redditività netta
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+40%</p>
              <p className="text-sm">Prenotazioni dirette</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">-30%</p>
              <p className="text-sm">Costo commissioni</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+25%</p>
              <p className="text-sm">Profitto netto</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Ottimizza la Distribuzione del Tuo Hotel</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita del tuo mix distributivo. Ti mostreremo come aumentare le prenotazioni dirette
            e ridurre le commissioni OTA.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Analisi Distributiva Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
