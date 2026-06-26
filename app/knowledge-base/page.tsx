import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { KBCategoryCard } from "@/components/knowledge-base/kb-cards"
import { KBSearch, type KBSearchItem } from "@/components/knowledge-base/kb-search"
import {
  getAllCategories,
  GLOSSARY,
  KB_BASE_PATH,
  KB_BASE_URL,
  categoryUrl,
  kbBreadcrumbs,
} from "@/lib/knowledge-base"

export const runtime = "nodejs"
export const dynamic = "force-static"

const TITLE = "Knowledge Base Revenue Management Hotel | 4BID.IT"
const DESCRIPTION =
  "La Knowledge Base di 4BID: guide, glossario e risorse su revenue management, pricing, distribuzione, tecnologia e AI per hotel."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords:
    "knowledge base hotel, guide revenue management, glossario revenue management, risorse hotel, pricing hotel, distribuzione alberghiera",
  alternates: { canonical: KB_BASE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: KB_BASE_URL,
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export default function KnowledgeBaseHome() {
  const categories = getAllCategories()

  // Indice di ricerca interno: categorie + glossario.
  const searchItems: KBSearchItem[] = [
    ...categories.map((c) => ({
      title: c.name,
      description: c.short,
      href: `${KB_BASE_PATH}/${c.slug}`,
      kind: "Categoria" as const,
      haystack: c.subcategories.map((s) => s.name).join(" "),
    })),
    ...GLOSSARY.map((t) => ({
      title: t.term,
      description: t.definition,
      href: `/glossario/${t.slug}`,
      kind: "Glossario" as const,
      haystack: [t.fullName, ...(t.aliases ?? [])].filter(Boolean).join(" "),
    })),
  ]

  const breadcrumbs = kbBreadcrumbs()

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="CollectionPage"
        title={TITLE}
        description={DESCRIPTION}
        url={KB_BASE_URL}
        breadcrumbs={breadcrumbs}
        hasParts={categories.map((c) => ({ name: c.name, url: categoryUrl(c.slug) }))}
        speakable={["h1", ".kb-intro"]}
      />

      <Header />

      <section className="pt-32 pb-12 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 flex items-center justify-center gap-2 text-primary-blue">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-medium">Knowledge Base</span>
            </div>
            <h1 className="mb-5 text-4xl font-bold text-foreground md:text-5xl text-balance">
              La Knowledge Base del Revenue Management alberghiero
            </h1>
            <p className="kb-intro mx-auto mb-8 max-w-2xl text-xl text-muted-foreground leading-relaxed text-pretty">
              {DESCRIPTION}
            </p>
            <KBSearch items={searchItems} />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-2xl font-bold text-foreground md:text-3xl text-balance">Esplora per categoria</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <KBCategoryCard key={c.slug} category={c} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl text-balance">Glossario</h2>
              <p className="max-w-xl text-muted-foreground text-pretty">
                {GLOSSARY.length} termini chiave del revenue management e della gestione alberghiera, spiegati in modo
                chiaro.
              </p>
            </div>
            <Link
              href="/glossario"
              className="rounded-lg bg-primary-blue px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
            >
              Vai al glossario
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
