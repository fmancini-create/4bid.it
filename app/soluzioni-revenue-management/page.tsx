import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { StructuredData } from "@/components/seo-structured-data"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CLUSTER_ORDER, getSolutionsByCluster } from "@/lib/seo/solutions"

export const metadata: Metadata = {
  title: "Soluzioni di Revenue Management per Hotel e Strutture Ricettive | 4BID",
  description:
    "Tutte le soluzioni 4BID di revenue management per hotel, B&B, agriturismi e resort: consulenza, software, dynamic pricing, distribuzione, prenotazioni dirette, KPI e formazione.",
  keywords:
    "soluzioni revenue management hotel, consulenza revenue management, software revenue management, dynamic pricing, prenotazioni dirette, kpi hotel",
  alternates: { canonical: "https://www.4bid.it/soluzioni-revenue-management" },
  openGraph: {
    title: "Soluzioni di Revenue Management per Hotel | 4BID",
    description:
      "Esplora tutte le soluzioni 4BID di revenue management: consulenza, software, pricing, distribuzione, prenotazioni dirette, KPI e formazione.",
    url: "https://www.4bid.it/soluzioni-revenue-management",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://www.4bid.it/4bid-colorful-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Soluzioni Revenue Management 4BID",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
}

export default function SoluzioniRevenueManagementPage() {
  const grouped = getSolutionsByCluster()

  return (
    <>
      <StructuredData
        type="WebPage"
        title="Soluzioni di Revenue Management per Hotel"
        description="Tutte le soluzioni 4BID di revenue management per hotel e strutture ricettive: consulenza, software, pricing, distribuzione, prenotazioni dirette, KPI e formazione."
        url="https://www.4bid.it/soluzioni-revenue-management"
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Soluzioni Revenue Management", url: "https://www.4bid.it/soluzioni-revenue-management" },
        ]}
      />
      <Header />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Soluzioni Revenue Management", href: "/soluzioni-revenue-management" },
        ]}
      />

      <main className="min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-blue to-blue-grey py-20 px-4">
          <div className="container mx-auto max-w-5xl text-center text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Soluzioni di Revenue Management per Hotel e Strutture Ricettive
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-pretty max-w-3xl mx-auto opacity-90">
              Consulenza, software e strategie per aumentare i ricavi della tua struttura. Esplora tutte le aree del
              revenue management 4BID e scegli il percorso più adatto a te.
            </p>
            <Link href="/prenota-demo">
              <Button size="lg" className="bg-yellow text-foreground hover:bg-yellow/90 font-semibold">
                Richiedi una consulenza gratuita
              </Button>
            </Link>
          </div>
        </section>

        {/* Intro testuale per contesto tematico */}
        <section className="py-12 px-4 bg-background">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
              Il revenue management è la disciplina che ti permette di vendere la camera giusta, al cliente giusto, al
              prezzo giusto e nel momento giusto. 4BID affianca hotel, B&amp;B, agriturismi, boutique hotel e resort con
              un approccio che unisce <strong className="text-foreground">consulenza strategica</strong>,{" "}
              <strong className="text-foreground">software basato su AI</strong> e{" "}
              <strong className="text-foreground">formazione</strong>. Qui trovi tutte le nostre soluzioni, organizzate
              per area.
            </p>
          </div>
        </section>

        {/* Cluster tematici */}
        <section className="py-12 px-4 bg-muted/40">
          <div className="container mx-auto max-w-6xl space-y-14">
            {CLUSTER_ORDER.map((cluster) => (
              <div key={cluster}>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{cluster}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[cluster].map((s) => (
                    <Link
                      key={s.slug}
                      href={`/${s.slug}`}
                      className="group flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary-blue hover:bg-muted/50"
                    >
                      <span className="flex items-center justify-between gap-2 font-semibold text-foreground">
                        {s.title}
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary-blue transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="text-sm text-muted-foreground">{s.short}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA finale */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
              Non sai da quale soluzione partire?
            </h2>
            <p className="text-xl mb-8 text-pretty opacity-90">
              Raccontaci la tua struttura: ti indicheremo il percorso di revenue management più adatto, senza impegno.
            </p>
            <Link href="/prenota-demo">
              <Button size="lg" className="bg-yellow text-foreground hover:bg-yellow/90 font-semibold">
                Prenota una consulenza gratuita
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
