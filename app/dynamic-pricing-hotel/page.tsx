import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, TrendingUp, Zap, BarChart3, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { SantaddeoUniqueCallout } from "@/components/santaddeo-unique-callout"
import { ContactButton } from "@/components/contact-button"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata: Metadata = {
  title: "Dynamic Pricing Hotel Automatico: +30% Ricavi con AI | 4BID.IT",
  description:
    "Dynamic pricing hotel automatizzato 24/7: algoritmi AI ottimizzano tariffe in tempo reale. +50 fattori analizzati, aggiornamento continuo su tutti i canali. ROI garantito 90 giorni.",
  keywords:
    "dynamic pricing hotel, prezzi dinamici hotel automatici, pricing dinamico real-time, ottimizzazione tariffe automatica, algoritmo pricing hotel, revenue optimization AI",
  alternates: {
    canonical: "https://4bid.it/dynamic-pricing-hotel",
  },
  openGraph: {
    title: "Dynamic Pricing Hotel Automatico: +30% Ricavi con AI | 4BID.IT",
    description: "Dynamic pricing hotel automatizzato 24/7: algoritmi AI ottimizzano tariffe in tempo reale.",
    url: "https://4bid.it/dynamic-pricing-hotel",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: [{ url: "https://4bid.it/4bid-colorful-logo.jpg", width: 1200, height: 630, alt: "4BID Dynamic Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynamic Pricing Hotel Automatico: +30% Ricavi con AI",
    description: "Dynamic pricing hotel automatizzato 24/7: algoritmi AI ottimizzano tariffe in tempo reale.",
    images: ["https://4bid.it/4bid-colorful-logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
}

export default function DynamicPricingPage() {
  const faqs = [
    {
      question: "Cos'è il dynamic pricing per hotel?",
      answer:
        "Il dynamic pricing è una strategia di pricing che adatta automaticamente le tariffe delle camere in tempo reale basandosi su domanda, concorrenza, eventi e altri fattori di mercato per massimizzare i ricavi.",
    },
    {
      question: "Quanto tempo serve per vedere i risultati del dynamic pricing?",
      answer:
        "I primi risultati sono visibili entro 30 giorni dall'implementazione. Il ROI completo si ottiene tipicamente entro 90 giorni.",
    },
    {
      question: "Il dynamic pricing funziona anche per piccoli hotel?",
      answer:
        "Sì, il dynamic pricing è efficace per hotel di qualsiasi dimensione. Per strutture più piccole, l'automazione riduce significativamente il tempo dedicato alla gestione tariffe.",
    },
  ]

  return (
    <>
      <StructuredData
        type="Service"
        title="Dynamic Pricing Hotel Automatico"
        description="Servizio di dynamic pricing automatizzato per hotel con algoritmi AI che ottimizzano le tariffe in tempo reale su tutti i canali di vendita."
        url="https://4bid.it/dynamic-pricing-hotel"
        faqs={faqs}
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Dynamic Pricing Hotel", url: "https://4bid.it/dynamic-pricing-hotel" },
        ]}
      />
      <LandingPageTracker slug="dynamic-pricing-hotel" />
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-blue to-blue-grey py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                Dynamic Pricing Automatizzato per Hotel
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-pretty max-w-3xl mx-auto opacity-90">
                Ottimizza le tariffe in tempo reale con algoritmi avanzati: massimizza revenue e occupazione 24/7 senza
                intervento manuale
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ContactButton size="lg" className="bg-yellow text-foreground hover:bg-yellow/90 font-semibold">
                  Richiedi Demo Gratuita
                </ContactButton>
                <Link href="#come-funziona">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20">
                    Scopri Come Funziona
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problema del Pricing Manuale */}
        <section className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Perché il Pricing Manuale Lascia Soldi sul Tavolo
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  problem: "Decisioni a Sensazione",
                  description:
                    "Senza dati oggettivi, le tariffe sono impostate in base all'esperienza o alla concorrenza, perdendo opportunità di revenue",
                  impact: "Fino al 20% di revenue perso",
                },
                {
                  problem: "Reazione Lenta",
                  description:
                    "Il mercato cambia in ore, ma le tariffe manuali vengono aggiornate solo ogni pochi giorni o settimane",
                  impact: "Eventi e picchi di domanda sprecati",
                },
                {
                  problem: "Impossibile Scalare",
                  description:
                    "Gestire manualmente prezzi per multiple camere, periodi, segmenti e canali richiede troppo tempo e risorse",
                  impact: "Errori e incoerenze frequenti",
                },
              ].map((item, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-border">
                  <h3 className="text-xl font-semibold mb-3 text-destructive">{item.problem}</h3>
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                  <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm font-medium">
                    {item.impact}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Come Funziona */}
        <section id="come-funziona" className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Come Funziona il Dynamic Pricing con SANTADDEO
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  title: "Raccolta Dati",
                  description:
                    "Il sistema analizza in tempo reale: domanda, concorrenza, storico prenotazioni, eventi locali, meteo, trend di mercato",
                  icon: BarChart3,
                },
                {
                  step: "2",
                  title: "Algoritmi Predittivi",
                  description:
                    "Machine learning calcola il prezzo ottimale per massimizzare revenue considerando elasticità della domanda e obiettivi",
                  icon: Zap,
                },
                {
                  step: "3",
                  title: "Aggiornamento Automatico",
                  description:
                    "Le tariffe vengono aggiornate automaticamente su tutti i canali (PMS, OTA, sito web) più volte al giorno",
                  icon: Calendar,
                },
                {
                  step: "4",
                  title: "Ottimizzazione Continua",
                  description:
                    "Il sistema impara dalle performance e affina costantemente la strategia per risultati sempre migliori",
                  icon: TrendingUp,
                },
              ].map((step, index) => (
                <Card key={index} className="p-6 border-border">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-blue text-white font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <step.icon className="w-10 h-10 text-primary-blue mb-4" />
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <SantaddeoUniqueCallout />
          </div>
        </section>

        {/* Fattori Analizzati */}
        <section className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Oltre 50 Fattori Analizzati in Tempo Reale
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  category: "Domanda & Mercato",
                  factors: [
                    "Ricerche online per la destinazione",
                    "Trend di prenotazione del comp set",
                    "Pick-up rate delle prenotazioni",
                    "Lead time medio del mercato",
                  ],
                },
                {
                  category: "Concorrenza",
                  factors: [
                    "Prezzi comp set in tempo reale",
                    "Disponibilità camere concorrenti",
                    "Recensioni e rating updates",
                    "Promozioni attive",
                  ],
                },
                {
                  category: "Eventi & Contesto",
                  factors: [
                    "Eventi, fiere, concerti",
                    "Festività e ponti",
                    "Condizioni meteo previste",
                    "Calendario sportivo",
                  ],
                },
                {
                  category: "Performance Interna",
                  factors: [
                    "Storico booking per giorno/periodo",
                    "Cancellation rate",
                    "No-show rate",
                    "Revenue per segmento",
                  ],
                },
                {
                  category: "Capacità & Vincoli",
                  factors: [
                    "Disponibilità per tipo camera",
                    "Minimum stay restrictions",
                    "Group bookings confermati",
                    "Manutenzioni programmate",
                  ],
                },
                {
                  category: "Canali & Costi",
                  factors: [
                    "Commission per OTA",
                    "CPA per direct booking",
                    "Costo operativo per camera",
                    "Target margin per canale",
                  ],
                },
              ].map((category, index) => (
                <Card key={index} className="p-6 border-border">
                  <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary-blue" />
                    {category.category}
                  </h3>
                  <ul className="space-y-2">
                    {category.factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary-blue flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Risultati */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Risultati Misurabili con Dynamic Pricing
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  hotel: "Hotel 4★ - Firenze Centro",
                  rooms: "45 camere",
                  before: "Pricing manuale settimanale",
                  after: "Dynamic pricing automatizzato",
                  results: [
                    { metric: "RevPAR", change: "+28%", detail: "anno su anno" },
                    { metric: "ADR", change: "+18%", detail: "mantenendo 95% occupancy" },
                    { metric: "Tempo Gestione Prezzi", change: "-85%", detail: "da 10h a 1.5h/settimana" },
                  ],
                },
                {
                  hotel: "Resort 5★ - Costiera Amalfitana",
                  rooms: "78 camere",
                  before: "Pricing manuale giornaliero",
                  after: "Dynamic pricing + revenue manager",
                  results: [
                    { metric: "Revenue Totale", change: "+€450K", detail: "incremento annuale" },
                    { metric: "Margine Netto", change: "+32%", detail: "ottimizzando mix canali" },
                    { metric: "Prenotazioni Dirette", change: "+41%", detail: "grazie a prezzi competitivi" },
                  ],
                },
              ].map((caseStudy, index) => (
                <Card key={index} className="p-6 border-border">
                  <h3 className="text-xl font-bold mb-2 text-foreground">{caseStudy.hotel}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{caseStudy.rooms}</p>
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-destructive font-semibold">Prima:</span>
                      <span className="text-sm text-muted-foreground">{caseStudy.before}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary-blue font-semibold">Dopo:</span>
                      <span className="text-sm text-muted-foreground">{caseStudy.after}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {caseStudy.results.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-sm text-muted-foreground">{result.metric}</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-primary-blue">{result.change}</span>
                          <span className="text-xs text-muted-foreground block">{result.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section id="contatti" className="py-20 px-4 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <Zap className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
              Pronto ad Automatizzare il Tuo Revenue Management?
            </h2>
            <p className="text-xl mb-8 text-pretty opacity-90 max-w-2xl mx-auto">
              Richiedi una demo gratuita di SANTADDEO e scopri quanto puoi guadagnare con il dynamic pricing
              automatizzato.
            </p>
            <ContactButton size="lg" className="bg-yellow text-foreground hover:bg-yellow/90 font-semibold">
              Richiedi Demo Gratuita
            </ContactButton>
            <p className="text-sm mt-6 opacity-75">Nessun impegno • Setup in 48 ore • ROI garantito in 90 giorni</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
