import Link from "next/link"
import { Building2, TrendingUp, Users, BarChart3, CheckCircle2, Network, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Revenue Management per Catene Alberghiere | Gestione Multi-Property | 4BID.IT",
  description:
    "Soluzioni di Revenue Management per catene hotel e gruppi alberghieri. Centralizzazione strategie, ottimizzazione multi-property, economia di scala e performance superiori.",
  keywords:
    "revenue management catene hotel, gestione multi property, cluster management hotel, revenue strategy gruppi alberghieri, centralizzazione pricing hotel",
  alternates: {
    canonical: "https://4bid.it/revenue-management-catene-hotel",
  },
}

export default function RevenueManagementCateneHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Revenue Management per Catene Alberghiere"
        description="Soluzioni di Revenue Management per catene hotel e gruppi alberghieri. Centralizzazione strategie, ottimizzazione multi-property, economia di scala."
        url="https://4bid.it/revenue-management-catene-hotel"
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Revenue Management Catene Hotel", url: "https://4bid.it/revenue-management-catene-hotel" },
        ]}
      />
      <LandingPageTracker slug="revenue-management-catene-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Building2 className="h-16 w-16 mx-auto mb-6 text-primary-blue" />
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Revenue Management per Catene Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Soluzioni scalabili di Revenue Management per catene alberghiere e gruppi multi-property. Centralizzazione
              strategica, ottimizzazione cluster e performance superiori con economia di scala.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Demo Multi-Property
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO Enterprise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Le Sfide delle Catene Alberghiere</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-md border border-border">
              <Network className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Gestione Decentralizzata</h3>
              <p className="text-muted-foreground text-sm">
                Ogni property gestisce prezzi e strategie in autonomia, creando inefficienze, pricing inconsistente e
                mancanza di sinergie tra strutture dello stesso gruppo.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-md border border-border">
              <Database className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Dati Frammentati</h3>
              <p className="text-muted-foreground text-sm">
                Sistemi diversi per ogni hotel rendono impossibile avere una vista consolidata delle performance,
                forecast accurati e benchmarking interno efficace tra le property.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-md border border-border">
              <Users className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Risorse Sottoutilizzate</h3>
              <p className="text-muted-foreground text-sm">
                Ogni hotel necessita di un revenue manager dedicato, moltiplicando i costi. Difficile garantire standard
                qualitativi uniformi e formazione continua del personale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">La Soluzione Cluster Management</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Un approccio centralizzato e scalabile per massimizzare le performance di tutte le property del gruppo
          </p>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border-2 border-primary-blue/20">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-primary-blue" />
                Centralizzazione Strategica
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Revenue Team Centralizzato:</strong> expertise condivisa per tutte le property
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Strategie Coordinate:</strong> pricing coerente e sinergie tra hotel dello stesso cluster
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Best Practice Condivise:</strong> implementazione rapida di strategie vincenti su tutte le
                    property
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Riduzione Costi:</strong> economia di scala su software, formazione e consulenza
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 border-2 border-primary-blue/20">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary-blue" />
                Tecnologia Enterprise
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Dashboard Consolidata:</strong> vista unica di tutte le performance del gruppo
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Forecast Multi-Property:</strong> previsioni accurate aggregate e per singola property
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Benchmarking Interno:</strong> confronto performance tra hotel simili del gruppo
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Automation Scalabile:</strong> pricing automatizzato con regole centralizzate
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Chains */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Funzionalità Specifiche per Gruppi Alberghieri
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Cluster Analysis",
                description: "Raggruppamento intelligente di property simili per strategie coordinate e benchmarking",
              },
              {
                title: "Corporate Accounts",
                description:
                  "Gestione centralizzata contratti corporate con visibilità su tutte le property del gruppo",
              },
              {
                title: "Group Displacement",
                description: "Analisi impatto gruppi su RevPAR e ottimizzazione mix business tra gruppi e transient",
              },
              {
                title: "Multi-Property Reporting",
                description: "Report consolidati con drill-down per singola property, comparazione e trend analysis",
              },
              {
                title: "Centralized Rate Management",
                description: "Gestione centralizzata di rate codes, restrizioni e promozioni su tutte le property",
              },
              {
                title: "Unified Competitive Set",
                description: "Competitive set intelligenti con benchmark interno ed esterno per ogni cluster",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <BarChart3 className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Case Study: Catena Boutique 7 Hotel</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <p className="text-lg mb-4 opacity-90">
                Gruppo boutique con 7 hotel (4 città, 3 mare) per un totale di 215 camere. Gestione decentralizzata con
                5 revenue manager part-time e sistemi diversi per ogni property.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Prima della centralizzazione</p>
                  <p className="text-2xl font-bold">RevPAR €82</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Dopo 18 mesi</p>
                  <p className="text-2xl font-bold">RevPAR €107</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Incremento</p>
                  <p className="text-2xl font-bold text-yellow">+30.5%</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Risultati Operativi</h3>
                <ul className="space-y-2 text-sm opacity-90">
                  <li>• Riduzione costi RM del 42% con team centralizzato</li>
                  <li>• Risparmio software e tool €24k/anno (licenze unificate)</li>
                  <li>• Aumento ADR medio +18% su tutte le property</li>
                  <li>• Occupazione stabile (+2pp) con pricing più alto</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Benefici Strategici</h3>
                <ul className="space-y-2 text-sm opacity-90">
                  <li>• Standard qualità uniformi su tutte le 7 property</li>
                  <li>• Forecast accuracy migliorata da 73% a 91%</li>
                  <li>• Tempo decisionale ridotto del 65%</li>
                  <li>• Best practice replicate velocemente su cluster</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">ROI per Gruppi Alberghieri</h2>
          <div className="max-w-3xl mx-auto bg-card rounded-2xl p-8 shadow-lg border border-border">
            <p className="text-muted-foreground mb-6 text-center">
              Stima conservativa del valore generato dalla centralizzazione del Revenue Management
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <span className="font-medium">5 Hotel x 40 Camere (200 tot)</span>
                <span className="text-2xl font-bold text-primary-blue">+€280k/anno</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <span className="font-medium">10 Hotel x 35 Camere (350 tot)</span>
                <span className="text-2xl font-bold text-primary-blue">+€520k/anno</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <span className="font-medium">20 Hotel x 50 Camere (1000 tot)</span>
                <span className="text-2xl font-bold text-primary-blue">+€1.8M/anno</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-6 text-center">
              Calcolo basato su incremento RevPAR +25%, riduzione costi RM -35% e risparmio tecnologia. Risultati
              effettivi possono variare.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Scala il Revenue Management del Tuo Gruppo</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una demo personalizzata di SANTADDEO Enterprise. Ti mostreremo come centralizzare le strategie e
            massimizzare le performance di tutte le tue property.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                Richiedi Demo Enterprise
              </Button>
            </Link>
            <Link href="/progetti/santaddeo">
              <Button size="lg" variant="outline">
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
