import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookOpen } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { KBBreadcrumb } from "@/components/knowledge-base/kb-breadcrumb"
import { KBFaq } from "@/components/knowledge-base/kb-faq"
import { KBIcon } from "@/components/knowledge-base/kb-icon"
import { KBRelatedGuides } from "@/components/knowledge-base/kb-related-guides"
import {
  getAllCategories,
  getCategory,
  getGuidesByCategory,
  getGuidesBySubcategory,
  categoryUrl,
  guideUrl,
  kbBreadcrumbs,
  KB_BASE_PATH,
} from "@/lib/knowledge-base"
import { entitySchemaLinks } from "@/lib/seo/entities"

export const runtime = "nodejs"
export const dynamic = "force-static"

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ category: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return {}
  const url = categoryUrl(category.slug)
  return {
    title: `${category.title} | 4BID.IT`,
    description: category.short,
    alternates: { canonical: url },
    openGraph: {
      title: `${category.title} | 4BID.IT`,
      description: category.short,
      url,
      siteName: "4BID.IT",
      locale: "it_IT",
      type: "website",
    },
    robots: { index: true, follow: true },
  }
}

export default async function KBCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const url = categoryUrl(category.slug)
  const allGuides = getGuidesByCategory(category.slug)
  const breadcrumbs = kbBreadcrumbs({ name: category.name, url })
  const entityLinks = category.entity ? entitySchemaLinks(category.entity) : undefined

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="CollectionPage"
        title={category.title}
        description={category.short}
        url={url}
        breadcrumbs={breadcrumbs}
        faqs={category.faqs}
        speakable={["h1", ".kb-intro", ".kb-faq"]}
        about={entityLinks?.about}
        mentions={entityLinks?.mentions}
        hasParts={allGuides.map((g) => ({ name: g.title, url: guideUrl(g.categorySlug, g.slug) }))}
      />

      <Header />

      <section className="pt-32 pb-10 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4">
              <KBBreadcrumb items={breadcrumbs} />
            </div>
            <div className="mb-3 flex items-center gap-2 text-primary-blue">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-blue/10">
                <KBIcon name={category.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Knowledge Base</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl text-balance">{category.name}</h1>
            <p className="kb-intro max-w-2xl text-xl text-muted-foreground leading-relaxed text-pretty">
              {category.intro}
            </p>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl space-y-12">
            {category.subcategories.map((sub) => {
              const guides = getGuidesBySubcategory(category.slug, sub.slug)
              return (
                <div key={sub.slug}>
                  <h2 className="mb-1 text-2xl font-bold text-foreground text-balance">{sub.name}</h2>
                  <p className="mb-5 text-muted-foreground text-pretty">{sub.description}</p>
                  {guides.length > 0 ? (
                    <KBRelatedGuides guides={guides} title="" />
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                      <BookOpen className="h-5 w-5 flex-shrink-0 text-primary-blue" />
                      Guide in preparazione per questa sottocategoria.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {category.faqs && category.faqs.length > 0 && (
        <section className="py-14 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              <KBFaq faqs={category.faqs} />
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
