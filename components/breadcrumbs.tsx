import Link from "next/link"
import { ChevronRight } from "lucide-react"

export type BreadcrumbItem = {
  name: string
  href: string
}

/**
 * Breadcrumb visibile e leggero, da posizionare sopra il contenuto (dopo l'Header).
 * Deve restare COERENTE con il BreadcrumbList JSON-LD dichiarato nella stessa pagina
 * (stesse voci, stesso ordine): Google raccomanda che i dati strutturati riflettano
 * la navigazione reale mostrata all'utente.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <nav aria-label="Percorso di navigazione" className="border-b border-border bg-muted/30">
      <div className="container mx-auto px-6">
        <ol className="flex flex-wrap items-center gap-1 py-3 text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <li key={item.href} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-60" aria-hidden="true" />}
                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="transition-colors hover:text-primary-blue">
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
