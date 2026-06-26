import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getRelatedEntityLinks, type EntityKey } from "@/lib/seo/entities"

/**
 * Sezione "Approfondimenti correlati": rete di collegamenti contestuali tra le
 * entità del sito (brand, fondatore, metodo, prodotti, concetti di dominio).
 * Rafforza l'Entity SEO e il linking interno collegando le pagine pertinenti.
 * Mostra SOLO entità con pagina reale esistente.
 */
export function EntityLinks({
  entityKey,
  title = "Approfondimenti correlati",
  limit = 6,
  variant = "default",
}: {
  entityKey: EntityKey
  title?: string
  limit?: number
  variant?: "default" | "dark"
}) {
  const links = getRelatedEntityLinks(entityKey, limit)
  if (links.length === 0) return null

  const isDark = variant === "dark"

  return (
    <section
      className={
        isDark
          ? "py-16 px-4 bg-[#0a0a0a] border-t border-white/10"
          : "py-16 px-4 bg-background border-t border-border"
      }
      aria-labelledby="entity-links-title"
    >
      <div className="container mx-auto max-w-6xl">
        <h2
          id="entity-links-title"
          className={`text-2xl md:text-3xl font-bold mb-3 text-balance ${isDark ? "text-white" : "text-foreground"}`}
        >
          {title}
        </h2>
        <p className={`mb-8 max-w-2xl text-pretty ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>
          Esplora le pagine e i prodotti collegati a questo argomento.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={
                isDark
                  ? "group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/30"
                  : "group flex flex-col gap-2 rounded-lg border border-border p-5 transition-colors hover:border-primary-blue hover:bg-muted/50"
              }
            >
              <span
                className={`flex items-center justify-between gap-2 font-semibold ${isDark ? "text-white" : "text-foreground"}`}
              >
                {l.name}
                <ArrowRight
                  className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1 ${isDark ? "text-blue-400" : "text-primary-blue"}`}
                />
              </span>
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>{l.short}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
