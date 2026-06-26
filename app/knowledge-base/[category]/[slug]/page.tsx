import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { KBArticle } from "@/components/knowledge-base/kb-article"
import { KBRichText } from "@/components/knowledge-base/kb-rich-text"
import { getGuide, getCategory, getPublishedGuides, guideUrl } from "@/lib/knowledge-base"

/**
 * TEMPLATE master della singola guida (Categoria → Guida).
 *
 * FASE 5 = SOLA STRUTTURA: il registro GUIDES è vuoto, quindi
 * generateStaticParams ritorna [] e nessuna pagina viene generata.
 * Appena una guida pubblicata viene aggiunta al registro (taxonomy.ts),
 * questa route la renderizza automaticamente con tutti gli schema.
 */
export function generateStaticParams() {
  return getPublishedGuides().map((g) => ({
    category: g.categorySlug,
    slug: g.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category, slug } = await params
  const guide = getGuide(slug)
  if (!guide || guide.categorySlug !== category) {
    return { title: "Guida non trovata | 4BID" }
  }
  const url = guideUrl(guide.categorySlug, guide.slug)
  return {
    title: `${guide.title} | Knowledge Base 4BID`,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      url,
      siteName: "4BID.IT",
      locale: "it_IT",
      images: [{ url: "/og-image-4bid.jpg", width: 1024, height: 1024, alt: guide.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
      images: ["/og-image-4bid.jpg"],
    },
  }
}

export default async function KnowledgeBaseGuidePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const guide = getGuide(slug)

  // Nessun contenuto in FASE 5, o categoria non corrispondente → 404.
  if (!guide || guide.categorySlug !== category || !getCategory(category)) {
    notFound()
  }

  const bodyForReadingTime = guide.sections.map((s) => `${s.heading} ${s.body ?? ""}`).join(" ")

  return (
    <>
      <Header />
      <KBArticle guide={guide} filePath={guide.filePath} bodyForReadingTime={bodyForReadingTime}>
        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl text-balance">{section.heading}</h2>
            {section.body ? <KBRichText>{section.body}</KBRichText> : null}
          </section>
        ))}
      </KBArticle>
      <Footer />
    </>
  )
}
