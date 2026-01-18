import Link from "next/link"
import type { Metadata } from "next"
import { 
  Building2, Bike, Calendar, FileCheck, Battery, CreditCard, 
  Key, Camera, CheckCircle2, ArrowRight, Smartphone, Clock,
  Shield, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { ContactButton } from "@/components/contact-button"

export const metadata: Metadata = {
  title: "Come Funziona 4BID Ecomobility | Guida Passo Passo al Noleggio Veicoli Elettrici",
  description:
    "Scopri come funziona 4BID Ecomobility: dalla scelta del veicolo alla riconsegna. Prenotazione autonoma, pagamento online, ritiro e riconsegna guidata. Guida completa per ospiti e gestori.",
  keywords:
    "come funziona ecomobility, tutorial noleggio e-bike hotel, guida prenotazione veicoli elettrici, processo noleggio mobilità sostenibile, istruzioni noleggio scooter elettrici",
  alternates: {
    canonical: "https://4bid.it/ecomobility/come-funziona",
    languages: {
      "it": "https://4bid.it/ecomobility/come-funziona",
      "en": "https://4bid.it/ecomobility/how-it-works",
    },
  },
  openGraph: {
    title: "Come Funziona 4BID Ecomobility | Guida al Noleggio Veicoli Elettrici",
    description:
      "Scopri come funziona 4BID Ecomobility: dalla scelta del veicolo alla riconsegna. Prenotazione autonoma, pagamento online, ritiro e riconsegna guidata.",
    url: "https://4bid.it/ecomobility/come-funziona",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://4bid.it/ecomobility-logo.png",
        width: 1200,
        height: 630,
        alt: "4BID Ecomobility - Come Funziona",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Come Funziona 4BID Ecomobility",
    description: "Guida passo passo: dalla scelta del veicolo alla riconsegna. Semplice, veloce, automatizzato.",
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

const steps = [
  {
    number: 1,
    icon: Building2,
    title: "Scelta della Struttura",
    description: "L'ospite accede alla pagina dedicata della struttura ricettiva tramite QR code, link o app.",
    details: [
      "Ogni struttura ha il proprio URL personalizzato",
      "Interfaccia brandizzata con logo e colori",
      "Accessibile da qualsiasi dispositivo",
    ],
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    number: 2,
    icon: Bike,
    title: "Selezione del Veicolo",
    description: "L'ospite visualizza i veicoli disponibili con foto, specifiche tecniche e stato batteria.",
    details: [
      "Filtro per tipo di veicolo (e-bike, scooter, auto)",
      "Visualizzazione stato batteria e autonomia stimata",
      "Solo veicoli effettivamente disponibili",
    ],
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    number: 3,
    icon: Calendar,
    title: "Data e Orario",
    description: "Selezione di data e ora di ritiro. Il sistema mostra la disponibilità in tempo reale.",
    details: [
      "Calendario con slot disponibili",
      "Durata minima e massima configurabili",
      "Calcolo automatico del preventivo",
    ],
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  {
    number: 4,
    icon: FileCheck,
    title: "Verifica Requisiti",
    description: "Il sistema verifica automaticamente i requisiti di guida in base al veicolo selezionato.",
    details: [
      "Controllo tipo patente richiesta",
      "Upload foto documenti (patente, CI)",
      "Dichiarazione di autonomia batteria",
    ],
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    number: 5,
    icon: Smartphone,
    title: "Prenotazione Online",
    description: "L'ospite completa la prenotazione inserendo i propri dati e accettando le condizioni.",
    details: [
      "Form semplice e veloce",
      "Accettazione termini e condizioni",
      "Conferma email automatica",
    ],
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-600",
  },
  {
    number: 6,
    icon: CreditCard,
    title: "Pagamento e Cauzione",
    description: "Pagamento sicuro con carta. La cauzione viene pre-autorizzata e rilasciata dopo la riconsegna.",
    details: [
      "Pagamento con carta di credito/debito",
      "Pre-autorizzazione cauzione (non addebitata)",
      "Tariffe decrescenti: più usi, meno paghi",
    ],
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    number: 7,
    icon: Key,
    title: "Ritiro del Veicolo",
    description: "L'ospite si presenta alla struttura, mostra il voucher digitale e ritira il veicolo.",
    details: [
      "Voucher digitale con QR code",
      "Verifica documenti da parte dell'operatore",
      "Consegna chiavi e istruzioni d'uso",
    ],
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    number: 8,
    icon: Camera,
    title: "Riconsegna Guidata",
    description: "L'ospite completa la riconsegna con foto obbligatorie e indicazione del livello batteria.",
    details: [
      "4 foto obbligatorie del veicolo",
      "Indicazione livello batteria attuale",
      "Calcolo automatico importo finale",
      "Eventuale segnalazione danni",
    ],
    color: "from-rose-500 to-rose-600",
    bgColor: "bg-rose-50",
    textColor: "text-rose-600",
  },
]

export default function ComeFunzionaPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="HowTo"
        title="Come Funziona 4BID Ecomobility"
        description="Guida passo passo al noleggio di veicoli elettrici con 4BID Ecomobility."
        url="https://4bid.it/ecomobility/come-funziona"
      />

      <LandingPageTracker slug="ecomobility-come-funziona" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-orange-500/10 via-background to-green-500/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Guida Passo Passo
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              Come Funziona 4BID Ecomobility
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Dalla scelta del veicolo alla riconsegna: un processo semplice, veloce e completamente 
              autonomo per l'ospite. Nessun intervento manuale richiesto alla struttura.
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Prenotazione in 3 minuti</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-orange-500" />
                <span>100% Mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                <span>Pagamento Sicuro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-24 w-0.5 h-16 bg-gradient-to-b from-gray-300 to-gray-200 hidden md:block" />
                )}
                
                <div className={`${step.bgColor} rounded-2xl p-6 md:p-8 mb-6 border border-gray-100`}>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Step Number & Icon */}
                    <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold ${step.textColor}`}>STEP {step.number}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className={`h-4 w-4 ${step.textColor} mt-0.5 flex-shrink-0`} />
                            <span className="text-muted-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Arrow for desktop */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:flex items-center justify-center w-12">
                        <ArrowRight className="h-6 w-6 text-gray-300 rotate-90 md:rotate-0" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Summary */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Perché Funziona
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Autonomia Totale</h3>
                <p className="text-white/80">
                  L'ospite completa l'intero processo dal proprio smartphone, 
                  senza bisogno di interazione con il personale.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sicurezza Garantita</h3>
                <p className="text-white/80">
                  Verifica documenti, foto obbligatorie e cauzioni automatiche 
                  proteggono la struttura da rischi e danni.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Zero Stress</h3>
                <p className="text-white/80">
                  Nessuna gestione manuale. Il sistema automatizza prenotazioni, 
                  pagamenti, notifiche e calcoli.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Operators */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              Per il Gestore della Struttura
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Una dashboard completa per monitorare e gestire il servizio di noleggio
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Prenotazioni del Giorno",
                  description: "Vista immediata di ritiri e riconsegne previsti",
                },
                {
                  title: "Stato della Flotta",
                  description: "Veicoli disponibili, in uso, in carica o in manutenzione",
                },
                {
                  title: "Verifica Documenti",
                  description: "Approvazione rapida delle patenti con un click",
                },
                {
                  title: "Report e Analytics",
                  description: "Statistiche di utilizzo, ricavi e performance",
                },
              ].map((item, index) => (
                <div key={index} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Model */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tariffe Decrescenti: Più Usi, Meno Paghi
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Il sistema di pricing incentiva i noleggi più lunghi con tariffe orarie decrescenti
            </p>
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
                {[
                  { hour: "1h", price: "8€" },
                  { hour: "2h", price: "7€" },
                  { hour: "3h", price: "6€" },
                  { hour: "4h", price: "5€" },
                  { hour: "5h", price: "4.5€" },
                  { hour: "6h", price: "4€" },
                  { hour: "7h", price: "3.5€" },
                  { hour: "8h+", price: "3€" },
                ].map((tier, i) => (
                  <div key={i} className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{tier.hour}</p>
                    <p className="font-bold text-orange-600">{tier.price}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Esempio: un noleggio di 5 ore costa 8+7+6+5+4.5 = <strong className="text-foreground">30.50€</strong> invece di 40€ a tariffa fissa.
                Cap giornaliero e cauzioni configurabili per ogni tipo di veicolo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Vuoi Vedere 4BID Ecomobility in Azione?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una demo gratuita e ti mostreremo come funziona la piattaforma 
            con un esempio pratico sulla tua struttura.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <ContactButton size="lg" className="bg-orange-500 hover:bg-orange-600">
              Richiedi Demo Gratuita
            </ContactButton>
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
