import type { Metadata } from "next"
import { Newspaper, ExternalLink, Calendar } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Parlano di noi - Rassegna stampa | 4BID",
  description:
    "Articoli, notizie e menzioni online su 4BID e i suoi prodotti: Santaddeo, Manubot, HotelProfitAI, Hotel Accelerator e 4BID Ecomobility. La rassegna stampa aggiornata.",
  keywords: "4bid rassegna stampa, parlano di noi 4bid, news santaddeo, news manubot, hotelprofitai stampa",
  alternates: {
    canonical: "https://www.4bid.it/parlano-di-noi",
  },
  openGraph: {
    title: "Parlano di noi - Rassegna stampa | 4BID",
    description:
      "Articoli, notizie e menzioni online su 4BID e i suoi prodotti. La rassegna stampa aggiornata.",
    url: "https://www.4bid.it/parlano-di-noi",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
  },
  robots: { index: true, follow: true },
}

// Rivalida la pagina ogni ora (le notizie approvate cambiano di rado)
export const revalidate = 3600

interface PressMention {
  id: string
  title: string
  url: string
  source: string | null
  snippet: string | null
  keyword: string | null
  published_at: string | null
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

export default async function ParlanoDiNoiPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("press_mentions")
    .select("id, title, url, source, snippet, keyword, published_at")
    .eq("status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200)

  if (error) {
    console.error("[ParlanoDiNoi] Errore lettura:", error.message)
  }

  const mentions: PressMention[] = data || []

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="WebPage"
        title="Parlano di noi - Rassegna stampa 4BID"
        description="Articoli e menzioni online su 4BID e i suoi prodotti."
        url="https://www.4bid.it/parlano-di-noi"
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Parlano di noi", url: "https://www.4bid.it/parlano-di-noi" },
        ]}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-[#1B3A5B] text-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
              <Newspaper className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-balance">Parlano di noi</h1>
            <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-pretty">
              Articoli, notizie e menzioni online su 4BID e i suoi prodotti. Una rassegna stampa aggiornata
              automaticamente ogni giorno.
            </p>
          </div>
        </section>

        {/* Elenco notizie */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            {mentions.length === 0 ? (
              <div className="max-w-xl mx-auto text-center py-16">
                <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-foreground">Nessun articolo al momento</h2>
                <p className="mt-2 text-muted-foreground text-pretty">
                  Stiamo monitorando il web ogni giorno. Le menzioni stampa su 4BID e i nostri prodotti
                  appariranno qui non appena disponibili.
                </p>
              </div>
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 max-w-5xl mx-auto">
                {mentions.map((m) => {
                  const date = formatDate(m.published_at)
                  return (
                    <li key={m.id}>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        title={m.title}
                        className="group flex flex-col h-full bg-card border border-border rounded-xl p-6 transition-colors hover:border-[#5B9BD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9BD5]"
                      >
                        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
                          {m.source && <span className="font-semibold text-[#1B3A5B]">{m.source}</span>}
                          {m.keyword && (
                            <span className="px-2 py-0.5 rounded-full bg-[#5B9BD5]/10 text-[#1B3A5B] text-xs font-medium">
                              {m.keyword}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-foreground leading-snug text-pretty group-hover:text-[#1B3A5B]">
                          {m.title}
                        </h2>
                        {m.snippet && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-3 text-pretty">{m.snippet}</p>
                        )}
                        <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                          {date ? (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="w-4 h-4" aria-hidden="true" />
                              {date}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#5B9BD5] group-hover:gap-2.5 transition-all">
                            Leggi l&apos;articolo
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                          </span>
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
