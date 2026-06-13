import Link from "next/link"
import type { Metadata } from "next"
import { BookOpen, Clock, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { getAllPosts } from "@/lib/blog/posts"

export const runtime = "nodejs"
export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Blog e Guide sul Revenue Management per Hotel | 4BID",
  description:
    "Guide pratiche, esempi e consigli di revenue management per hotel, B&B e agriturismi: RevPAR, ADR, strategie di prezzo e prenotazioni dirette.",
  keywords:
    "blog revenue management, guide revenue management hotel, consigli revenue management, revpar, adr, prenotazioni dirette",
  alternates: {
    canonical: "https://www.4bid.it/blog",
  },
  openGraph: {
    title: "Blog e Guide sul Revenue Management per Hotel | 4BID",
    description:
      "Guide pratiche, esempi e consigli di revenue management per hotel, B&B e agriturismi.",
    url: "https://www.4bid.it/blog",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export default function BlogIndexPage() {
  const allPosts = getAllPosts()
  const [featured, ...rest] = allPosts

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="WebPage"
        title="Blog e Guide sul Revenue Management per Hotel"
        description="Guide pratiche, esempi e consigli di revenue management per hotel, B&B e agriturismi."
        url="https://www.4bid.it/blog"
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Blog", url: "https://www.4bid.it/blog" },
        ]}
      />

      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-primary-blue mb-4">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">Blog &amp; Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              Guide e consigli di Revenue Management per la tua struttura
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
              Articoli pratici, esempi numerici e strategie concrete per aumentare i ricavi di hotel, B&amp;B e
              agriturismi. Scritti per chi gestisce davvero una struttura ricettiva.
            </p>
          </div>
        </div>
      </section>

      {/* Articolo in evidenza */}
      {featured && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Link
                href={`/blog/${featured.slug}`}
                title={featured.title}
                className="group block rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary-blue/40"
              >
                <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary-blue mb-3">
                  In evidenza · {featured.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance group-hover:text-primary-blue transition-colors">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4 text-pretty">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {featured.readingMinutes} min di lettura
                  </span>
                  <span className="flex items-center gap-1.5 text-primary-blue font-medium">
                    Leggi la guida
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Lista articoli */}
      {rest.length > 0 && (
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  title={post.title}
                  className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary-blue/40"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-blue mb-2">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mb-2 text-balance group-hover:text-primary-blue transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 text-pretty">
                    {post.excerpt}
                  </p>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {post.readingMinutes} min di lettura
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
