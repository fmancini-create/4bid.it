import Link from "next/link"
import Image from "next/image"
import { Target, Eye, Cpu, TrendingUp, Building2, Workflow, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { EntityLinks } from "@/components/entity-links"
import { entitySchemaLinks } from "@/lib/seo/entities"

export const metadata = {
  title: "Chi siamo - 4BID, Revenue Management e Tecnologia per l'Hospitality | 4BID.IT",
  description:
    "4BID è la società italiana di revenue management, software e AI per hotel, B&B e agriturismi. Scopri missione, competenze e prodotti.",
  keywords:
    "4bid, chi siamo 4bid, revenue management hotel, software hotel, consulenza alberghiera, hospitality tech Italia",
  openGraph: {
    title: "Chi siamo - 4BID, Revenue Management e Tecnologia per l'Hospitality",
    description:
      "Società italiana specializzata in revenue management, software e soluzioni AI per strutture ricettive. Missione, visione, competenze e prodotti.",
    url: "https://www.4bid.it/chi-siamo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chi siamo - 4BID, Revenue Management e Tecnologia per l'Hospitality",
    description:
      "Società italiana specializzata in revenue management, software e soluzioni AI per strutture ricettive.",
    images: ["/og-image-4bid.jpg"],
  },
  alternates: {
    canonical: "https://www.4bid.it/chi-siamo",
  },
}

const faqData = [
  {
    question: "Chi è 4BID?",
    answer:
      "4BID è una società italiana con sede a San Casciano in Val di Pesa (Firenze), specializzata in revenue management, software e soluzioni tecnologiche per il settore turistico-ricettivo. Affianca hotel, B&B, agriturismi e resort nella gestione strategica dei ricavi e nell'adozione di strumenti digitali e di intelligenza artificiale.",
  },
  {
    question: "Di cosa si occupa esattamente 4BID?",
    answer:
      "4BID combina consulenza di revenue management e sviluppo di software proprietari. I servizi spaziano dall'analisi dei dati e dalla strategia tariffaria all'automazione operativa, fino alla gestione della distribuzione e delle prenotazioni dirette.",
  },
  {
    question: "Quali prodotti ha sviluppato 4BID?",
    answer:
      "4BID ha sviluppato Santaddeo (revenue management system), Hotel Accelerator (piattaforma per la crescita commerciale delle strutture), HotelProfitAI (controllo di gestione per strutture ricettive) e ManuBot (automazione operativa e housekeeping).",
  },
  {
    question: "4BID lavora solo con grandi hotel?",
    answer:
      "No. 4BID lavora con strutture di diversa dimensione e tipologia: hotel indipendenti, boutique hotel, resort, B&B e agriturismi. L'approccio viene adattato alle caratteristiche e agli obiettivi di ciascuna struttura.",
  },
  {
    question: "Qual è la differenza tra 4BID e una consulenza tradizionale?",
    answer:
      "4BID unisce la consulenza all'uso di software proprietari e all'esperienza diretta nella gestione alberghiera. Non si limita a fornire indicazioni: mette a disposizione strumenti operativi e metodologie applicate su strutture reali.",
  },
  {
    question: "Dove ha sede 4BID?",
    answer:
      "4BID ha sede in Via Sorripa 10, San Casciano in Val di Pesa (FI), in Toscana, e opera con strutture ricettive su tutto il territorio italiano.",
  },
  {
    question: "4BID utilizza l'intelligenza artificiale?",
    answer:
      "Sì. L'intelligenza artificiale è parte integrante delle soluzioni 4BID, applicata ad ambiti come l'analisi dei dati, il supporto alle decisioni tariffarie e l'automazione delle attività operative delle strutture.",
  },
]

export default function ChiSiamoPage() {
  const entityLinks = entitySchemaLinks("4bid")
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="AboutPage"
        title="Chi siamo - 4BID"
        description="4BID è una società italiana specializzata in revenue management, software e soluzioni AI per il settore turistico-ricettivo."
        url="https://www.4bid.it/chi-siamo"
        faqs={faqData}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Chi siamo", url: "https://www.4bid.it/chi-siamo" },
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
            <span className="text-foreground">Chi siamo</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Tecnologia ed esperienza al servizio dell'hospitality
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
              4BID è una società italiana che unisce revenue management, software proprietari e intelligenza artificiale
              per aiutare hotel, B&B, agriturismi e resort a gestire i ricavi e l'operatività in modo più efficiente.
            </p>
          </div>
        </div>
      </section>

      {/* Chi siamo */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Chi siamo</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                4BID nasce nel settore turistico-ricettivo con un obiettivo preciso: portare metodo, dati e tecnologia
                nella gestione delle strutture ricettive. La società ha sede in Toscana, a San Casciano in Val di Pesa,
                e collabora con strutture su tutto il territorio italiano.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                L'attività combina due anime complementari: la consulenza di revenue management e lo sviluppo di software
                proprietari. Questo permette di non fermarsi all'analisi, ma di mettere a disposizione strumenti
                operativi concreti, già utilizzati in strutture reali.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                L'esperienza diretta nella gestione alberghiera è il punto di partenza di ogni soluzione: le metodologie
                e i prodotti 4BID nascono dai problemi reali che le strutture affrontano ogni giorno.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
              <Image src="/parallax1.jpg" alt="4BID, hospitality e tecnologia" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Missione e Visione */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Target className="h-10 w-10 text-primary-blue mb-4" />
              <h2 className="text-2xl font-bold text-card-foreground mb-3">Missione</h2>
              <p className="text-muted-foreground leading-relaxed">
                Aiutare le strutture ricettive a prendere decisioni migliori sui prezzi, sulla distribuzione e
                sull'operatività, attraverso dati affidabili, metodo e tecnologia accessibile.
              </p>
            </div>
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Eye className="h-10 w-10 text-primary-blue mb-4" />
              <h2 className="text-2xl font-bold text-card-foreground mb-3">Visione</h2>
              <p className="text-muted-foreground leading-relaxed">
                Un'hospitality in cui anche le strutture indipendenti possono accedere a strumenti di revenue management
                e automazione di livello professionale, senza complessità inutili.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competenze */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Le nostre competenze</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "Revenue management",
                description:
                  "Strategia tariffaria, gestione della distribuzione, prenotazioni dirette e analisi delle performance.",
              },
              {
                icon: Cpu,
                title: "Intelligenza artificiale",
                description:
                  "Modelli e automazioni applicati all'analisi dei dati, al supporto alle decisioni e all'operatività.",
              },
              {
                icon: Workflow,
                title: "Automazione operativa",
                description:
                  "Strumenti per semplificare housekeeping, manutenzioni e attività ricorrenti delle strutture.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-xl p-8 shadow-lg border border-border">
                <item.icon className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prodotti */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">I nostri prodotti</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Software proprietari sviluppati da 4BID per il settore ricettivo
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Santaddeo",
                description: "Revenue management system per l'ottimizzazione di prezzi e prenotazioni.",
                href: "/progetti/santaddeo",
              },
              {
                title: "Hotel Accelerator",
                description: "Piattaforma per la crescita commerciale e la gestione delle relazioni con i clienti.",
                href: "/progetti/hotel-accelerator",
              },
              {
                title: "HotelProfitAI",
                description: "Controllo di gestione e analisi della redditività per strutture ricettive.",
                href: "/progetti/hotelprofit-ai",
              },
              {
                title: "ManuBot",
                description: "Automazione delle attività operative, manutenzioni e housekeeping.",
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
        </div>
      </section>

      {/* Filosofia / Approccio */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-8">Filosofia e approccio al mercato</h2>
            <ul className="space-y-4">
              {[
                "Partire dai dati reali della struttura, non da modelli astratti.",
                "Tradurre l'analisi in azioni operative concrete e misurabili.",
                "Mettere la tecnologia al servizio delle persone, non il contrario.",
                "Adattare il metodo alla dimensione e agli obiettivi di ogni struttura.",
                "Costruire strumenti nati dall'esperienza diretta nella gestione alberghiera.",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 bg-muted/40 rounded-xl p-8 border border-border">
              <Building2 className="h-10 w-10 text-primary-blue mb-4" />
              <p className="text-muted-foreground leading-relaxed">
                Vuoi capire come applichiamo concretamente metodo e tecnologia? Scopri il{" "}
                <Link href="/metodo-4bid" className="text-primary-blue font-semibold hover:underline">
                  Metodo 4BID
                </Link>{" "}
                e la storia del fondatore{" "}
                <Link href="/filippo-mancini" className="text-primary-blue font-semibold hover:underline">
                  Filippo Mancini
                </Link>
                .
              </p>
            </div>
          </div>
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
          <h2 className="text-4xl font-bold mb-6">Parliamo della tua struttura</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Scopri come revenue management, dati e tecnologia possono migliorare i risultati della tua struttura
            ricettiva.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" variant="secondary">
                Contattaci
              </Button>
            </Link>
            <Link href="/consulenza-revenue-management-hotel">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                Scopri i servizi
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <EntityLinks entityKey="4bid" />

      <Footer />
    </div>
  )
}
