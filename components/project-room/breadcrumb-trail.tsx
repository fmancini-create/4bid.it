import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumb trail for the reserved area.
 * The last crumb is the current page and is marked `aria-current`, so screen
 * readers announce position rather than offering a link to the same page.
 */
export function BreadcrumbTrail({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Percorso di navigazione">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded transition-colors hover:text-primary-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="max-w-[16rem] truncate font-medium text-brand-navy" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
