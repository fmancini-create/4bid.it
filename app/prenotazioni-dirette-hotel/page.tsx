import Link from "next/link"
import { TrendingUp, Users, Euro, CheckCircle2, ArrowRight, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Prenotazioni Dirette Hotel | Aumenta Direct Booking e Riduci OTA | 4BID.IT",
  description:
    "Aumenta le prenotazioni dirette del tuo hotel e riduci le commissioni OTA fino al 50%. Piano operativo per incrementare il direct booking e la redditività della tua struttura.",
  keywords:
    "prenotazioni dirette hotel, direct booking hotel, ridurre commissioni OTA, aumentare prenotazioni dirette, booking engine hotel, revenue management",
}

export default function PrenotazioniDiretteHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Prenotazioni Dirette Hotel"
        description="Guida completa per aumentare le prenotazioni dirette del tuo hotel e ridurre le commissioni OTA. Strategie, best practice e case study."
        url="https://www.4bid.it/prenotazioni-dirette-hotel"
      />
      <LandingPageTracker slug="prenotazioni-dirette-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Aumenta le Prenotazioni Dirette del Tuo Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Piano operativo per incrementare il direct booking, ridurre la dipendenza dalle OTA e aumentare la
              redditività della tua struttura ricettiva.
            </p>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto border border-border/50 text-left">
              <p className="text-sm font-semibold text-primary-blue mb-3">In sintesi:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Incrementare vendite dirette per ridurre costi di intermediazione</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Azioni pratiche: UX, offerte, fiducia, pagamenti, follow-up</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Retention: email e CRM per riacquisto e referral</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Piano Personalizzato
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Analisi gratuita del tuo booking mix attuale</p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-primary-blue mx-auto mb-4" />
              <div className="text-4xl font-bold text-foreground mb-2">+45%</div>
              <p className="text-muted-foreground">Incremento medio prenotazioni dirette</p>
            </div>
            <div className="text-center">
              <Euro className="h-12 w-12 text-primary-blue mx-auto mb-4" />
              <div className="text-4xl font-bold text-foreground mb-2">-64%</div>
              <p className="text-muted-foreground">Riduzione commissioni OTA</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-primary-blue mx-auto mb-4" />
              <div className="text-4xl font-bold text-foreground mb-2">€31K</div>
              <p className="text-muted-foreground">Risparmio medio annuo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Direct Booking */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">
            Perché Puntare sulle Prenotazioni Dirette?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Ogni prenotazione diretta aumenta i tuoi margini e il controllo sui tuoi clienti
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Zero Commissioni</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    Le OTA ti chiedono il 15-25% su ogni prenotazione. Su una camera da €100/notte paghi €15-25 alla
                    piattaforma
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Con le prenotazioni dirette incassi il 100% del valore della camera senza intermediari</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Puoi offrire tariffe scontate ai clienti diretti mantenendo margini più alti delle OTA</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Controllo Totale</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Database clienti proprietario per email marketing, offerte esclusive e loyalty program</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Comunicazione diretta pre/post soggiorno per upselling servizi extra (spa, ristorante)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Flessibilità totale nelle condizioni di cancellazione e nelle politiche commerciali</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Quick Wins */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">5 Azioni Immediate per Aumentare il Direct Booking</h2>
          <p className="text-center opacity-90 mb-12 max-w-2xl mx-auto">
            Implementabili subito senza investimenti significativi
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                action: "Best Rate Guarantee",
                description:
                  "Dichiara sul sito 'Miglior tariffa garantita'. Aggiungi vantaggi esclusivi: colazione inclusa, upgrade camera, late check-out gratuito.",
                impact: "Incentivo diretto a prenotare sul tuo sito invece che su OTA",
              },
              {
                action: "Google Hotel Ads",
                description:
                  "Attiva la presenza su Google Hotel Ads. Costo commissione 8-12% contro 15-25% OTA tradizionali.",
                impact: "Visibilità su Google con commissioni ridotte del 50%",
              },
              {
                action: "Email Remarketing",
                description:
                  "Recupera carrelli abbandonati con email automatiche entro 1 ora. Recovery rate medio 15-20%.",
                impact: "Recupera 1 prenotazione su 5 che altrimenti andrebbe persa",
              },
              {
                action: "Booking Engine Mobile",
                description:
                  "Assicurati che il processo di prenotazione sia mobile-first. Il 65% delle ricerche avviene da smartphone.",
                impact: "Conversion rate mobile +40% con UX ottimizzata",
              },
              {
                action: "Clienti Passati",
                description:
                  "Email mensile con offerte esclusive ai clienti che hanno già soggiornato. Repeat rate 25-35%.",
                impact: "Fonte prenotazioni dirette più economica e redditizia",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <ArrowRight className="h-6 w-6 flex-shrink-0 mt-1" />
                  <h3 className="text-xl font-bold">{item.action}</h3>
                </div>
                <p className="text-sm opacity-90 mb-3">{item.description}</p>
                <p className="text-xs font-semibold text-accent">{item.impact}</p>
              </div>
            ))}
            <div className="bg-accent/20 backdrop-blur-sm rounded-xl p-6 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold mb-2">Vuoi tutte e 5?</p>
                <p className="text-sm opacity-90 mb-4">Piano operativo completo</p>
                <Link href="/#contact">
                  <Button variant="secondary" size="lg">
                    Richiedi Consulenza
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Case Study: Hotel Boutique 25 Camere - Firenze
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg mb-8">
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Situazione Iniziale</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prenotazioni Dirette</p>
                  <p className="text-3xl font-bold text-destructive">18%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prenotazioni OTA</p>
                  <p className="text-3xl font-bold text-foreground">82%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Commissioni Annue</p>
                  <p className="text-3xl font-bold text-destructive">€42.500</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                Hotel dipendente quasi totalmente da Booking.com ed Expedia. Booking engine obsoleto, zero remarketing,
                nessuna strategia di disintermediazione.
              </p>
            </div>

            <div className="text-center my-8">
              <BarChart3 className="h-12 w-12 text-primary-blue mx-auto" />
              <p className="text-muted-foreground mt-2">Dopo 10 mesi di implementazione</p>
            </div>

            <div className="bg-primary-blue/10 rounded-2xl p-8 border border-primary-blue/30 shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-4">Risultati Finali</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prenotazioni Dirette</p>
                  <p className="text-3xl font-bold text-primary-blue">
                    61% <span className="text-lg">↑+43%</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prenotazioni OTA</p>
                  <p className="text-3xl font-bold text-foreground">
                    39% <span className="text-lg">↓-43%</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Commissioni Annue</p>
                  <p className="text-3xl font-bold text-primary-blue">
                    €16.500 <span className="text-lg">↓-61%</span>
                  </p>
                </div>
              </div>
              <div className="bg-accent/20 rounded-xl p-6 mt-6">
                <p className="text-xl font-bold text-foreground mb-2">Risparmio Netto: €26.000/anno</p>
                <p className="text-sm text-muted-foreground">
                  Investimento iniziale completamente ripagato in 4 mesi. ROI 520% nel primo anno.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Vuoi Aumentare le Prenotazioni Dirette del Tuo Hotel?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita del tuo booking mix attuale. Ti mostreremo quanto puoi risparmiare in
            commissioni e come aumentare le prenotazioni dirette nei prossimi 12 mesi.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                Analisi Gratuita Booking Mix
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
