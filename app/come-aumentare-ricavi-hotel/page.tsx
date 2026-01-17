import Link from "next/link"
import { TrendingUp, DollarSign, Users, Calendar, Trophy, CheckCircle2, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Come Aumentare i Ricavi del Tuo Hotel - Guida Pratica 2025 | 4BID.IT",
  description:
    "Guida completa su come aumentare i ricavi del tuo hotel: strategie di Revenue Management, ottimizzazione tariffe, direct booking e molto altro. Risultati concreti in 30 giorni.",
  keywords:
    "aumentare ricavi hotel, revenue hotel, fatturato hotel, guadagni hotel, come aumentare profitti hotel, strategie ricavi alberghieri",
  openGraph: {
    title: "Come Aumentare i Ricavi del Tuo Hotel - Guida Pratica 2025 | 4BID.IT",
    description: "10 strategie comprovate per incrementare il fatturato del tuo hotel dal 25% al 40%.",
    url: "https://www.4bid.it/come-aumentare-ricavi-hotel",
    type: "article",
  },
  alternates: {
    canonical: "https://www.4bid.it/come-aumentare-ricavi-hotel",
  },
}

const faqData = [
  {
    question: "Quali sono le strategie più efficaci per aumentare i ricavi di un hotel?",
    answer:
      "Le strategie più efficaci sono: dynamic pricing strategico, ottimizzazione del mix tariffario, segmentazione avanzata dei clienti, forecast e capacity control, aumento delle prenotazioni dirette, upselling e cross-selling sistematico, length of stay management ed event-based revenue strategy.",
  },
  {
    question: "In quanto tempo si vedono i risultati delle strategie revenue?",
    answer:
      "Con le quick wins si possono vedere risultati in 30 giorni: +15-20% prenotazioni dirette, +12% durata media soggiorno, +8-10% RevPAR. Risultati più significativi (+25-40% ricavi) richiedono 6-12 mesi di implementazione strutturata.",
  },
  {
    question: "Quanto può risparmiare un hotel riducendo le commissioni OTA?",
    answer:
      "Un hotel può risparmiare €25.000-40.000 all'anno riducendo la dipendenza dalle OTA e aumentando le prenotazioni dirette del 30-50%. Questo si ottiene con strategie di direct booking, loyalty program e marketing diretto.",
  },
]

export default function ComeAumentareRicaviHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Come Aumentare i Ricavi del Tuo Hotel - Guida Pratica 2025"
        description="10 strategie comprovate per incrementare il fatturato del tuo hotel"
        faq={faqData}
      />
      <LandingPageTracker slug="come-aumentare-ricavi-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Come Aumentare i Ricavi del Tuo Hotel: La Guida Completa 2025
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              10 strategie comprovate per incrementare il fatturato del tuo hotel dal 25% al 40%. Azioni concrete,
              risultati misurabili, nessuna teoria.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Analisi Gratuita Revenue
                </Button>
              </Link>
              <Link href="/consulenza-revenue-management-hotel">
                <Button size="lg" variant="outline">
                  Scopri i Nostri Servizi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Wins */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow/10 border-2 border-yellow rounded-2xl p-8 mb-12">
              <Clock className="h-12 w-12 text-yellow mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-4">Quick Wins - Risultati in 30 Giorni</h2>
              <p className="text-muted-foreground mb-6">
                5 azioni immediate che puoi implementare oggi per vedere i primi risultati entro un mese:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-yellow mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Elimina la parità tariffaria</strong>
                    <p className="text-muted-foreground">
                      Offri sul sito diretto almeno 5-10% di sconto rispetto alle OTA. Risultato atteso: +15-20%
                      prenotazioni dirette
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-yellow mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Implementa tariffe differenziate per LOS</strong>
                    <p className="text-muted-foreground">
                      Premia i soggiorni lunghi con tariffe più basse. Risultato atteso: +12% durata media soggiorno
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-yellow mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Aggiungi 3 restrizioni minimo soggiorno</strong>
                    <p className="text-muted-foreground">
                      Definisci min stay per weekend, festivi e alta stagione. Risultato atteso: +8-10% RevPAR
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-yellow mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Crea pacchetti esperienza</strong>
                    <p className="text-muted-foreground">
                      Combina camera + servizi aggiuntivi in un'unica offerta premium. Risultato atteso: +20% ricavi
                      ancillari
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-yellow mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Automatizza il follow-up pre-arrivo</strong>
                    <p className="text-muted-foreground">
                      Email 48h prima con upselling (upgrade, cena, spa). Risultato atteso: +15-18% upselling success
                      rate
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 10 Strategie */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">
            Le 10 Strategie Fondamentali per Aumentare i Ricavi
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Ogni strategia include azioni concrete, KPI da monitorare e risultati attesi basati su case study reali
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "1. Dynamic Pricing Strategico",
                impact: "+18-25% RevPAR",
                description:
                  "Adatta i prezzi in tempo reale in base a domanda, eventi, meteo e comportamento concorrenti",
                actions: [
                  "Implementa software RMS o regole di pricing dinamico",
                  "Monitora quotidianamente pickup e competitor rates",
                  "Definisci 3-5 fasce tariffarie per ogni periodo",
                ],
              },
              {
                icon: DollarSign,
                title: "2. Ottimizzazione Mix Tariffario",
                impact: "+12-15% ADR",
                description: "Crea una struttura tariffaria che massimizzi il valore percepito e l'ancillary revenue",
                actions: [
                  "Disegna 4-6 rate plans con benefit incrementali",
                  "Implementa fences (cancellazione, prepagamento)",
                  "Testa tariffe non-refundable vs flexible",
                ],
              },
              {
                icon: Users,
                title: "3. Segmentazione Avanzata",
                impact: "+10-14% occupazione",
                description: "Targettizza diversi segmenti con offerte personalizzate e canali ottimizzati",
                actions: [
                  "Analizza booking window per segmento (leisure, business, gruppi)",
                  "Crea campagne dedicate per corporate e bleisure",
                  "Ottimizza channel mix per segmento target",
                ],
              },
              {
                icon: Calendar,
                title: "4. Forecast & Capacity Control",
                impact: "+8-12% RevPAR",
                description: "Anticipa la domanda e gestisci l'inventario con strategie di overbooking calcolate",
                actions: [
                  "Costruisci forecast rolling 365 giorni",
                  "Implementa overbooking controllato (2-5%)",
                  "Definisci strategy basata su pickup rate",
                ],
              },
              {
                icon: Trophy,
                title: "5. Direct Booking Champions",
                impact: "Risparmio €25-40k/anno",
                description: "Riduci la dipendenza dalle OTA aumentando le prenotazioni dirette del 30-50%",
                actions: [
                  "Garantisci Best Rate sul sito diretto",
                  "Investi in Google Ads e Meta Ads",
                  "Implementa loyalty program digitale",
                ],
              },
              {
                icon: TrendingUp,
                title: "6. Upselling & Cross-Selling",
                impact: "+20-30% ancillary revenue",
                description: "Monetizza servizi aggiuntivi prima, durante e dopo il soggiorno",
                actions: [
                  "Offri upgrade camera al check-in (50-80€)",
                  "Email pre-arrivo con pacchetti spa, cena, transfer",
                  "Sistema di room upgrade automatico online",
                ],
              },
              {
                icon: CheckCircle2,
                title: "7. Length of Stay (LOS) Management",
                impact: "+10-15% RevPAR",
                description: "Ottimizza durata media soggiorno con minimum stay e tariffe differenziate",
                actions: [
                  "Definisci min stay per date ad alta domanda",
                  "Offri sconti progressivi per soggiorni lunghi",
                  "Analizza impatto LOS su costi operativi",
                ],
              },
              {
                icon: Users,
                title: "8. Ottimizzazione OTA Performance",
                impact: "Ranking top 3 = +25% bookings",
                description: "Massimizza visibilità e conversione sui portali senza aumentare commissioni",
                actions: [
                  "Mantieni content score 90+ su Booking.com",
                  "Risposta review entro 24h (guest review score)",
                  "Testa Genius program vs commissioni standard",
                ],
              },
              {
                icon: Trophy,
                title: "9. Total Revenue Management",
                impact: "+15-22% profitto netto",
                description: "Applica logiche RM anche a F&B, spa, meeting rooms e servizi accessori",
                actions: [
                  "Pricing dinamico ristorante (fasce orarie)",
                  "Pacchetti spa con tariffe variabili per giorno",
                  "Ottimizzazione revenue per meeting space",
                ],
              },
              {
                icon: Calendar,
                title: "10. Event-Based Revenue Strategy",
                impact: "+30-50% ADR in event dates",
                description: "Capitalizza su eventi locali con pricing aggressivo e minimum stay",
                actions: [
                  "Calendario eventi 12 mesi (fiere, concerti, sport)",
                  "Strategia pricing 3-6 mesi prima evento",
                  "Comunicazione proattiva con corporate per eventi",
                ],
              },
            ].map((strategy, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-8 shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                <strategy.icon className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-2xl font-bold text-card-foreground mb-2">{strategy.title}</h3>
                <div className="inline-block bg-primary-blue/10 text-primary-blue px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  {strategy.impact}
                </div>
                <p className="text-muted-foreground mb-4">{strategy.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Azioni concrete:</p>
                  <ul className="space-y-1">
                    {strategy.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-10 border-2 border-primary-blue/20">
            <Trophy className="h-14 w-14 text-primary-blue mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Case Study: Boutique Hotel Toscana (32 camere)</h2>
            <p className="text-muted-foreground mb-8">
              Come un boutique hotel in Val d'Orcia ha aumentato i ricavi del 37% in 12 mesi implementando queste 10
              strategie
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-destructive/10 rounded-xl p-6">
                <h4 className="font-bold text-foreground mb-3">Situazione Iniziale (2023)</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• RevPAR: €92</li>
                  <li>• ADR: €165</li>
                  <li>• Occupazione: 55.8%</li>
                  <li>• Direct booking: 18%</li>
                  <li>• Commissioni OTA: €47.000/anno</li>
                </ul>
              </div>

              <div className="bg-primary-blue/10 rounded-xl p-6">
                <h4 className="font-bold text-foreground mb-3">Dopo Implementazione (2024)</h4>
                <ul className="space-y-2 text-sm text-foreground">
                  <li>• RevPAR: €126 (+37%)</li>
                  <li>• ADR: €198 (+20%)</li>
                  <li>• Occupazione: 63.6% (+7.8pp)</li>
                  <li>• Direct booking: 42% (+24pp)</li>
                  <li>• Commissioni OTA: €31.000/anno (-34%)</li>
                </ul>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6">
              <h4 className="font-bold text-foreground mb-3">Strategie Chiave Implementate</h4>
              <ul className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                  <span>Dynamic pricing con SANTADDEO RMS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                  <span>Campagna Google Ads direct booking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                  <span>Upselling automatizzato pre-arrivo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                  <span>Event-based pricing per eventi locali</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                  <span>Min stay management weekend</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                  <span>Ottimizzazione revenue ristorante</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto ad Aumentare i Ricavi del Tuo Hotel?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Richiedi un'analisi gratuita del potenziale revenue del tuo hotel. Ti mostreremo esattamente quanto puoi
            aumentare i ricavi implementando le strategie giuste.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" variant="secondary">
                Analisi Revenue Gratuita
              </Button>
            </Link>
            <Link href="/progetti/santaddeo">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
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
