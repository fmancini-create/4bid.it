import Link from "next/link"
import { MapPin, TrendingUp, Target, BarChart3, CheckCircle2, Euro, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Ottimizzazione Prezzi Hotel in Toscana | Revenue Management",
  description:
    "Servizio specializzato di ottimizzazione prezzi per hotel in Toscana. Aumenta RevPAR e ADR con strategie di pricing dinamico personalizzate per il mercato toscano.",
  keywords:
    "ottimizzazione prezzi hotel toscana, revenue management toscana, hotel firenze prezzi, hotel siena revenue, pricing dinamico toscana",
}

export default function OttimizzazionePrezziToscanaPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="ottimizzazione-prezzi-hotel-toscana" />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-8 w-8 text-primary-blue" />
              <span className="text-primary-blue font-semibold">Focus Toscana</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Ottimizzazione Prezzi Hotel in Toscana
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Esperti locali di Revenue Management per hotel toscani. Conosciamo il mercato di Firenze, Siena, Chianti e
              tutta la Toscana per massimizzare i tuoi ricavi.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Analisi Gratuita
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO RMS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Local Expertise */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Perché Scegliere un Esperto Locale</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <MapPin className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Conoscenza del Territorio</h3>
              <p className="text-muted-foreground">
                Conosciamo eventi, stagionalità e dinamiche specifiche del mercato turistico toscano, da Firenze alla
                Val d'Orcia.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Analisi Competitiva Locale</h3>
              <p className="text-muted-foreground">
                Monitoriamo costantemente i prezzi e le strategie dei tuoi competitor diretti in Toscana per
                posizionarti al meglio.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Network Consolidato</h3>
              <p className="text-muted-foreground">
                Collaboriamo con oltre 30 strutture ricettive in Toscana, dal boutique hotel all'agriturismo di charme.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Toscana Market Specifics */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Le Sfide del Mercato Toscano</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Caratteristiche Uniche</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Alta Stagionalità</p>
                    <p className="text-sm text-muted-foreground">
                      Primavera e autunno ad alta domanda, necessità di strategie diverse per bassa stagione
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Eventi e Fiere</p>
                    <p className="text-sm text-muted-foreground">
                      Pitti Uomo, Biennale, festival enogastronomici richiedono pricing dinamico accurato
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Competizione Intensa</p>
                    <p className="text-sm text-muted-foreground">
                      Mercato saturo con centinaia di strutture che competono per gli stessi segmenti
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Segmenti Diversificati</p>
                    <p className="text-sm text-muted-foreground">
                      Da coppie romantiche a gruppi, da business a turismo culturale ed enogastronomico
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Le Nostre Soluzioni</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Pricing Stagionale Ottimizzato</p>
                    <p className="text-sm text-muted-foreground">
                      Tariffe calibrate per ogni periodo, da gennaio ad agosto, massimizzando RevPAR tutto l'anno
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Event-Based Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      Monitoraggio eventi locali e adeguamento automatico delle tariffe per massimizzare l'occupazione
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Competitive Intelligence</p>
                    <p className="text-sm text-muted-foreground">
                      Analisi quotidiana dei prezzi dei competitor nel tuo compset per un posizionamento strategico
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Segmentazione Avanzata</p>
                    <p className="text-sm text-muted-foreground">
                      Strategie differenziate per ogni segmento di clientela e canale di distribuzione
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Toscana */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Success Stories in Toscana</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Risultati concreti ottenuti con hotel e agriturismi in tutta la regione
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary-blue" />
                <span className="text-sm font-semibold text-primary-blue">Firenze Centro</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Boutique Hotel 4*</h3>
              <p className="text-sm text-muted-foreground mb-4">28 camere, zona Duomo</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RevPAR</span>
                  <span className="text-lg font-bold text-primary-blue">+35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ADR</span>
                  <span className="text-lg font-bold text-primary-blue">+28%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Occupazione</span>
                  <span className="text-lg font-bold text-primary-blue">+6%</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary-blue" />
                <span className="text-sm font-semibold text-primary-blue">Chianti</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Agriturismo Charme</h3>
              <p className="text-sm text-muted-foreground mb-4">12 camere, borgo storico</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RevPAR</span>
                  <span className="text-lg font-bold text-primary-blue">+42%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ADR</span>
                  <span className="text-lg font-bold text-primary-blue">+38%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Direct Booking</span>
                  <span className="text-lg font-bold text-primary-blue">+55%</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary-blue" />
                <span className="text-sm font-semibold text-primary-blue">Val d'Orcia</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">Resort 5*</h3>
              <p className="text-sm text-muted-foreground mb-4">45 camere, spa e ristorante</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RevPAR</span>
                  <span className="text-lg font-bold text-primary-blue">+31%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ADR</span>
                  <span className="text-lg font-bold text-primary-blue">+25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ancillary Revenue</span>
                  <span className="text-lg font-bold text-primary-blue">+48%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Specific */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">I Nostri Servizi per la Toscana</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Market Analysis Toscana",
                description: "Analisi approfondita del mercato locale con focus su competitor set e trend regionali",
              },
              {
                title: "Dynamic Pricing",
                description: "Tariffe ottimizzate in tempo reale basate su eventi, fiere e stagionalità toscana",
              },
              {
                title: "OTA Optimization",
                description: "Gestione strategica di Booking.com, Expedia e piattaforme specializzate in Toscana",
              },
              {
                title: "Direct Booking Strategy",
                description: "Strategie per incrementare prenotazioni dirette riducendo le commissioni OTA",
              },
              {
                title: "Upselling & Packages",
                description: "Creazione pacchetti tematici (wine tour, spa, cultura) per aumentare ricavi ancillari",
              },
              {
                title: "Reporting & KPI",
                description: "Dashboard personalizzate con metriche specifiche e benchmark vs mercato toscano",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <BarChart3 className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Collaborazione Zero Rischio</h2>
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-10 border-2 border-primary-blue/20">
            <div className="flex items-center gap-3 mb-6">
              <Euro className="h-12 w-12 text-primary-blue" />
              <h3 className="text-2xl font-bold text-foreground">Performance Based Fee</h3>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              Paghi solo una percentuale calcolata sull'incremento di fatturato generato. Nessun costo fisso, massimo
              allineamento di interessi.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Zero investimento iniziale richiesto</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Trasparenza totale con reporting mensile dettagliato</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Contratto flessibile con clausola di uscita semplificata</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Supporto continuo e formazione del team inclusi</span>
              </li>
            </ul>
            <Link href="/#contact">
              <Button size="lg" className="w-full bg-primary-blue hover:bg-primary-blue/90">
                Richiedi Analisi Gratuita
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Il Tuo Hotel in Toscana Merita di Più</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Lavoriamo con le migliori strutture ricettive toscane per ottimizzare pricing e massimizzare ricavi.
            Unisciti a loro.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" variant="secondary">
                Richiedi Consulenza
              </Button>
            </Link>
            <Link href="/progetti/santaddeo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 bg-transparent">
                Scopri SANTADDEO
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
