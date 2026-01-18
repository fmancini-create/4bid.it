import Link from "next/link"
import type { Metadata } from "next"
import { 
  Bike, Settings, CreditCard, FileCheck, Battery, Bell, 
  Building2, Palette, CheckCircle2, Shield, Zap, Globe,
  Smartphone, BarChart3, Users, Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { ContactButton } from "@/components/contact-button"

export const metadata: Metadata = {
  title: "Piattaforma Ecomobility per Strutture Ricettive | Software Noleggio Veicoli | 4BID",
  description:
    "Software SaaS per gestire il noleggio di mobilità elettrica in hotel e strutture turistiche. Prenotazioni automatiche, pagamenti, documenti, gestione batteria. Multi-tenant e white-label.",
  keywords:
    "piattaforma ecomobility, software noleggio veicoli hotel, gestionale mobilità elettrica, saas noleggio e-bike, software noleggio scooter elettrici, white label mobility",
  alternates: {
    canonical: "https://4bid.it/ecomobility/piattaforma-ecomobility",
    languages: {
      "it": "https://4bid.it/ecomobility/piattaforma-ecomobility",
      "en": "https://4bid.it/ecomobility/ecomobility-platform",
    },
  },
  openGraph: {
    title: "Piattaforma Ecomobility per Strutture Ricettive | 4BID",
    description:
      "Software SaaS per gestire il noleggio di mobilità elettrica. Prenotazioni automatiche, pagamenti, documenti, gestione batteria. Multi-tenant e white-label.",
    url: "https://4bid.it/ecomobility/piattaforma-ecomobility",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://4bid.it/ecomobility-logo.png",
        width: 1200,
        height: 630,
        alt: "4BID Ecomobility Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Piattaforma Ecomobility per Strutture Ricettive | 4BID",
    description: "Software SaaS per gestire il noleggio di mobilità elettrica. Multi-tenant e white-label.",
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

export default function PiattaformaEcomobilityPage() {
  const features = [
    {
      icon: CreditCard,
      title: "Prenotazioni Online",
      description: "Gli ospiti prenotano autonomamente dal loro smartphone. Calendario disponibilità in tempo reale.",
    },
    {
      icon: CreditCard,
      title: "Pagamenti Automatici",
      description: "Incasso immediato con carta di credito. Gestione cauzioni e rimborsi automatizzati.",
    },
    {
      icon: FileCheck,
      title: "Verifica Documenti",
      description: "Upload e approvazione di patenti e documenti di identità. Conformità normativa garantita.",
    },
    {
      icon: Battery,
      title: "Gestione Batteria",
      description: "Monitoraggio stato di carica, avvisi automatici, stima autonomia e tempi di ricarica.",
    },
    {
      icon: Bell,
      title: "Notifiche Automatiche",
      description: "Email e SMS per conferme, promemoria ritiro, avvisi riconsegna e comunicazioni.",
    },
    {
      icon: BarChart3,
      title: "Analytics e Report",
      description: "Dashboard con statistiche utilizzo, ricavi, performance flotta e previsioni.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="SoftwareApplication"
        title="4BID Ecomobility - Piattaforma per Noleggio Mobilità Elettrica"
        description="Software SaaS per gestire il noleggio di mobilità elettrica in hotel e strutture turistiche."
        url="https://4bid.it/ecomobility/piattaforma-ecomobility"
      />

      <LandingPageTracker slug="ecomobility-piattaforma" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-orange-500/10 via-blue-500/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Settings className="h-4 w-4" />
              Software as a Service
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              Piattaforma di Ecomobility per Strutture Ricettive
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Il software completo per gestire il noleggio di veicoli elettrici nella tua struttura. 
              Automazione totale, scalabilità infinita, personalizzazione completa.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <ContactButton size="lg" className="bg-orange-500 hover:bg-orange-600">
                Richiedi Demo Gratuita
              </ContactButton>
              <Link href="/ecomobility/come-funziona">
                <Button size="lg" variant="outline">
                  Vedi Come Funziona
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* One Platform, Any Vehicle */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Una Piattaforma, Qualsiasi Veicolo
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                4BID Ecomobility supporta qualsiasi tipo di veicolo elettrico: dalle e-bike agli scooter, 
                dai quadricicli alle auto elettriche. Una sola piattaforma per gestirli tutti.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Bike, label: "E-Bike", color: "bg-orange-100 text-orange-600" },
                { icon: Zap, label: "Scooter", color: "bg-blue-100 text-blue-600" },
                { icon: Battery, label: "Quadricicli", color: "bg-green-100 text-green-600" },
                { icon: Globe, label: "Auto Elettriche", color: "bg-purple-100 text-purple-600" },
              ].map((vehicle) => (
                <div key={vehicle.label} className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-4 ${vehicle.color} rounded-2xl flex items-center justify-center`}>
                    <vehicle.icon className="h-10 w-10" />
                  </div>
                  <p className="font-semibold text-foreground">{vehicle.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 bg-muted/50 rounded-2xl p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Configura tipi di veicoli personalizzati, definisci requisiti di guida specifici, 
                imposta tariffe diverse per ogni categoria. La flessibilità che ti serve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Automation */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Automazione Completa
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ogni aspetto del noleggio è automatizzato. Il tuo staff può concentrarsi sull'ospitalità.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-md border border-border">
                <feature.icon className="h-10 w-10 text-orange-500 mb-4" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Prenotazioni */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Sistema di Prenotazione Intelligente</h3>
                <p className="text-muted-foreground mb-6">
                  Gli ospiti prenotano in autonomia dal loro smartphone. Il sistema verifica automaticamente 
                  disponibilità, requisiti di guida e stato batteria del veicolo.
                </p>
                <ul className="space-y-3">
                  {[
                    "Calendario disponibilità in tempo reale",
                    "Selezione veicolo con preview e specifiche",
                    "Verifica automatica requisiti patente",
                    "Calcolo preventivo con tariffe decrescenti",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-8 border border-orange-200">
                <Smartphone className="h-12 w-12 text-orange-500 mb-4" />
                <p className="text-sm text-orange-800">
                  "Più usi, meno paghi" - Il sistema di pricing decrescente incentiva i noleggi più lunghi 
                  e aumenta il valore medio per prenotazione.
                </p>
              </div>
            </div>

            {/* Pagamenti */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-8 border border-green-200">
                <CreditCard className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-sm text-green-800">
                  Integrazione completa con Stripe per pagamenti sicuri e conformi PSD2. 
                  Gestione automatica di cauzioni, rimborsi e contestazioni.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold text-foreground mb-4">Pagamenti e Cauzioni</h3>
                <p className="text-muted-foreground mb-6">
                  Incasso automatico al momento della prenotazione. La cauzione viene bloccata sulla carta 
                  e rilasciata automaticamente dopo la riconsegna senza danni.
                </p>
                <ul className="space-y-3">
                  {[
                    "Pagamento con carta di credito/debito",
                    "Pre-autorizzazione cauzione",
                    "Calcolo automatico importo finale",
                    "Fatturazione elettronica integrata",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Documenti */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Verifica Documenti di Guida</h3>
                <p className="text-muted-foreground mb-6">
                  L'ospite carica i documenti richiesti (patente, carta d'identità) direttamente dall'app. 
                  Il gestore li approva con un click.
                </p>
                <ul className="space-y-3">
                  {[
                    "Upload foto documenti da smartphone",
                    "Verifica validità patente per tipo veicolo",
                    "Archiviazione sicura e conforme GDPR",
                    "Notifica automatica all'ospite",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-8 border border-blue-200">
                <FileCheck className="h-12 w-12 text-blue-500 mb-4" />
                <p className="text-sm text-blue-800">
                  Conformità normativa garantita. La piattaforma verifica automaticamente che l'ospite 
                  abbia i requisiti per guidare il veicolo selezionato.
                </p>
              </div>
            </div>

            {/* Batteria */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl p-8 border border-yellow-200">
                <Battery className="h-12 w-12 text-yellow-600 mb-4" />
                <p className="text-sm text-yellow-800">
                  "Dichiarazione di autonomia" obbligatoria. L'ospite conferma di aver compreso l'autonomia 
                  stimata del veicolo prima di completare la prenotazione.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold text-foreground mb-4">Gestione Intelligente della Batteria</h3>
                <p className="text-muted-foreground mb-6">
                  Monitoraggio dello stato di carica in tempo reale. I veicoli con batteria insufficiente 
                  vengono automaticamente esclusi dalla disponibilità.
                </p>
                <ul className="space-y-3">
                  {[
                    "Stato batteria visibile all'ospite",
                    "Stima autonomia in km",
                    "Veicoli in carica con tempo stimato",
                    "Avvisi automatici per ricarica",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-tenant & White Label */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Multi-Tenant e White-Label</h2>
              <p className="text-xl opacity-80 max-w-2xl mx-auto">
                Architettura progettata per scalare. Ogni struttura ha il proprio ambiente isolato e personalizzabile.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <Building2 className="h-12 w-12 text-orange-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">Multi-Tenant</h3>
                <p className="text-gray-300 mb-6">
                  Ogni struttura opera in un ambiente completamente isolato. Dati, configurazioni 
                  e reportistica separati per ogni cliente.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Dati completamente isolati
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Configurazioni indipendenti
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Operatori per struttura
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <Palette className="h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">White-Label</h3>
                <p className="text-gray-300 mb-6">
                  Personalizza l'interfaccia con i colori e il logo della struttura. 
                  L'ospite vive un'esperienza brandizzata.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Logo struttura
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Colori personalizzati
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    URL dedicato
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sicurezza e Conformità
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              La piattaforma è progettata con i più alti standard di sicurezza e conformità normativa.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl p-6 border border-border">
                <Lock className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">GDPR Compliant</h3>
                <p className="text-sm text-muted-foreground">Gestione dati personali conforme al Regolamento Europeo</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">PSD2 Compliant</h3>
                <p className="text-sm text-muted-foreground">Pagamenti sicuri con autenticazione forte (SCA)</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <Users className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">Ruoli e Permessi</h3>
                <p className="text-sm text-muted-foreground">Controllo granulare degli accessi per ogni operatore</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Pronto a Digitalizzare il Noleggio nella Tua Struttura?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una demo gratuita e scopri come la piattaforma 4BID Ecomobility 
            può automatizzare completamente il servizio di noleggio.
          </p>
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
      </section>

      <Footer />
    </div>
  )
}
