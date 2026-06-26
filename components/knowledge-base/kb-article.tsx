import Link from "next/link"
import { BookOpen } from "lucide-react"
import { StructuredData } from "@/components/seo-structured-data"
import {
  getCategory,
  getGlossaryTerm,
  getRelatedGuides,
  guideUrl,
  kbBreadcrumbs,
  readingTimeLabel,
  KB_BASE_PATH,
  KB_DEFAULT_AUTHOR,
  type KBGuide,
} from "@/lib/knowledge-base"
import { entitySchemaLinks } from "@/lib/seo/entities"
import { KBBreadcrumb } from "./kb-breadcrumb"
import { KBMeta } from "./kb-meta"
import { KBTableOfContents } from "./kb-table-of-contents"
import { KBFaq } from "./kb-faq"
import { KBRelatedGuides } from "./kb-related-guides"

/**
 * TEMPLATE master della guida della Knowledge Base. Compone automaticamente:
 * breadcrumb, meta (autore/tempo lettura/ultimo aggiornamento), TOC, contenuto,
 * glossario, FAQ e approfondimenti correlati. Emette gli schema:
 * Article + BreadcrumbList + FAQPage + HowTo (se presente) + Speakable + about/mentions.
 *
 * In FASE 5 non esistono guide pubblicate: questo template è pronto e
 * type-safe, e renderizzerà non appena una guida viene aggiunta al registro.
 */
export function KBArticle({
  guide,
  filePath,
  /** Stima testuale per il tempo di lettura (concatenazione del corpo). */
  bodyForReadingTime = "",
  children,
}: {
  guide: KBGuide
  filePath: string
  bodyForReadingTime?: string
  children: React.ReactNode
}) {
  const category = getCategory(guide.categorySlug)
  const url = guideUrl(guide.categorySlug, guide.slug)
  const related = getRelatedGuides(guide.slug)
  const usedTerms = (guide.glossaryTerms ?? [])
    .map((s) => getGlossaryTerm(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  const breadcrumbs = kbBreadcrumbs(
    ...(category ? [{ name: category.name, url: `https://www.4bid.it${KB_BASE_PATH}/${category.slug}` }] : []),
    { name: guide.title, url },
  )

  const entityLinks = guide.entity ? entitySchemaLinks(guide.entity) : undefined

  return (
    <article className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title={guide.title}
        description={guide.description}
        url={url}
        keywords={guide.keywords}
        breadcrumbs={breadcrumbs}
        faqs={guide.faqs}
        howTo={guide.howTo}
        speakable={["h1", ".kb-summary", ".kb-faq"]}
        about={entityLinks?.about}
        mentions={entityLinks?.mentions}
      />

      {/* Hero */}
      <section className="pt-32 pb-10 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4">
              <KBBreadcrumb items={breadcrumbs} />
            </div>
            <div className="mb-3 flex items-center gap-2 text-primary-blue">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-medium">{category?.name ?? "Knowledge Base"}</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl text-balance">{guide.title}</h1>
            <p className="kb-summary mb-5 text-xl text-muted-foreground leading-relaxed text-pretty">
              {guide.description}
            </p>
            <KBMeta
              author={guide.author ?? KB_DEFAULT_AUTHOR}
              readingTime={readingTimeLabel(`${guide.description} ${bodyForReadingTime}`)}
              filePath={filePath}
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar: TOC */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <KBTableOfContents sections={guide.sections} />
          </aside>

          {/* Contenuto */}
          <div className="max-w-3xl space-y-12">
            <div className="prose prose-lg max-w-none text-muted-foreground">{children}</div>

            {/* Glossario richiamato */}
            {usedTerms.length > 0 && (
              <section aria-labelledby="glossary-title">
                <h2
                  id="glossary-title"
                  className="mb-6 text-2xl font-bold text-foreground md:text-3xl text-balance"
                >
                  Glossario
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {usedTerms.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/glossario/${t.slug}`}
                      className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary-blue"
                    >
                      <span className="font-mono font-semibold text-primary-blue">{t.term}</span>
                      <p className="mt-1 text-sm text-muted-foreground">{t.definition}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <KBFaq faqs={guide.faqs} />
            <KBRelatedGuides guides={related} />
          </div>
        </div>
      </div>
    </article>
  )
}
