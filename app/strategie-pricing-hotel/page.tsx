import Link from "next/link"
import { DollarSign, Zap, Target, CheckCircle2, AlertCircle, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Strategie Pricing Hotel: BAR, Dynamic Pricing, LOS | Guida 2025 | 4BID.IT",
  description:
    "Strategie pricing hotel comprovate: BAR strategy, dynamic pricing, price fencing, LOS restrictions. Dal pricing statico al dinamico intelligente. Aumenta RevPAR +37%. Guida completa.",
  keywords:
    "strategie pricing hotel, BAR strategy hotel, dynamic pricing strategico, price fencing alberghiero, length of stay restrictions, strategie tariffe hotel avanzate, pricing optimization",
  alternates: {
    canonical: "https://4bid.it/strategie-pricing-hotel",
  },
}

export default function StrategiePricingHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Strategie Pricing Hotel: BAR, Dynamic Pricing, LOS"
        description="Strategie pricing hotel comprovate: BAR strategy, dynamic pricing, price fencing, LOS restrictions. Dal pricing statico al dinamico intelligente."
        url="https://4bid.it/strategie-pricing-hotel"
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Strategie Pricing Hotel", url: "https://4bid.it/strategie-pricing-hotel" },
        ]}
        keywords={["strategie pricing hotel", "BAR strategy", "dynamic pricing", "LOS restrictions", "price fencing"]}
      />
      <LandingPageTracker slug="strategie-pricing-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <DollarSign className="h-16 w-16 text-primary-blue mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Strategie Pricing Hotel che Aumentano i Ricavi
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Dal pricing statico al dynamic pricing intelligente: le strategie comprovate per massimizzare RevPAR senza
              perdere competitività.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Analisi Pricing Gratuita
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Vedi SANTADDEO Pricing
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
                <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Il 68% degli hotel usa ancora pricing statico
                  </h3>
                  <p className="text-muted-foreground">
                    Tariffa fissa per stagione? Stai lasciando sul tavolo il 30-40% dei ricavi potenziali. Il mercato
                    cambia ogni giorno, le tue tariffe devono fare lo stesso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Strategies */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Le 5 Strategie Pricing Essenziali</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Da implementare in sequenza per costruire un sistema pricing ottimale
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border md:col-span-2 lg:col-span-3">
              <div className="flex items-start gap-4">
                <div className="bg-primary-blue/10 rounded-full p-3">
                  <Target className="h-8 w-8 text-primary-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-card-foreground">1. BAR Strategy (Best Available Rate)</h3>
                    <span className="bg-primary-blue/10 text-primary-blue text-xs font-bold px-3 py-1 rounded-full">
                      FONDAMENTALE
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    La base di tutto: una tariffa rack flessibile che cambia dinamicamente. Tutte le altre tariffe
                    (package, corporate, ecc.) derivano dalla BAR con sconti fissi.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-primary-blue/5 rounded-lg p-4">
                      <h4 className="font-bold text-card-foreground mb-2 text-sm">Come funziona:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• BAR = tariffa base variabile</li>
                        <li>• Non-refundable = BAR -15%</li>
                        <li>• Package colazione = BAR +€15</li>
                        <li>• Corporate = BAR -20%</li>
                      </ul>
                    </div>
                    <div className="bg-primary-blue/5 rounded-lg p-4">
                      <h4 className="font-bold text-card-foreground mb-2 text-sm">Vantaggi:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Aggiusti 1 tariffa, cambiano tutte</li>
                        <li>• Coerenza su tutti i canali</li>
                        <li>• Velocità decisionale</li>
                        <li>• Eviti errori di parity</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="bg-primary-blue/10 rounded-full p-3 w-fit mb-4">
                <Zap className="h-8 w-8 text-primary-blue" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">2. Dynamic Pricing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                La BAR cambia automaticamente in base a domanda, occupazione, competitori, eventi e lead time.
              </p>
              <div className="bg-primary-blue/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Fattori che influenzano il prezzo:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Occupazione attuale e forecast</li>
                  <li>• Prezzi competitori</li>
                  <li>• Booking pace vs storico</li>
                  <li>• Eventi e fiere in città</li>
                  <li>• Day of week pattern</li>
                </ul>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="bg-primary-blue/10 rounded-full p-3 w-fit mb-4">
                <Calendar className="h-8 w-8 text-primary-blue" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">3. Length of Stay (LOS)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Restrizioni intelligenti su durata soggiorno per ottimizzare occupazione e RevPAR.
              </p>
              <div className="bg-primary-blue/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Esempi restrizioni LOS:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Min 3 notti weekend ponte</li>
                  <li>• Max 1 notte alta stagione (per evitare gap)</li>
                  <li>• Closed to arrival Domenica per prenotazioni 1 notte</li>
                </ul>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="bg-primary-blue/10 rounded-full p-3 w-fit mb-4">
                <Users className="h-8 w-8 text-primary-blue" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">4. Price Fencing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Segmenta i clienti con tariffe diverse basate su condizioni specifiche senza discriminazione.
              </p>
              <div className="bg-primary-blue/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Tecniche price fencing:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Refundable vs Non-refundable</li>
                  <li>• Advance Purchase (prenota 30gg prima)</li>
                  <li>• Package (include colazione/spa)</li>
                  <li>• Member rates (programma fedeltà)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SANTADDEO System */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Sistema SANTADDEO Pricing</h2>
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border border-primary-blue/20">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Automazione Intelligente</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Dynamic pricing automatico basato su 15+ fattori</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Adeguamento BAR ogni 4 ore in alta stagione</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Suggerimenti LOS restrictions per ogni data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Sincronizzazione real-time su tutti i canali</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Controllo Totale</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Override manuale quando necessario</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Simulazione impatto pricing prima di applicare</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Alert su anomalie pricing vs competitori</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Report efficacia strategie pricing</span>
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
              <h2 className="text-3xl font-bold text-card-foreground mb-6">Case Study: Boutique Hotel Roma</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-bold text-card-foreground mb-3">Situazione Prima:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Pricing statico stagionale</li>
                    <li>• 3 tariffe fisse (bassa/media/alta)</li>
                    <li>• Cambio manuale ogni trimestre</li>
                    <li>• Nessuna LOS restriction</li>
                    <li>• RevPAR €87</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-card-foreground mb-3">Dopo SANTADDEO:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• BAR strategy con 5 fences</li>
                    <li>• Dynamic pricing automatico</li>
                    <li>• Aggiornamento tariffe ogni 4h</li>
                    <li>• LOS intelligente su 90+ date/anno</li>
                    <li>• RevPAR €119 (+37%)</li>
                  </ul>
                </div>
              </div>
              <div className="bg-primary-blue/10 rounded-xl p-6">
                <h4 className="font-bold text-foreground mb-4">Risultati 12 mesi:</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary-blue">+37%</p>
                    <p className="text-sm text-muted-foreground">RevPAR</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary-blue">+€94k</p>
                    <p className="text-sm text-muted-foreground">Ricavi extra/anno</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary-blue">ROI 480%</p>
                    <p className="text-sm text-muted-foreground">Primo anno</p>
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
          <h2 className="text-4xl font-bold text-foreground mb-6">Analisi Pricing Gratuita del Tuo Hotel</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ti analizziamo la tua strategia pricing attuale e ti mostriamo quanto stai perdendo con il pricing statico.
            Gratis e senza impegno.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Analisi Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
