"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, ArrowRight } from "lucide-react"

export interface KBSearchItem {
  title: string
  description: string
  href: string
  kind: "Categoria" | "Glossario" | "Guida"
  /** Testo extra per il match (alias, parole chiave). */
  haystack?: string
}

/**
 * Ricerca interna della Knowledge Base. Filtro client-side su un indice statico
 * passato dal server (categorie + glossario). Nessuna dipendenza esterna.
 */
export function KBSearch({ items, placeholder = "Cerca nella Knowledge Base..." }: { items: KBSearchItem[]; placeholder?: string }) {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return items
      .filter((it) =>
        `${it.title} ${it.description} ${it.haystack ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [items, query])

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Cerca nella Knowledge Base"
          className="w-full rounded-xl border border-border bg-card py-3.5 pl-12 pr-4 text-foreground outline-none transition-colors focus:border-primary-blue"
        />
      </div>

      {query.trim() && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted-foreground">Nessun risultato per &quot;{query}&quot;.</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{r.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{r.description}</span>
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-2">
                      <span className="rounded-full bg-primary-blue/10 px-2 py-0.5 text-xs text-primary-blue">
                        {r.kind}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
