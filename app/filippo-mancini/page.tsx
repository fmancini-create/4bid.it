import Link from "next/link"
import Image from "next/image"
import { Linkedin, Building2, Cpu, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { EntityLinks } from "@/components/entity-links"
import { entitySchemaLinks } from "@/lib/seo/entities"

export const metadata = {
  title: "Filippo Mancini - Fondatore di 4BID | 4BID.IT",
  description:
    "Filippo Mancini, fondatore di 4BID e ideatore di Santaddeo, Hotel Accelerator, HotelProfitAI e ManuBot. Esperto di revenue management alberghiero.",
  keywords:
    "Filippo Mancini, fondatore 4bid, revenue management hotel, esperto revenue management, Santaddeo, Villa I Barronci",
  openGraph: {
    title: "Filippo Mancini - Fondatore di 4BID",
    description:
      "Fondatore di 4BID e ideatore di Santaddeo, Hotel Accelerator, HotelProfitAI e ManuBot. Esperto di revenue management alberghiero.",
    url: "https://www.4bid.it/filippo-mancini",
    type: "profile",
    images: ["/filippo.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Filippo Mancini - Fondatore di 4BID",
    description:
      "Fondatore di 4BID e ideatore di Santaddeo, Hotel Accelerator, HotelProfitAI e ManuBot.",
    images: ["/filippo.jpg"],
  },
  alternates: {
    canonical: "https://www.4bid.it/filippo-mancini",
  },
}

const faqData = [
  {
    question: "Chi è Filippo Mancini?",
    answer:
      "Filippo Mancini è il fondatore di 4BID, società italiana specializzata in revenue management e tecnologia per il settore turistico-ricettivo. È imprenditore nel settore hospitality ed esperto di revenue management alberghiero.",
  },
  {
    question: "Quali prodotti ha ideato Filippo Mancini?",
    answer:
      "Filippo Mancini è l'ideatore dei prodotti sviluppati da 4BID: Santaddeo (revenue management system), Hotel Accelerator (crescita commerciale delle strutture), HotelProfitAI (controllo di gestione) e ManuBot (automazione operativa e housekeeping).",
  },
  {
    question: "Di cosa si occupa nel revenue management?",
    answer:
      "Si occupa di strategia tariffaria, gestione della distribuzione, prenotazioni dirette e applicazione di metodologie basate su dati e intelligenza artificiale alla gestione dei ricavi delle strutture ricettive.",
  },
  {
    question: "Che esperienza ha nella gestione alberghiera?",
    answer:
      "Ha esperienza diretta nella gestione di strutture ricettive, tra cui Villa I Barronci. Questa esperienza operativa è alla base delle metodologie e dei prodotti sviluppati con 4BID.",
  },
  {
    question: "Qual è il suo approccio alla tecnologia per gli hotel?",
    answer:
      "Un approccio pratico: la tecnologia e l'intelligenza artificiale devono risolvere problemi concreti delle strutture e supportare le persone nelle decisioni, non sostituirsi al controllo umano.",
  },
  {
    question: "Dove è possibile seguire Filippo Mancini?",
    answer:
      "È possibile seguire la sua attività professionale su LinkedIn, dove condivide aggiornamenti relativi a 4BID e al revenue management per il settore ricettivo.",
  },
]

export default function FilippoManciniPage() {
  const entityLinks = entitySchemaLinks("filippo-mancini")
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="AboutPage"
        title="Filippo Mancini - Fondatore di 4BID"
        description="Filippo Mancini è il fondatore di 4BID e ideatore di Santaddeo, Hotel Accelerator, HotelProfitAI e ManuBot."
        url="https://www.4bid.it/filippo-mancini"
        faqs={faqData}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Filippo Mancini", url: "https://www.4bid.it/filippo-mancini" },
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
            <span className="text-foreground">Filippo Mancini</span>
          </nav>
          <div className="grid md:grid-cols-[auto_1fr] gap-10 items-center max-w-5xl">
            <div className="relative h-40 w-40 rounded-full overflow-hidden shadow-lg mx-auto md:mx-0">
              <Image src="/filippo.jpg" alt="Filippo Mancini, fondatore di 4BID" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-4 text-balance">Filippo Mancini</h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-pretty mb-6">
                Fondatore di 4BID, imprenditore nel settore hospitality ed esperto di revenue management alberghiero.
                Ideatore di Santaddeo, Hotel Accelerator, HotelProfitAI e ManuBot.
              </p>
              <a
                href="https://www.linkedin.com/in/fimancini/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-blue font-semibold hover:underline"
              >
                <Linkedin className="h-5 w-5" />
                Profilo LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Esperienza e percorso</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Filippo Mancini opera nel settore turistico-ricettivo unendo due dimensioni che raramente convivono: quella
              dell'imprenditore con esperienza diretta nella gestione alberghiera e quella di chi progetta strumenti
              tecnologici per il settore.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Questa esperienza operativa — maturata anche nella gestione di Villa I Barronci — è il punto di partenza
              del suo lavoro: conoscere da vicino i problemi reali di una struttura ricettiva consente di costruire
              soluzioni davvero utili, anziché modelli teorici.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Da questa visione nasce 4BID e l'insieme dei suoi prodotti, pensati per portare metodo, dati e automazione
              nella gestione quotidiana delle strutture ricettive.
            </p>
          </div>
        </div>
      </section>

      {/* Aree di competenza */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Aree di competenza</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "Revenue management",
                description:
                  "Strategia tariffaria, distribuzione e prenotazioni dirette per le strutture ricettive.",
              },
              {
                icon: Cpu,
                title: "AI applicata agli hotel",
                description:
                  "Sviluppo di metodologie di intelligenza artificiale applicate alla gestione alberghiera.",
              },
              {
                icon: Building2,
                title: "Gestione alberghiera",
                description:
                  "Esperienza diretta come gestore e imprenditore nel settore dell'ospitalità.",
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

      {/* Prodotti ideati */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">I prodotti che ha ideato</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Soluzioni sviluppate con 4BID per il settore ricettivo
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Santaddeo",
                description: "Revenue management system per prezzi e prenotazioni.",
                href: "/progetti/santaddeo",
              },
              {
                title: "Hotel Accelerator",
                description: "Piattaforma per la crescita commerciale delle strutture.",
                href: "/progetti/hotel-accelerator",
              },
              {
                title: "HotelProfitAI",
                description: "Controllo di gestione e redditività per strutture ricettive.",
                href: "/progetti/hotelprofit-ai",
              },
              {
                title: "ManuBot",
                description: "Automazione di housekeeping, manutenzioni e attività operative.",
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

      {/* Visione */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-8">Una visione concreta dell'hospitality</h2>
            <ul className="space-y-4">
              {[
                "La tecnologia deve nascere dai problemi reali delle strutture, non imporsi dall'alto.",
                "I dati sono la base di ogni decisione su prezzi e operatività.",
                "L'intelligenza artificiale supporta le persone, senza sostituire il controllo umano.",
                "Anche le strutture indipendenti meritano strumenti di livello professionale.",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-10">
              Questa visione prende forma nel{" "}
              <Link href="/metodo-4bid" className="text-primary-blue font-semibold hover:underline">
                Metodo 4BID
              </Link>{" "}
              e nell'attività della società.{" "}
              <Link href="/chi-siamo" className="text-primary-blue font-semibold hover:underline">
                Scopri chi siamo
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
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
          <h2 className="text-4xl font-bold mb-6">Conosci il lavoro di 4BID</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Scopri il metodo e le soluzioni nate dall'esperienza diretta nella gestione alberghiera.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/metodo-4bid">
              <Button size="lg" variant="secondary">
                Scopri il Metodo 4BID
              </Button>
            </Link>
            <Link href="/chi-siamo">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                Chi siamo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <EntityLinks entityKey="filippo-mancini" />

      <Footer />
    </div>
  )
}
