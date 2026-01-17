import Link from "next/link"
import { TrendingUp, Target, Euro, BarChart3, CheckCircle2, Zap, Award, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Ottimizzazione ADR Hotel | Come Aumentare Tariffa Media | 4BID.IT",
  description:
    "Strategie avanzate per ottimizzare l'ADR (Average Daily Rate) del tuo hotel. Aumenta la tariffa media fino al +35% senza perdere occupazione con pricing strategico.",
  keywords:
    "ADR hotel, average daily rate, aumentare tariffa media hotel, ottimizzazione prezzi hotel, pricing strategico, revenue management ADR",
  openGraph: {
    title: "Ottimizzazione ADR Hotel | Come Aumentare Tariffa Media | 4BID.IT",
    description: "Aumenta l'ADR fino al +35% senza perdere occupazione con strategie di pricing strategico.",
    url: "https://www.4bid.it/ottimizzazione-adr-hotel",
    type: "article",
  },
  alternates: {
    canonical: "https://www.4bid.it/ottimizzazione-adr-hotel",
  },
}

const faqData = [
  {
    question: "Come si calcola l'ADR di un hotel?",
    answer:
      "L'ADR (Average Daily Rate) si calcola dividendo il revenue totale delle camere per il numero di camere vendute. Esempio: €12.000 ricavi / 100 camere vendute = €120 ADR.",
  },
  {
    question: "Quali sono le 10 strategie per aumentare l'ADR?",
    answer:
      "Le strategie principali sono: segmentazione avanzata, dynamic pricing, upselling strategico, minimum stay restriction, packages & bundles, rate fences, ottimizzazione OTA, direct booking incentive, length of stay pricing e value communication.",
  },
  {
    question: "Quanto si può aumentare l'ADR con le giuste strategie?",
    answer:
      "Con le strategie corrette si può aumentare l'ADR del 35-40% in 12 mesi mantenendo l'occupazione stabile. Un hotel 4* può passare da €115 a €158 di ADR medio.",
  },
]

export default function OttimizzazioneADRHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Ottimizzazione ADR Hotel"
        description="Strategie avanzate per ottimizzare l'ADR del tuo hotel"
        faq={faqData}
      />
      <LandingPageTracker slug="ottimizzazione-adr-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Ottimizzazione ADR per Hotel: Aumenta la Tariffa Media
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Strategie comprovate per aumentare l'ADR (Average Daily Rate) del tuo hotel fino al +35% mantenendo o
              migliorando l'occupazione. Massimizza il valore di ogni camera venduta.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Analizza il Tuo ADR
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Software SANTADDEO
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ADR Explanation */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-foreground mb-8">Cos'è l'ADR e Perché è Fondamentale</h2>
            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 mb-8 border border-primary-blue/20">
              <DollarSign className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Average Daily Rate (ADR)</h3>
              <p className="text-muted-foreground text-lg mb-4">
                L'ADR è la tariffa media giornaliera delle camere vendute. Si calcola dividendo il revenue totale camere
                per il numero di camere vendute.
              </p>
              <div className="bg-background/50 rounded-lg p-6 font-mono text-lg">
                <p className="text-center text-foreground">ADR = Revenue Totale Camere / Numero Camere Vendute</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl p-6 shadow-md border border-border">
                <Euro className="h-10 w-10 text-primary-blue mb-3" />
                <h4 className="font-bold text-card-foreground mb-2">Esempio Basso ADR</h4>
                <p className="text-sm text-muted-foreground">€8,000 / 100 camere = €80 ADR</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-md border border-border">
                <Award className="h-10 w-10 text-yellow mb-3" />
                <h4 className="font-bold text-card-foreground mb-2">Esempio Medio ADR</h4>
                <p className="text-sm text-muted-foreground">€12,000 / 100 camere = €120 ADR</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-md border border-border">
                <TrendingUp className="h-10 w-10 text-green-600 mb-3" />
                <h4 className="font-bold text-card-foreground mb-2">Esempio Alto ADR</h4>
                <p className="text-sm text-muted-foreground">€16,000 / 100 camere = €160 ADR</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategie */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">10 Strategie per Aumentare l'ADR</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tecniche comprovate che utilizziamo per i nostri clienti con risultati misurabili
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "1. Segmentazione Avanzata",
                description:
                  "Identifica i segmenti di mercato disposti a pagare di più (business traveler, coppie luxury, eventi speciali) e crea pacchetti dedicati",
              },
              {
                title: "2. Dynamic Pricing",
                description:
                  "Adatta le tariffe in tempo reale basandoti su domanda, eventi, meteo, competitor e booking window per massimizzare ogni vendita",
              },
              {
                title: "3. Upselling Strategico",
                description:
                  "Proponi upgrade di categoria durante il booking process e al check-in con offerte personalizzate e irresistibili",
              },
              {
                title: "4. Minimum Stay Restriction",
                description:
                  "Applica soglie di permanenza minima nei periodi di alta domanda per evitare di vendere camere a tariffa bassa per soggiorni brevi",
              },
              {
                title: "5. Packages & Bundles",
                description:
                  "Crea pacchetti con servizi aggiuntivi (colazione, spa, transfer) che aumentano il valore percepito e la willingness to pay",
              },
              {
                title: "6. Rate Fences",
                description:
                  "Implementa restrizioni strategiche (cancellazione, advance booking) per segmentare il mercato e proteggere le tariffe alte",
              },
              {
                title: "7. Ottimizzazione OTA",
                description:
                  "Gestisci strategicamente tariffe e disponibilità sui portali OTA per evitare di competere solo sul prezzo più basso",
              },
              {
                title: "8. Direct Booking Incentive",
                description:
                  "Offri tariffe migliori sul tuo sito per aumentare le prenotazioni dirette con margini più alti e clienti più fedeli",
              },
              {
                title: "9. Length of Stay Pricing",
                description:
                  "Calibra le tariffe in base alla durata del soggiorno, premiando soggiorni lunghi ma proteggendo i periodi di alta domanda",
              },
              {
                title: "10. Value Communication",
                description:
                  "Comunica efficacemente il valore unico della tua struttura attraverso foto, descrizioni e recensioni per giustificare tariffe premium",
              },
            ].map((strategy, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-bold text-card-foreground mb-3">{strategy.title}</h3>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Errori Comuni */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Errori Comuni da Evitare</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-destructive/10 rounded-2xl p-8 border-2 border-destructive/20">
              <Target className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Cosa NON Fare</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1 text-xl">✗</span>
                  <span>Abbassare i prezzi per riempire le camere invece di ottimizzare il mix</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1 text-xl">✗</span>
                  <span>Mantenere tariffe statiche senza considerare domanda e stagionalità</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1 text-xl">✗</span>
                  <span>Competere solo sul prezzo senza comunicare il valore della struttura</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1 text-xl">✗</span>
                  <span>Dare la stessa tariffa a tutti i canali senza strategia di distribuzione</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary-blue/10 rounded-2xl p-8 border-2 border-primary-blue/20">
              <CheckCircle2 className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Best Practice</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Monitorare ADR giornalmente e confrontarlo con comp set e obiettivi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Bilanciare ADR e occupazione per massimizzare il RevPAR complessivo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Investire in value-add services che giustificano tariffe premium</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Testare continuamente strategie di pricing e ottimizzare basandosi sui dati</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <Zap className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold text-center mb-6">Case Study: Hotel 4* Firenze</h2>
          <p className="text-xl text-center mb-12 max-w-3xl mx-auto opacity-90">
            Come abbiamo aumentato l'ADR del 37% in 12 mesi mantenendo l'occupazione all'82%
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Prima</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>ADR Medio:</span>
                  <span className="font-bold">€115</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupazione:</span>
                  <span className="font-bold">85%</span>
                </div>
                <div className="flex justify-between">
                  <span>RevPAR:</span>
                  <span className="font-bold">€97.75</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue Mensile:</span>
                  <span className="font-bold">€146,250</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
              <h3 className="text-xl font-bold mb-4">Dopo 12 Mesi</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>ADR Medio:</span>
                  <span className="font-bold text-green-300">€158 (+37%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupazione:</span>
                  <span className="font-bold text-green-300">82% (-3%)</span>
                </div>
                <div className="flex justify-between">
                  <span>RevPAR:</span>
                  <span className="font-bold text-green-300">€129.56 (+33%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue Mensile:</span>
                  <span className="font-bold text-green-300">€194,340 (+33%)</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center mt-8 text-lg opacity-90">
            Risultato: +€48,090 di revenue mensile con una riduzione minima dell'occupazione
          </p>
        </div>
      </section>

      {/* Tools & Technology */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Strumenti per l'Ottimizzazione ADR</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <BarChart3 className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Software RMS</h3>
              <p className="text-muted-foreground mb-4">
                SANTADDEO calcola automaticamente l'ADR ottimale per ogni giorno basandosi su algoritmi di machine
                learning
              </p>
              <Link href="/progetti/santaddeo">
                <Button variant="outline" size="sm">
                  Scopri SANTADDEO
                </Button>
              </Link>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Consulenza Strategica</h3>
              <p className="text-muted-foreground mb-4">
                I nostri esperti analizzano il tuo hotel e creano strategie personalizzate per massimizzare l'ADR
              </p>
              <Link href="/consulenza-revenue-management-hotel">
                <Button variant="outline" size="sm">
                  Richiedi Consulenza
                </Button>
              </Link>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Formazione Team</h3>
              <p className="text-muted-foreground mb-4">
                Corsi pratici per il tuo staff su tecniche di upselling, pricing e gestione strategica dell'ADR
              </p>
              <Link href="/formazione-revenue-management-hotel">
                <Button variant="outline" size="sm">
                  Scopri Corsi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Pronto ad Aumentare il Tuo ADR?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita del tuo ADR. Ti mostreremo il potenziale di crescita della tua struttura e le
            strategie per raggiungerlo.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Analizza il Tuo ADR Gratis
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
