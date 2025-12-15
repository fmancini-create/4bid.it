import Link from "next/link"
import { TrendingUp, BarChart3, Target, Zap, CheckCircle2, Calculator, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Ottimizzazione RevPAR Hotel - Strategie per Massimizzare il Revenue per Available Room | 4BID.IT",
  description:
    "Ottimizza il RevPAR del tuo hotel con strategie avanzate di Revenue Management. Aumenta occupazione e tariffe medie per massimizzare i ricavi totali. Consulenza specializzata RevPAR.",
  keywords:
    "ottimizzazione revpar, revenue per available room, aumentare revpar hotel, strategie revpar, massimizzare revpar, revenue management revpar",
}

export default function OttimizzazioneRevparHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="ottimizzazione-revpar-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Ottimizzazione RevPAR Hotel: Massimizza il Revenue per Available Room
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Aumenta il RevPAR del tuo hotel del 25-40% con strategie avanzate che ottimizzano sia occupazione che
              tariffe medie. Il KPI che conta davvero.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Analisi RevPAR Gratuita
                </Button>
              </Link>
              <Link href="/kpi-hotel-revenue-management">
                <Button size="lg" variant="outline">
                  Tutti i KPI Hotel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RevPAR Calculator */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 border-2 border-yellow rounded-2xl p-10">
              <Calculator className="h-14 w-14 text-yellow mb-6" />
              <h2 className="text-3xl font-bold text-foreground mb-4">Come si Calcola il RevPAR</h2>
              <p className="text-muted-foreground mb-8">
                Il Revenue Per Available Room è il KPI più importante nel Revenue Management. Ecco come si calcola e
                cosa ti dice sulla performance del tuo hotel:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h4 className="font-bold text-foreground mb-3">Formula 1: Occupazione × ADR</h4>
                  <div className="bg-muted rounded-lg p-4 mb-4 font-mono text-sm">RevPAR = Occupazione% × ADR</div>
                  <p className="text-sm text-muted-foreground mb-3">Esempio:</p>
                  <p className="text-sm text-muted-foreground">65% × €180 = €117 RevPAR</p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <h4 className="font-bold text-foreground mb-3">Formula 2: Ricavi / Camere Disponibili</h4>
                  <div className="bg-muted rounded-lg p-4 mb-4 font-mono text-sm">
                    RevPAR = Ricavi Totali / Tot Camere
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Esempio:</p>
                  <p className="text-sm text-muted-foreground">€3.510 / 30 camere = €117 RevPAR</p>
                </div>
              </div>

              <div className="bg-primary-blue/10 rounded-xl p-6">
                <h4 className="font-bold text-foreground mb-3">Perché il RevPAR è il KPI Più Importante?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">Bilancia occupazione e tariffe</strong> - Non puoi avere 100%
                      occupazione a €50 né 20% occupazione a €500
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">Misura performance totale</strong> - Riflette ricavi reali per
                      camera disponibile
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">Comparabile con concorrenti</strong> - Benchmark standard del
                      settore per competitive analysis
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Le 7 Leve per Aumentare il RevPAR */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Le 7 Leve per Aumentare il RevPAR</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Strategie concrete per agire su entrambi i componenti del RevPAR: occupazione e tariffe medie
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "1. Dynamic Pricing",
                impact: "+15-22% RevPAR",
                description:
                  "Adatta tariffe in tempo reale per massimizzare revenue su ogni data. Vendi a prezzi alti nei periodi di alta domanda e stimola booking nei periodi deboli.",
              },
              {
                icon: Target,
                title: "2. Forecast Accurato",
                impact: "+10-15% RevPAR",
                description:
                  "Anticipa domanda con precisione 90%+ per prendere decisioni strategiche su pricing e inventory. Ottimizza yield senza lasciare soldi sul tavolo.",
              },
              {
                icon: Zap,
                title: "3. Channel Mix Optimization",
                impact: "+8-12% RevPAR",
                description:
                  "Bilancia OTA, direct booking e corporate per massimizzare visibilità mantenendo margini sani. Focus su canali ad alto valore.",
              },
              {
                icon: BarChart3,
                title: "4. Segmentazione Avanzata",
                impact: "+12-18% RevPAR",
                description:
                  "Crea strategie tariffarie diverse per leisure, business, gruppi. Ogni segmento ha diversa elasticità al prezzo e booking behavior.",
              },
              {
                icon: Award,
                title: "5. Length of Stay Management",
                impact: "+9-14% RevPAR",
                description:
                  "Minimum stay su date strategiche + incentivi per soggiorni lunghi. Ottimizza revenue complessivo riducendo costi operativi.",
              },
              {
                icon: TrendingUp,
                title: "6. Upselling Sistematico",
                impact: "+15-25% ancillary",
                description:
                  "Upgrade camere, pacchetti esperienziali, servizi premium. Ogni euro di upselling migliora direttamente il RevPAR.",
              },
              {
                icon: CheckCircle2,
                title: "7. Competitive Set Monitoring",
                impact: "+10-16% RevPAR",
                description:
                  "Monitora quotidianamente competitor rates e posizionamento. Mantieni rate positioning ottimale per massimizzare market share.",
              },
            ].map((strategy, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                <strategy.icon className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-2">{strategy.title}</h3>
                <div className="inline-block bg-primary-blue/10 text-primary-blue px-3 py-1 rounded-full text-xs font-semibold mb-3">
                  {strategy.impact}
                </div>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RevPAR Index & RGI */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              RevPAR Index (RGI): Il Tuo Posizionamento Competitivo
            </h2>

            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-10 border-2 border-primary-blue/20 mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-foreground mb-4">Come Funziona l'RGI</h4>
                  <div className="bg-muted rounded-lg p-4 mb-4 font-mono text-sm">
                    RGI = (Tuo RevPAR / RevPAR Competset) × 100
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <strong className="text-foreground">RGI = 100:</strong> Performance allineata al mercato
                    </li>
                    <li>
                      <strong className="text-foreground">RGI {">"} 100:</strong> Sovraperformi il competitive set
                    </li>
                    <li>
                      <strong className="text-foreground">RGI {"<"} 100:</strong> Sottoperformi il competitive set
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-4">Esempio Pratico</h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-card rounded-lg p-4">
                      <p className="text-muted-foreground mb-1">Tuo Hotel:</p>
                      <p className="text-xl font-bold text-foreground">€125 RevPAR</p>
                    </div>
                    <div className="bg-card rounded-lg p-4">
                      <p className="text-muted-foreground mb-1">Competitive Set:</p>
                      <p className="text-xl font-bold text-foreground">€115 RevPAR</p>
                    </div>
                    <div className="bg-primary-blue/20 rounded-lg p-4">
                      <p className="text-muted-foreground mb-1">RGI:</p>
                      <p className="text-2xl font-bold text-primary-blue">108.7</p>
                      <p className="text-xs text-muted-foreground mt-1">Stai guadagnando 8.7% in più del mercato</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow/10 border-2 border-yellow rounded-xl p-8">
              <h4 className="font-bold text-foreground mb-4">Obiettivo: RGI {">"} 105</h4>
              <p className="text-muted-foreground mb-4">
                Un RGI superiore a 105 significa che stai catturando market share dai tuoi concorrenti. È il segno di
                una strategia di Revenue Management efficace.
              </p>
              <p className="text-sm text-muted-foreground">
                Con SANTADDEO monitori RGI in tempo reale e ricevi alert automatici quando scendi sotto benchmark.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-card rounded-2xl p-10 shadow-xl border border-border">
            <Award className="h-14 w-14 text-primary-blue mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Case Study: Hotel 4 Stelle Firenze (48 camere)</h2>
            <p className="text-muted-foreground mb-8">
              Come abbiamo aumentato il RevPAR del 32% in 10 mesi ottimizzando tutte le 7 leve strategiche
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-destructive/10 rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">RevPAR Iniziale</p>
                <p className="text-4xl font-bold text-foreground">€98</p>
              </div>
              <div className="bg-primary-blue/10 rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">RevPAR Finale</p>
                <p className="text-4xl font-bold text-foreground">€129</p>
              </div>
              <div className="bg-yellow/10 rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Incremento</p>
                <p className="text-4xl font-bold text-yellow">+32%</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground">Breakdown dell'Incremento:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Occupazione:</p>
                  <p className="text-sm text-muted-foreground">62.3% → 68.5% (+6.2pp)</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">ADR:</p>
                  <p className="text-sm text-muted-foreground">€157 → €188 (+20%)</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">RGI:</p>
                  <p className="text-sm text-muted-foreground">94.2 → 112.8 (+18.6 punti)</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Revenue Incrementale:</p>
                  <p className="text-sm text-muted-foreground">+€178k/anno</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto ad Ottimizzare il RevPAR del Tuo Hotel?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Richiedi un'analisi RevPAR gratuita. Analizzeremo la tua performance attuale vs competitive set e ti
            mostreremo il potenziale di crescita.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" variant="secondary">
                Analisi RevPAR Gratuita
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
