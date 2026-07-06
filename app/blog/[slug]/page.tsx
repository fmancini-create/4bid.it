import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookOpen, Clock, ChevronLeft, ExternalLink, HelpCircle } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ContactButton } from "@/components/contact-button"
import { BlogContent } from "@/components/blog/blog-content"
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog/posts"

export const runtime = "nodejs"
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const url = `https://www.4bid.it/blog/${post.slug}`
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords.join(", "),
    alternates: { canonical: url },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url,
      siteName: "4BID.IT",
      locale: "it_IT",
      type: "article",
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
    },
    robots: { index: true, follow: true },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const url = `https://www.4bid.it/blog/${post.slug}`

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title={post.title}
        description={post.metaDescription}
        url={url}
        datePublished={post.datePublished}
        dateModified={post.dateModified}
        keywords={post.keywords}
        faqs={post.faqs}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Blog", url: "https://www.4bid.it/blog" },
          { name: post.title, url },
        ]}
      />

      <Header />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/blog"
              title="Torna al blog"
              className="inline-flex items-center gap-1 text-sm text-primary-blue hover:underline mb-6"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Torna al blog
            </Link>
            <div className="flex items-center gap-2 text-primary-blue mb-4">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">{post.category}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {post.readingMinutes} min di lettura
              </span>
              <span>Aggiornato il {formatDate(post.dateModified)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-foreground leading-relaxed text-pretty border-l-4 border-primary-blue pl-5">
              {post.intro}
            </p>
          </div>
        </div>
      </section>

      {/* Corpo articolo */}
      <article className="pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <BlogContent blocks={post.body} />
          </div>
        </div>
      </article>

      {/* FAQ */}
      {post.faqs.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Domande frequenti</h2>
              <div className="space-y-4">
                {post.faqs.map((faq, i) => (
                  <div key={i} className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{faq.question}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Risorse correlate */}
      {post.related.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">Risorse correlate</h2>
              <div className="space-y-3">
                {post.related.map((link, i) => (
                  <Link
                    key={i}
                    href={link.url}
                    title={link.title}
                    className="flex items-center gap-2 text-primary-blue hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Vuoi applicarlo alla tua struttura?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-pretty">
            Il team 4BID aiuta hotel, B&amp;B e agriturismi ad aumentare i ricavi con consulenza e software di revenue
            management. Parliamone.
          </p>
          <ContactButton size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
            Richiedi una consulenza
          </ContactButton>
        </div>
      </section>

      <Footer />
    </div>
  )
}
