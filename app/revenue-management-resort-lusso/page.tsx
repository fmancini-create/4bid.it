import Link from "next/link"
import { Crown, TrendingUp, Users, Star, CheckCircle2, Sparkles, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Revenue Management Resort di Lusso | 4BID.IT",
  description:
    "Consulenza Revenue Management specializzata per resort di lusso, hotel 5 stelle e strutture premium. Strategie esclusive per massimizzare i ricavi delle strutture luxury.",
  keywords:
    "revenue management lusso, resort 5 stelle, hotel luxury, pricing premium, gestione resort, revenue manager luxury hotel, consulenza hospitality lusso",
}

export default function RevenueManagementResortLussoPage() {
  const faqData = [
    {
      question: "Quali sono le sfide specifiche del Revenue Management per resort di lusso?",
      answer:
        "Le sfide includono: gestione tariffe premium senza svalutare il brand, revenue mix complesso (camere, spa, ristoranti, esperienze), clientela VIP internazionale, eventi esclusivi, e bilanciamento tra occupazione ed esclusività.",
    },
    {
      question: "Come si ottimizza il Total Revenue in un resort 5 stelle?",
      answer:
        "L'ottimizzazione del Total Revenue include: pricing psicologico per clientela high-net-worth, pacchetti esperienziali esclusivi, gestione selettiva canali luxury (consortia, DMC premium), e ottimizzazione servizi ancillari (spa, ristorante, esperienze).",
    },
    {
      question: "Quali risultati aspettarsi dal Revenue Management luxury?",
      answer:
        "I resort luxury ottengono mediamente: +45% total revenue, +38% ADR, +52% ancillary revenue, mantenendo guest satisfaction superiore al 90%.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Revenue Management Resort di Lusso"
        description="Consulenza Revenue Management specializzata per resort di lusso, hotel 5 stelle e strutture premium. Strategie esclusive per massimizzare i ricavi delle strutture luxury."
        url="https://www.4bid.it/revenue-management-resort-lusso"
        faq={faqData}
      />
      <LandingPageTracker slug="revenue-management-resort-lusso" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-yellow/10 via-primary-blue/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Crown className="h-16 w-16 text-yellow mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Revenue Management per Resort di Lusso
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Soluzioni esclusive di Revenue Management per resort 5 stelle, hotel luxury e strutture premium. Strategie
              sofisticate per clientela d'élite e servizi esclusivi.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-yellow hover:bg-yellow/90 text-foreground">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Consulenza Esclusiva
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Value Proposition */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 rounded-xl p-8 shadow-lg border border-yellow/20">
              <Star className="h-12 w-12 text-yellow mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Esperienza Luxury</h3>
              <p className="text-muted-foreground">
                Specialisti nel segmento premium con esperienza in resort 5 stelle, spa luxury e strutture esclusive.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary-blue/10 to-primary-blue/5 rounded-xl p-8 shadow-lg border border-primary-blue/20">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Ricavi Premium</h3>
              <p className="text-muted-foreground">
                Strategie sofisticate per massimizzare ADR e RevPAR mantenendo l'esclusività e il brand positioning.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-grey/10 to-blue-grey/5 rounded-xl p-8 shadow-lg border border-blue-grey/20">
              <Award className="h-12 w-12 text-blue-grey mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Servizio Discreto</h3>
              <p className="text-muted-foreground">
                Supporto riservato e personalizzato, nel rispetto della privacy e dell'immagine della vostra struttura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Challenges */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Le Sfide del Segmento Luxury</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Crown className="h-8 w-8 text-yellow" />
                Complessità Uniche
              </h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-yellow mt-1">•</span>
                  <span>Gestione di tariffe ultra-premium senza svalutare il brand</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow mt-1">•</span>
                  <span>Revenue mix complesso: camere, suite, ville, spa, ristoranti gourmet, esperienze</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow mt-1">•</span>
                  <span>Clientela internazionale VIP con aspettative elevatissime</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow mt-1">•</span>
                  <span>Gestione di eventi esclusivi, matrimoni luxury e soggiorni su misura</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow mt-1">•</span>
                  <span>Bilanciamento tra occupazione e mantenimento dell'esclusività</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary-blue" />
                Soluzioni Premium
              </h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Strategie di pricing psicologico per clientela high-net-worth</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Ottimizzazione revenue totale includendo tutti i servizi ancillari</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Gestione selettiva dei canali di distribuzione luxury</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Pacchetti esperienziali esclusivi con pricing dinamico</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Analisi competitiva nel segmento ultra-premium</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Services */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Servizi Esclusivi</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Un approccio olistico al Revenue Management per strutture luxury che va oltre la semplice gestione delle
            camere
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Total Revenue Management",
                description: "Ottimizzazione revenue camere, suite, spa, ristoranti, eventi e servizi ancillari",
              },
              {
                title: "Luxury Pricing Strategy",
                description: "Strategie di pricing psicologico per mantenere percezione di esclusività e valore",
              },
              {
                title: "VIP Guest Management",
                description: "Gestione personalizzata clienti VIP, repeat guests e programmi fedeltà luxury",
              },
              {
                title: "Brand Positioning",
                description: "Consulenza sul posizionamento e mantenimento dell'immagine premium del resort",
              },
              {
                title: "Experience Packages",
                description: "Creazione e pricing di pacchetti esperienziali esclusivi e su misura",
              },
              {
                title: "Luxury Distribution",
                description: "Selezione e gestione canali di distribuzione premium: consortia, DMC, agenzie luxury",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-card to-card/80 rounded-xl p-6 shadow-md border border-border hover:shadow-xl transition-all hover:scale-105"
              >
                <Star className="h-8 w-8 text-yellow mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Results */}
      <section className="py-20 bg-gradient-to-br from-yellow via-yellow/80 to-primary-blue text-foreground">
        <div className="container mx-auto px-6 text-center">
          <Crown className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">Risultati nel Segmento Luxury</h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
            I resort di lusso che collaborano con noi ottengono incrementi significativi mantenendo l'esclusività
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-background/20 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+45%</p>
              <p className="text-sm">Total Revenue</p>
            </div>
            <div className="bg-background/20 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+38%</p>
              <p className="text-sm">ADR medio</p>
            </div>
            <div className="bg-background/20 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+52%</p>
              <p className="text-sm">Ancillary Revenue</p>
            </div>
            <div className="bg-background/20 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">92%</p>
              <p className="text-sm">Guest Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-yellow/10 to-primary-blue/10 rounded-2xl p-12 border border-yellow/20">
            <Users className="h-12 w-12 text-yellow mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Case Study: Resort 5 Stelle Toscana</h2>
            <p className="text-muted-foreground mb-6">
              Resort luxury 45 camere + 12 suite con spa, ristorante stellato, piscina infinity e campo da golf. Il
              resort faticava a massimizzare i ricavi dei servizi ancillari e mantenere ADR premium tutto l'anno.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-foreground mb-3">Interventi Effettuati:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Implementazione Total Revenue Management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Creazione pacchetti esperienziali premium</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Ottimizzazione pricing spa e ristorante</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Strategia direct booking per clientela VIP</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-3">Risultati in 12 Mesi:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span>Total Revenue:</span>
                    <span className="font-bold text-primary-blue">+€780.000</span>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span>ADR medio:</span>
                    <span className="font-bold text-primary-blue">+38%</span>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span>Revenue Spa:</span>
                    <span className="font-bold text-primary-blue">+62%</span>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span>Direct Booking:</span>
                    <span className="font-bold text-primary-blue">+45%</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Eleva il Revenue del Tuo Resort di Lusso</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una consulenza esclusiva. Analizzeremo il potenziale del tuo resort e ti proporremo strategie
            premium per massimizzare i ricavi mantenendo l'esclusività.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-yellow hover:bg-yellow/90 text-foreground">
              <Sparkles className="h-5 w-5 mr-2" />
              Richiedi Consulenza Luxury
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
