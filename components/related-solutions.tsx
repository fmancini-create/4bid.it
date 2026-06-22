import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getRelatedSolutions } from "@/lib/seo/solutions"

/**
 * Blocco "Soluzioni correlate" da inserire in fondo alle landing (prima del Footer).
 * Crea link interni contestuali verso le altre soluzioni dello stesso cluster
 * tematico: risolve il problema delle pagine orfane e rafforza i silo SEO.
 */
export function RelatedSolutions({
  currentSlug,
  title = "Soluzioni correlate",
  limit = 6,
}: {
  currentSlug: string
  title?: string
  limit?: number
}) {
  const related = getRelatedSolutions(currentSlug, limit)
  if (related.length === 0) return null

  return (
    <section className="py-16 px-4 bg-background border-t border-border" aria-labelledby="related-solutions-title">
      <div className="container mx-auto max-w-6xl">
        <h2 id="related-solutions-title" className="text-2xl md:text-3xl font-bold mb-3 text-foreground text-balance">
          {title}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl text-pretty">
          Approfondisci le altre soluzioni di revenue management che potrebbero interessarti.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="group flex flex-col gap-2 rounded-lg border border-border p-5 transition-colors hover:border-primary-blue hover:bg-muted/50"
            >
              <span className="flex items-center justify-between gap-2 font-semibold text-foreground">
                {s.title}
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary-blue transition-transform group-hover:translate-x-1" />
              </span>
              <span className="text-sm text-muted-foreground">{s.short}</span>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/soluzioni-revenue-management" className="inline-flex items-center gap-2 font-semibold text-primary-blue hover:underline">
            Vedi tutte le soluzioni di revenue management
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
