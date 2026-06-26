import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { guideUrl, type KBGuide } from "@/lib/knowledge-base"

/**
 * "Approfondimenti correlati" della Knowledge Base: collega le guide tra loro.
 * Mostra solo guide pubblicate. In FASE 5 (nessuna guida) non renderizza nulla.
 */
export function KBRelatedGuides({
  guides,
  title = "Approfondimenti correlati",
}: {
  guides: KBGuide[]
  title?: string
}) {
  if (!guides || guides.length === 0) return null

  return (
    <section aria-labelledby="related-title">
      <h2 id="related-title" className="mb-6 text-2xl font-bold text-foreground md:text-3xl text-balance">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={guideUrl(g.categorySlug, g.slug).replace("https://www.4bid.it", "")}
            className="group flex flex-col gap-2 rounded-lg border border-border p-5 transition-colors hover:border-primary-blue hover:bg-muted/50"
          >
            <span className="flex items-center justify-between gap-2 font-semibold text-foreground">
              {g.title}
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary-blue transition-transform group-hover:translate-x-1" />
            </span>
            <span className="text-sm text-muted-foreground">{g.description}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
