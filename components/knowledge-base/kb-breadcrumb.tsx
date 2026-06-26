import Link from "next/link"
import { ChevronRight } from "lucide-react"

/**
 * Breadcrumb VISIBILE della Knowledge Base. Lo schema BreadcrumbList è emesso
 * separatamente da StructuredData; qui forniamo la navigazione per l'utente.
 * Gli URL possono essere assoluti (4bid.it/...) o relativi: vengono normalizzati.
 */
export function KBBreadcrumb({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const toHref = (url: string) => url.replace(/^https?:\/\/www\.4bid\.it/, "") || "/"

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.url} className="flex items-center gap-1">
              {isLast ? (
                <span className="text-foreground" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={toHref(item.url)} className="hover:text-primary-blue transition-colors">
                  {item.name}
                </Link>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
