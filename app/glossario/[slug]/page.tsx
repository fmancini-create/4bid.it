import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Script from "next/script"
import { ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { KBBreadcrumb } from "@/components/knowledge-base/kb-breadcrumb"
import {
  GLOSSARY,
  getGlossaryTerm,
  getRelatedGlossaryTerms,
  getCategory,
  kbBreadcrumbs,
  KB_BASE_PATH,
} from "@/lib/knowledge-base"

const GLOSSARY_URL = "https://www.4bid.it/glossario"

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const term = getGlossaryTerm(slug)
  if (!term) return { title: "Termine non trovato | Glossario 4BID" }

  const label = term.fullName ? `${term.term} (${term.fullName})` : term.term
  const url = `${GLOSSARY_URL}/${term.slug}`
  return {
    title: `${label} — Definizione | Glossario 4BID`,
    description: term.definition,
    alternates: { canonical: url },
    openGraph: {
      title: `${label} — Glossario 4BID`,
      description: term.definition,
      type: "article",
      url,
      siteName: "4BID.IT",
      locale: "it_IT",
      images: [{ url: "/og-image-4bid.jpg", width: 1024, height: 1024, alt: label }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} — Glossario 4BID`,
      description: term.definition,
      images: ["/og-image-4bid.jpg"],
    },
  }
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const term = getGlossaryTerm(slug)
  if (!term) notFound()

  const label = term.fullName ? `${term.term} (${term.fullName})` : term.term
  const url = `${GLOSSARY_URL}/${term.slug}`
  const category = getCategory(term.categorySlug)
  const related = getRelatedGlossaryTerms(term.slug)
  const breadcrumbs = kbBreadcrumbs(
    { name: "Glossario", url: GLOSSARY_URL },
    { name: term.term, url },
  )

  // Schema DefinedTerm collegato al DefinedTermSet del glossario.
  const definedTerm = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${url}#term`,
    name: label,
    description: term.definition,
    url,
    inLanguage: "it-IT",
    inDefinedTermSet: `${GLOSSARY_URL}#glossary`,
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  }

  return (
    <>
      <Header />
      <Script
        id="glossary-defined-term"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTerm) }}
      />
      <Script
        id="glossary-term-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="min-h-screen bg-background">
        <section className="pt-32 pb-10 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4">
                <KBBreadcrumb items={breadcrumbs} />
              </div>
              <p className="mb-2 text-sm font-medium text-primary-blue">Glossario · Revenue Management</p>
              <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl text-balance">{label}</h1>
              <p className="kb-definition text-xl text-muted-foreground leading-relaxed text-pretty">
                {term.definition}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl space-y-10">
              {category && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <p className="mb-1 text-sm text-muted-foreground">Categoria</p>
                  <Link
                    href={`${KB_BASE_PATH}/${category.slug}`}
                    className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary-blue"
                  >
                    {category.name}
                    <ArrowRight className="h-4 w-4 text-primary-blue" aria-hidden="true" />
                  </Link>
                </div>
              )}

              {related.length > 0 && (
                <section aria-labelledby="related-terms-title">
                  <h2
                    id="related-terms-title"
                    className="mb-5 text-2xl font-bold text-foreground md:text-3xl text-balance"
                  >
                    Termini correlati
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {related.map((r) => (
                      <Link
                        key={r.slug}
                        href={`/glossario/${r.slug}`}
                        className="group flex flex-col gap-1 rounded-lg border border-border p-5 transition-colors hover:border-primary-blue hover:bg-muted/50"
                      >
                        <span className="font-mono font-semibold text-primary-blue">{r.term}</span>
                        <span className="text-sm text-muted-foreground line-clamp-2">{r.definition}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <div>
                <Link
                  href="/glossario"
                  className="inline-flex items-center gap-2 font-medium text-primary-blue hover:underline"
                >
                  Torna al glossario completo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
