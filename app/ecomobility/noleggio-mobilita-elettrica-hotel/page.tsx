import Link from "next/link"
import type { Metadata } from "next"
import { Bike, Car, Zap, Battery, Smartphone, Users, CheckCircle2, Leaf, TrendingUp, Clock, Shield, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { ContactButton } from "@/components/contact-button"

export const metadata: Metadata = {
  title: "Noleggio Mobilità Elettrica per Hotel e Strutture Turistiche | 4BID Ecomobility",
  description:
    "Offri ai tuoi ospiti e-bike, scooter elettrici e veicoli green. Piattaforma completa per hotel, resort e agriturismi. Gestione automatizzata, zero pensieri. Richiedi demo gratuita.",
  keywords:
    "noleggio mobilità elettrica hotel, e-bike hotel, scooter elettrici strutture turistiche, mobilità sostenibile resort, noleggio biciclette elettriche agriturismo, veicoli elettrici ospiti hotel",
  alternates: {
    canonical: "https://4bid.it/ecomobility/noleggio-mobilita-elettrica-hotel",
    languages: {
      "it": "https://4bid.it/ecomobility/noleggio-mobilita-elettrica-hotel",
      "en": "https://4bid.it/ecomobility/electric-mobility-rental-hotels",
    },
  },
  openGraph: {
    title: "Noleggio Mobilità Elettrica per Hotel e Strutture Turistiche | 4BID Ecomobility",
    description:
      "Offri ai tuoi ospiti e-bike, scooter elettrici e veicoli green. Piattaforma completa per hotel, resort e agriturismi. Gestione automatizzata, zero pensieri.",
    url: "https://4bid.it/ecomobility/noleggio-mobilita-elettrica-hotel",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://4bid.it/ecomobility-logo.png",
        width: 1200,
        height: 630,
        alt: "4BID Ecomobility - Mobilità Elettrica per Hotel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noleggio Mobilità Elettrica per Hotel | 4BID Ecomobility",
    description: "E-bike, scooter elettrici e veicoli green per i tuoi ospiti. Gestione automatizzata, zero pensieri.",
    images: ["https://4bid.it/ecomobility-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function NoleggioMobilitaElettricaHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Noleggio Mobilità Elettrica per Hotel"
        description="Servizio di noleggio mobilità elettrica per hotel, resort e strutture turistiche. E-bike, scooter elettrici e veicoli green per gli ospiti."
        url="https://4bid.it/ecomobility/noleggio-mobilita-elettrica-hotel"
      />

      <LandingPageTracker slug="ecomobility-noleggio-mobilita-elettrica-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-orange-500/10 via-green-500/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Leaf className="h-4 w-4" />
              Mobilità Sostenibile per il Turismo
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              Noleggio Mobilità Elettrica per Hotel e Strutture Turistiche
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Offri ai tuoi ospiti un servizio di mobilità elettrica completo: e-bike, scooter, quadricicli e auto elettriche. 
              Gestione automatizzata, prenotazioni online e pagamenti integrati. Zero pensieri per la tua struttura.
            </p>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto border border-border/50 text-left">
              <p className="text-sm font-semibold text-orange-600 mb-3">Perché scegliere 4BID Ecomobility:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Piattaforma SaaS completa per gestire qualsiasi tipo di veicolo elettrico</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Prenotazioni autonome degli ospiti, pagamenti automatici, verifica documenti</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Hardware opzionale: GPS tracker e lucchetti smart per il monitoraggio</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <ContactButton size="lg" className="bg-orange-500 hover:bg-orange-600">
                Richiedi Demo Gratuita
              </ContactButton>
              <Link href="/ecomobility/come-funziona">
                <Button size="lg" variant="outline">
                  Come Funziona
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Electric Mobility */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Perché Offrire la Mobilità Elettrica agli Ospiti
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Un servizio che aumenta la soddisfazione degli ospiti e genera nuovi ricavi per la tua struttura
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow">
              <TrendingUp className="h-10 w-10 text-orange-500 mb-4" />
              <h3 className="text-lg font-bold text-card-foreground mb-2">Nuovo Ricavo</h3>
              <p className="text-sm text-muted-foreground">
                Genera entrate aggiuntive con il noleggio veicoli. Margini elevati con gestione minima.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow">
              <Users className="h-10 w-10 text-orange-500 mb-4" />
              <h3 className="text-lg font-bold text-card-foreground mb-2">Guest Experience</h3>
              <p className="text-sm text-muted-foreground">
                Offri un servizio esclusivo che differenzia la tua struttura dalla concorrenza.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow">
              <Leaf className="h-10 w-10 text-green-500 mb-4" />
              <h3 className="text-lg font-bold text-card-foreground mb-2">Sostenibilità</h3>
              <p className="text-sm text-muted-foreground">
                Riduci l'impatto ambientale e attrai ospiti attenti all'ecologia e al turismo green.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow">
              <MapPin className="h-10 w-10 text-orange-500 mb-4" />
              <h3 className="text-lg font-bold text-card-foreground mb-2">Territorio</h3>
              <p className="text-sm text-muted-foreground">
                Permetti agli ospiti di esplorare il territorio in modo autonomo e sostenibile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Quali Veicoli Puoi Offrire
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            La piattaforma 4BID Ecomobility supporta qualsiasi tipo di veicolo elettrico
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                <Bike className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">E-Bike</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Biciclette elettriche city e trekking per escursioni nel territorio. Ideali per agriturismi e resort.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Autonomia: 50-80 km</li>
                <li>Velocità max: 25 km/h</li>
                <li>Nessuna patente richiesta</li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">Scooter Elettrici</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scooter e motorini elettrici per spostamenti veloci in città o zone costiere.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Autonomia: 60-100 km</li>
                <li>Velocità max: 45 km/h</li>
                <li>Patente AM/B richiesta</li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <Battery className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">Quadricicli</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Minicar elettriche per 2-4 persone, perfette per famiglie e coppie.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Autonomia: 70-100 km</li>
                <li>Velocità max: 45 km/h</li>
                <li>Patente AM/B richiesta</li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
                <Car className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">Auto Elettriche</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Auto elettriche full-size per escursioni più lunghe e transfer.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Autonomia: 200-400 km</li>
                <li>Velocità max: 130 km/h</li>
                <li>Patente B richiesta</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Automated Management */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Gestione Semplice e Automatizzata
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Con 4BID Ecomobility non devi preoccuparti di nulla. La piattaforma gestisce automaticamente 
                  prenotazioni, pagamenti, documenti e comunicazioni con gli ospiti.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Prenotazioni Self-Service</p>
                      <p className="text-sm text-muted-foreground">Gli ospiti prenotano autonomamente dal loro smartphone</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Pagamenti Automatici</p>
                      <p className="text-sm text-muted-foreground">Incasso immediato con carta, gestione cauzioni inclusa</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Verifica Documenti</p>
                      <p className="text-sm text-muted-foreground">Upload e approvazione patenti e documenti di identità</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Monitoraggio Batteria</p>
                      <p className="text-sm text-muted-foreground">Stato di carica in tempo reale e avvisi automatici</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Riconsegna Guidata</p>
                      <p className="text-sm text-muted-foreground">Foto obbligatorie e calcolo automatico importo finale</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-green-500/20 rounded-2xl p-8 border border-orange-200">
                <Smartphone className="h-16 w-16 text-orange-500 mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Tutto dal Tuo Smartphone
                </h3>
                <p className="text-muted-foreground mb-6">
                  Dashboard completa accessibile da qualsiasi dispositivo. Monitora prenotazioni, flotta e incassi in tempo reale.
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-orange-500">24/7</p>
                    <p className="text-xs text-muted-foreground">Prenotazioni attive</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-green-500">0</p>
                    <p className="text-xs text-muted-foreground">Interventi manuali</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Structures */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Per Quali Strutture è Ideale</h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
            4BID Ecomobility si adatta a qualsiasi tipo di struttura ricettiva
          </p>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {["Hotel", "Resort", "Agriturismi", "B&B", "Villaggi Turistici", "Campeggi"].map((structure) => (
              <div key={structure} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="font-semibold">{structure}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            I Vantaggi per la Tua Struttura
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Ricavi Extra</h3>
              <p className="text-muted-foreground">
                Margine medio del 60% sul noleggio. Un investimento che si ripaga rapidamente.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Zero Tempo</h3>
              <p className="text-muted-foreground">
                Gestione completamente automatizzata. Il tuo staff non deve fare nulla.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Sicurezza</h3>
              <p className="text-muted-foreground">
                Verifica documenti, cauzioni automatiche e foto riconsegna per tutelarti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Vuoi Offrire la Mobilità Elettrica ai Tuoi Ospiti?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una demo gratuita e scopri come 4BID Ecomobility può trasformare la tua struttura 
            in un punto di riferimento per il turismo sostenibile.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/ecomobility/registra-struttura">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                Registra la Tua Struttura
              </Button>
            </Link>
            <Link href="/ecomobility/piattaforma-ecomobility">
              <Button size="lg" variant="outline">
                Scopri la Piattaforma
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
