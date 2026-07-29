import Link from "next/link"
import { Database, Cpu, TrendingUp, Workflow, GaugeCircle, ArrowRight, CheckCircle2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { EntityLinks } from "@/components/entity-links"
import { entitySchemaLinks } from "@/lib/seo/entities"

export const metadata = {
  title: "Il Metodo 4BID - Revenue Management, Dati e AI per Hotel | 4BID.IT",
  description:
    "Il Metodo 4BID unisce revenue management, analisi dei dati, intelligenza artificiale e automazioni. Nato dall'esperienza reale in hotel.",
  keywords:
    "metodo 4bid, revenue management hotel, intelligenza artificiale hotel, automazione hotel, controllo di gestione strutture ricettive",
  openGraph: {
    title: "Il Metodo 4BID - Revenue Management, Dati e AI per Hotel",
    description:
      "Un approccio che combina revenue management, dati, AI, automazioni e controllo operativo, nato dall'esperienza reale nella gestione alberghiera.",
    url: "https://www.4bid.it/metodo-4bid",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Il Metodo 4BID - Revenue Management, Dati e AI per Hotel",
    description:
      "Revenue management, dati, AI, automazioni e controllo operativo in un unico approccio integrato.",
    images: ["/og-image-4bid.jpg"],
  },
  alternates: {
    canonical: "https://www.4bid.it/metodo-4bid",
  },
}

const faqData = [
  {
    question: "Cos'è il Metodo 4BID?",
    answer:
      "Il Metodo 4BID è l'approccio con cui 4BID affianca le strutture ricettive: integra revenue management, analisi dei dati, intelligenza artificiale, automazioni operative e controllo di gestione in un percorso unico, anziché trattarli come attività separate.",
  },
  {
    question: "Su cosa si basa il Metodo 4BID?",
    answer:
      "Si basa sui dati reali della struttura. Il punto di partenza è sempre l'analisi delle performance e dell'operatività esistenti; da lì vengono definite strategie tariffarie, automazioni e indicatori di controllo specifici per quella struttura.",
  },
  {
    question: "In cosa si differenzia dalla consulenza tradizionale?",
    answer:
      "La consulenza tradizionale si concentra spesso sulle raccomandazioni. Il Metodo 4BID unisce la consulenza a software proprietari e all'esperienza diretta nella gestione alberghiera, così le strategie si traducono in strumenti operativi concreti e misurabili nel tempo.",
  },
  {
    question: "Per quali tipi di struttura è pensato?",
    answer:
      "Per hotel indipendenti, boutique hotel, resort, B&B e agriturismi. Il metodo viene adattato alla dimensione, alla stagionalità e agli obiettivi commerciali di ciascuna struttura.",
  },
  {
    question: "Che ruolo ha l'intelligenza artificiale nel metodo?",
    answer:
      "L'intelligenza artificiale supporta l'analisi dei dati, le decisioni tariffarie e l'automazione delle attività ricorrenti. È uno strumento al servizio del metodo, non un fine in sé, e affianca sempre il controllo umano.",
  },
  {
    question: "Come si collega il metodo ai prodotti 4BID?",
    answer:
      "Le fasi del metodo trovano applicazione nei prodotti 4BID: Santaddeo per il revenue management, HotelProfitAI per il controllo di gestione, Hotel Accelerator per la crescita commerciale e ManuBot per l'automazione operativa.",
  },
  {
    question: "Quali problemi aiuta a risolvere?",
    answer:
      "Aiuta a ridurre le decisioni tariffarie prese a intuito, la dipendenza eccessiva dalle OTA, la mancanza di controllo sulla redditività e l'eccesso di attività manuali ripetitive nella gestione quotidiana.",
  },
]

const phases = [
  {
    icon: Database,
    title: "1. Dati e analisi",
    description:
      "Tutto parte dai dati reali della struttura: performance storiche, domanda, distribuzione e costi. Senza dati affidabili non esiste strategia.",
  },
  {
    icon: TrendingUp,
    title: "2. Revenue management",
    description:
      "Definizione della strategia tariffaria, gestione della distribuzione e crescita delle prenotazioni dirette, in base agli obiettivi della struttura.",
  },
  {
    icon: Cpu,
    title: "3. Intelligenza artificiale",
    description:
      "Modelli e automazioni supportano l'analisi e le decisioni tariffarie, mantenendo sempre il controllo e la responsabilità in capo alle persone.",
  },
  {
    icon: Workflow,
    title: "4. Automazione operativa",
    description:
      "Le attività ripetitive — comunicazioni, housekeeping, manutenzioni — vengono automatizzate per liberare tempo e ridurre gli errori.",
  },
  {
    icon: GaugeCircle,
    title: "5. Controllo di gestione",
    description:
      "Indicatori chiari sulla redditività permettono di verificare i risultati e correggere la rotta, chiudendo il ciclo e ripartendo dai dati.",
  },
]

export default function Metodo4BidPage() {
  const entityLinks = entitySchemaLinks("metodo-4bid")
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Il Metodo 4BID"
        description="L'approccio 4BID integra revenue management, dati, intelligenza artificiale, automazioni e controllo operativo."
        url="https://www.4bid.it/metodo-4bid"
        faqs={faqData}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Metodo 4BID", url: "https://www.4bid.it/metodo-4bid" },
        ]}
        about={entityLinks.about}
        mentions={entityLinks.mentions}
      />

      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary-blue">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Metodo 4BID</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">Il Metodo 4BID</h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
              Un approccio integrato che mette insieme revenue management, dati, intelligenza artificiale, automazioni e
              controllo operativo. Nato dall'esperienza reale nella gestione alberghiera, non dalla teoria.
            </p>
          </div>
        </div>
      </section>

      {/* Cos'è */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Cos'è il Metodo 4BID</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Molte strutture affrontano il revenue management, la tecnologia e l'operatività come attività separate. Il
              Metodo 4BID nasce da un'idea diversa: questi ambiti funzionano meglio quando vengono integrati in un unico
              percorso coerente, guidato dai dati e verificato dai risultati.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              È un metodo concreto, costruito a partire dai problemi reali che le strutture ricettive incontrano ogni
              giorno e raffinato attraverso l'esperienza diretta nella gestione alberghiera.
            </p>
          </div>
        </div>
      </section>

      {/* Le fasi */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Come funziona</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Cinque ambiti che lavorano insieme, in un ciclo continuo
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {phases.map((phase, i) => (
              <div key={i} className="bg-card rounded-xl p-8 shadow-lg border border-border">
                <phase.icon className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-3">{phase.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perché nasce dall'esperienza */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-10 border-2 border-primary-blue/20">
            <Building2 className="h-12 w-12 text-primary-blue mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Perché nasce dall'esperienza reale</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Il Metodo 4BID non è un modello costruito a tavolino. Deriva dal lavoro diretto con le strutture ricettive
              e dall'esperienza nella gestione alberghiera, dove le decisioni su prezzi, distribuzione e operatività
              hanno conseguenze concrete e immediate.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Questa origine pratica è il motivo per cui ogni fase del metodo è pensata per essere applicata davvero,
              con strumenti che le strutture possono usare nella gestione di tutti i giorni. Scopri di più sul fondatore{" "}
              <Link href="/filippo-mancini" className="text-primary-blue font-semibold hover:underline">
                Filippo Mancini
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Consulenza tradizionale vs 4BID */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Consulenza tradizionale e approccio 4BID
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-8 border border-border">
              <h3 className="font-bold text-foreground mb-4 text-xl">Consulenza tradizionale</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>Spesso si conclude con un report di raccomandazioni.</li>
                <li>Gli strumenti operativi restano a carico della struttura.</li>
                <li>Revenue, tecnologia e operatività trattati separatamente.</li>
                <li>Difficile misurare nel tempo l'impatto reale.</li>
              </ul>
            </div>
            <div className="bg-card rounded-xl p-8 border-2 border-primary-blue/30">
              <h3 className="font-bold text-foreground mb-4 text-xl">Approccio 4BID</h3>
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  Consulenza unita a software proprietari.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  Strategie tradotte in strumenti operativi concreti.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  Revenue, AI, automazione e controllo integrati.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  Risultati verificati con indicatori di gestione.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Prodotti collegati */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Il metodo nei prodotti 4BID</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Ogni fase del metodo trova applicazione in uno strumento concreto
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Santaddeo",
                description: "Revenue management system: la fase di strategia tariffaria e distribuzione.",
                href: "/progetti/santaddeo",
              },
              {
                title: "HotelProfitAI",
                description: "Controllo di gestione: la fase di analisi della redditività e verifica dei risultati.",
                href: "/progetti/hotelprofit-ai",
              },
              {
                title: "Hotel Accelerator",
                description: "Crescita commerciale: la fase di sviluppo delle relazioni e delle vendite.",
                href: "/progetti/hotel-accelerator",
              },
              {
                title: "ManuBot",
                description: "Automazione operativa: la fase di gestione di housekeeping e manutenzioni.",
                href: "/progetti/manubot",
              },
            ].map((p, i) => (
              <Link
                key={i}
                href={p.href}
                className="group bg-card rounded-xl p-8 shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                <h3 className="text-2xl font-bold text-card-foreground mb-2 group-hover:text-primary-blue transition-colors">
                  {p.title}
                </h3>
                <p className="text-muted-foreground mb-4">{p.description}</p>
                <span className="inline-flex items-center gap-2 text-primary-blue font-semibold">
                  Scopri di più <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-10">
            Vuoi un quadro completo della società?{" "}
            <Link href="/chi-siamo" className="text-primary-blue font-semibold hover:underline">
              Scopri chi siamo
            </Link>{" "}
            oppure approfondisci le{" "}
            <Link href="/soluzioni-revenue-management" className="text-primary-blue font-semibold hover:underline">
              soluzioni di revenue management
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-foreground mb-12">Domande frequenti</h2>
            <div className="space-y-6">
              {faqData.map((faq, i) => (
                <div key={i} className="bg-card rounded-xl p-6 shadow border border-border">
                  <h3 className="text-lg font-bold text-card-foreground mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Applica il Metodo 4BID alla tua struttura</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Richiedi un confronto per capire come revenue management, dati e tecnologia possono lavorare insieme nel tuo
            caso specifico.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" variant="secondary">
                Richiedi un confronto
              </Button>
            </Link>
            <Link href="/come-aumentare-ricavi-hotel">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                Come aumentare i ricavi
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <EntityLinks entityKey="metodo-4bid" />

      <Footer />
    </div>
  )
}
