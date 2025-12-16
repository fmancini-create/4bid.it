import Link from "next/link"
import { Hotel, Heart, TrendingUp, Users, CheckCircle2, Award, Euro, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Revenue Management Boutique Hotel | Strategie per Hotel di Charme | 4BID.IT",
  description:
    "Revenue Management specializzato per boutique hotel e hotel di charme. Strategie su misura che valorizzano unicità, esperienza guest e posizionamento premium.",
  keywords:
    "revenue management boutique hotel, hotel di charme, piccoli hotel lusso, revenue management hotel indipendenti, strategie pricing boutique, hotel design",
}

export default function RevenueManagementBoutiqueHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="revenue-management-boutique-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Hotel className="h-16 w-16 text-primary-blue" />
              <Heart className="h-12 w-12 text-yellow" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Revenue Management per Boutique Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Strategie di Revenue Management su misura per hotel di charme e boutique hotel che valorizzano l'unicità,
              l'esperienza guest e il posizionamento premium della tua struttura.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Consulenza Personalizzata
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Boutique Hotels Need Specialized RM */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">
            Perché i Boutique Hotel Necessitano di Strategie Dedicate
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Le strategie standard non funzionano per hotel con forte identità e proposte uniche
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Heart className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Unicità vs Commoditizzazione</h3>
              <p className="text-muted-foreground">
                I boutique hotel vendono un'esperienza unica, non solo un letto. Il pricing deve riflettere il valore
                esperienziale e storytelling, non solo metratura e servizi.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Users className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Clientela Selezionata</h3>
              <p className="text-muted-foreground">
                Gli ospiti di boutique hotel cercano autenticità e design. La strategia di revenue deve attrarre il
                target giusto disposto a pagare un premium per l'unicità.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Award className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Posizionamento Premium</h3>
              <p className="text-muted-foreground">
                Non competere su prezzo con catene standardizzate. Il revenue management valorizza il premium
                positioning mantenendo coerenza con il brand e la promessa.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Target className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Inventory Limitato</h3>
              <p className="text-muted-foreground">
                Con 10-30 camere, ogni vendita conta. Serve massima precisione nel forecast e nella gestione di ogni
                singola camera per ottimizzare ogni opportunità.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <TrendingUp className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Total Revenue Approach</h3>
              <p className="text-muted-foreground">
                Oltre alle camere: ristorante gourmet, spa boutique, esperienze uniche. Il revenue management integra
                tutti i revenue stream per massimizzare TRevPAR.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <Hotel className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Gestione Indipendente</h3>
              <p className="text-muted-foreground">
                Senza supporto di brand internazionali, serve consulenza esperta che comprenda dinamiche uniche e sfide
                specifiche degli hotel indipendenti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Il Nostro Approccio per Boutique Hotel
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                title: "Brand Value Pricing",
                description:
                  "Sviluppiamo strategie che riflettono il valore del brand, la storia e l'identità unica del boutique hotel, evitando race-to-the-bottom con competitor standardizzati.",
              },
              {
                title: "Segmentazione Avanzata",
                description:
                  "Identifichiamo e targhetizziamo micro-segmenti di clientela premium disposti a pagare per esperienze autentiche: coppie, viaggiatori indipendenti, design lovers.",
              },
              {
                title: "Direct Booking Focus",
                description:
                  "Massimizziamo prenotazioni dirette per proteggere margini e costruire relazioni dirette con gli ospiti, riducendo dipendenza da OTA che commoditizzano l'offerta.",
              },
              {
                title: "Total Revenue Management",
                description:
                  "Ottimizziamo ricavi da tutte le fonti: camere, F&B, spa, esperienze, packages. Approccio olistico che considera il customer journey completo.",
              },
              {
                title: "Seasonal Storytelling",
                description:
                  "Creiamo narrative stagionali e pacchetti esperienziali che giustificano premium pricing e attirano ospiti in cerca di momenti unici e memorabili.",
              },
              {
                title: "Reputation Management Integration",
                description:
                  "Integriamo gestione reputazione online con strategie di pricing. Review eccellenti permettono di sostenere tariffe premium e attrarre clientela target.",
              },
            ].map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-lg border border-border">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-card-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Case Study: Boutique Hotel Toscana</h2>
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border-2 border-primary-blue/20">
            <div className="mb-6">
              <p className="text-lg text-muted-foreground mb-4">
                <strong className="text-foreground">Profilo:</strong> Boutique hotel 18 camere in borgo medievale
                toscano, posizionamento luxury, ristorante stellato, clientela internazionale premium
              </p>
              <p className="text-lg text-muted-foreground">
                <strong className="text-foreground">Sfida:</strong> Bassa occupazione mesi spalla, pricing
                inconsistente, forte dipendenza da OTA luxury (60% prenotazioni)
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Interventi Implementati</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Sviluppo brand value pricing basato su unicità location e design
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Creazione pacchetti esperienziali stagionali (degustazioni vino, cooking class)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Strategia direct booking con rate parity management aggressivo
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Total revenue approach integrando F&B, spa e esperienze</span>
                </li>
              </ul>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary-blue mb-1">+43%</p>
                <p className="text-sm text-muted-foreground">ADR Medio</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary-blue mb-1">+22%</p>
                <p className="text-sm text-muted-foreground">Occupazione Annua</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary-blue mb-1">48%</p>
                <p className="text-sm text-muted-foreground">Direct Booking (da 40%)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Investimento e ROI</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-xl border border-border mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <Euro className="h-12 w-12 text-primary-blue mb-4" />
                  <h3 className="text-2xl font-bold text-card-foreground mb-4">Consulenza Boutique Hotel</h3>
                  <p className="text-muted-foreground mb-4">
                    Servizio su misura con affiancamento dedicato, formazione del team e implementazione graduale delle
                    strategie.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                      <span className="text-sm">Audit completo posizionamento e pricing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                      <span className="text-sm">Strategia brand value pricing personalizzata</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                      <span className="text-sm">Formazione owner/GM su revenue management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                      <span className="text-sm">Setup tools e monitoring mensile</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary-blue/5 to-blue-grey/5 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-foreground mb-4">ROI Atteso</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Incremento ADR Medio</p>
                      <p className="text-2xl font-bold text-primary-blue">+30-45%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Aumento Occupazione</p>
                      <p className="text-2xl font-bold text-primary-blue">+15-25%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                      <p className="text-2xl font-bold text-primary-blue">2-4 mesi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                Disponibile anche modello performance-based per boutique hotel che preferiscono pagare solo sui
                risultati ottenuti
              </p>
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Preventivo Personalizzato
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <Hotel className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Valorizza l'Unicità del Tuo Boutique Hotel</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Richiedi una consulenza personalizzata per scoprire come massimizzare i ricavi mantenendo l'autenticità e il
            posizionamento premium della tua struttura.
          </p>
          <Link href="/#contact">
            <Button size="lg" variant="secondary" className="bg-white text-primary-blue hover:bg-white/90">
              Richiedi Consulenza Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
