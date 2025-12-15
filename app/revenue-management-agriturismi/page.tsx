import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, TrendingUp, Users, Calendar, PieChart, Target } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Revenue Management per Agriturismi | Ottimizza Prezzi e Occupazione | 4BID.IT",
  description:
    "Servizi specializzati di revenue management per agriturismi. Aumenta occupazione e ricavi con strategie personalizzate per il turismo rurale ed enogastronomico.",
  keywords:
    "revenue management agriturismi, prezzi agriturismi, occupazione agriturismo, gestione ricavi turismo rurale, ottimizzazione tariffe agriturismo",
}

export default function RevenueMangementAgriturismPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-blue to-blue-grey py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                Revenue Management per Agriturismi
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-pretty max-w-3xl mx-auto opacity-90">
                Strategie su misura per il turismo rurale: aumenta occupazione e ricavi valorizzando l'autenticità della
                tua struttura
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#contatti">
                  <Button size="lg" className="bg-yellow text-foreground hover:bg-yellow/90 font-semibold">
                    Richiedi Consulenza Gratuita
                  </Button>
                </Link>
                <Link href="#case-studies">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20">
                    Vedi Risultati
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sfide Specifiche Agriturismi */}
        <section className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Le Sfide del Revenue Management per Agriturismi
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Stagionalità Marcata",
                  description:
                    "Periodi di alta e bassa stagione molto definiti richiedono strategie dinamiche per mantenere occupazione costante",
                  icon: Calendar,
                },
                {
                  title: "Target Diversificati",
                  description:
                    "Famiglie, coppie, gruppi: ogni segmento cerca esperienze diverse e ha diversa disponibilità di spesa",
                  icon: Users,
                },
                {
                  title: "Offerta Complementare",
                  description:
                    "Camere, ristorazione, attività ed esperienze: ottimizzare il revenue mix è fondamentale",
                  icon: PieChart,
                },
              ].map((challenge, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-border">
                  <challenge.icon className="w-12 h-12 text-primary-blue mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{challenge.title}</h3>
                  <p className="text-muted-foreground">{challenge.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Servizi Specifici */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Servizi Specializzati per Agriturismi
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Pricing Dinamico Multi-Servizio",
                  description:
                    "Ottimizziamo non solo le camere ma anche ristorazione, degustazioni, attività didattiche e esperienze per massimizzare il ricavo per ospite",
                  benefits: [
                    "Tariffe differenziate per segmento",
                    "Pacchetti esperienza ottimizzati",
                    "Pricing eventi e cerimonie",
                  ],
                },
                {
                  title: "Strategie Anti-Stagionalità",
                  description:
                    "Sviluppiamo offerte e promozioni mirate per riempire i periodi di bassa stagione senza svalutare l'alta",
                  benefits: [
                    "Offerte infrasettimanali",
                    "Pacchetti lunghi soggiorni",
                    "Promozioni last minute intelligenti",
                  ],
                },
                {
                  title: "Gestione Canali OTA Specializzati",
                  description:
                    "Ottimizziamo la presenza su portali dedicati al turismo rurale ed enogastronomico oltre ai grandi player",
                  benefits: [
                    "Booking.com, Airbnb, Agriturismo.it",
                    "Visibilità su portali verticali",
                    "Gestione recensioni e reputazione",
                  ],
                },
                {
                  title: "Analisi Performance & Forecasting",
                  description:
                    "Report mensili con KPI specifici per agriturismi e previsioni per pianificare investimenti e risorse",
                  benefits: ["RevPAR, ADR e Occupancy", "Revenue per ospite totale", "Previsioni stagionali accurate"],
                },
              ].map((service, index) => (
                <Card key={index} className="p-6 border-border">
                  <div className="flex items-start gap-4">
                    <Target className="w-8 h-8 text-primary-blue flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{service.title}</h3>
                      <p className="text-muted-foreground mb-4">{service.description}</p>
                      <ul className="space-y-2">
                        {service.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary-blue flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section id="case-studies" className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Risultati Ottenuti con Agriturismi
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  name: "Agriturismo Le Colline - Toscana",
                  rooms: "12 camere",
                  results: [
                    { label: "RevPAR", value: "+35%", period: "anno su anno" },
                    { label: "Occupazione Bassa Stagione", value: "+48%", period: "gen-mar 2024" },
                    { label: "Revenue Ristorazione", value: "+28%", period: "totale anno" },
                  ],
                  testimonial:
                    "Grazie alle strategie di 4BID abbiamo riempito anche i mesi invernali, prima sempre vuoti. I pacchetti esperienza hanno aumentato significativamente lo scontrino medio.",
                },
                {
                  name: "Agriturismo Bio Valle Verde - Umbria",
                  rooms: "8 camere + appartamenti",
                  results: [
                    { label: "Revenue Totale", value: "+42%", period: "primo anno" },
                    { label: "Direct Booking", value: "65%", period: "vs 30% precedente" },
                    { label: "Durata Media Soggiorno", value: "+1.2 notti", period: "media annuale" },
                  ],
                  testimonial:
                    "Il pricing dinamico e le strategie anti-stagionalità hanno trasformato il nostro business. Ora gestiamo le tariffe con dati oggettivi invece che a sensazione.",
                },
              ].map((caseStudy, index) => (
                <Card key={index} className="p-6 border-border">
                  <h3 className="text-xl font-bold mb-2 text-foreground">{caseStudy.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{caseStudy.rooms}</p>
                  <div className="space-y-4 mb-6">
                    {caseStudy.results.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-sm text-muted-foreground">{result.label}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary-blue">{result.value}</span>
                          <span className="text-xs text-muted-foreground block">{result.period}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <blockquote className="italic text-sm text-muted-foreground border-l-4 border-primary-blue pl-4">
                    "{caseStudy.testimonial}"
                  </blockquote>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Piani Tariffari per Agriturismi
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Starter",
                  price: "€299",
                  period: "al mese",
                  ideal: "Fino a 8 camere",
                  features: [
                    "Setup iniziale e analisi",
                    "Pricing strategy base",
                    "Gestione 2 canali OTA",
                    "Report mensile",
                    "Email support",
                  ],
                },
                {
                  name: "Professional",
                  price: "€499",
                  period: "al mese",
                  ideal: "8-15 camere",
                  features: [
                    "Tutto di Starter +",
                    "Pricing dinamico avanzato",
                    "Multi-canale illimitato",
                    "Ottimizzazione revenue mix",
                    "Report settimanale",
                    "Supporto prioritario",
                  ],
                  highlighted: true,
                },
                {
                  name: "Performance",
                  price: "8-12%",
                  period: "su incremento revenue",
                  ideal: "Oltre 15 camere",
                  features: [
                    "Zero costi fissi",
                    "Tutto di Professional +",
                    "Forecasting avanzato",
                    "Consulenza strategica",
                    "Formazione team",
                    "Dashboard real-time",
                  ],
                },
              ].map((plan, index) => (
                <Card
                  key={index}
                  className={`p-6 ${plan.highlighted ? "border-2 border-primary-blue shadow-lg" : "border-border"}`}
                >
                  {plan.highlighted && (
                    <div className="bg-primary-blue text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                      PIÙ SCELTO
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-primary-blue">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.ideal}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary-blue flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="#contatti">
                    <Button className={`w-full ${plan.highlighted ? "bg-primary-blue hover:bg-primary-blue/90" : ""}`}>
                      Richiedi Preventivo
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section id="contatti" className="py-20 px-4 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
              Pronto a Massimizzare i Ricavi del Tuo Agriturismo?
            </h2>
            <p className="text-xl mb-8 text-pretty opacity-90 max-w-2xl mx-auto">
              Analisi gratuita della tua situazione attuale e consulenza personalizzata. Scopri quanto puoi aumentare i
              tuoi ricavi.
            </p>
            <Link href="/#contatti">
              <Button size="lg" className="bg-yellow text-foreground hover:bg-yellow/90 font-semibold">
                Richiedi Analisi Gratuita
              </Button>
            </Link>
            <p className="text-sm mt-6 opacity-75">
              Nessun impegno • Risposta entro 24 ore • Consulenza personalizzata
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
