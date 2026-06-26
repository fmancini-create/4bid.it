import type { GuideSection } from "@/lib/knowledge-base"

/**
 * Table of Contents della guida, costruito dalle sezioni dichiarate nel registro.
 * Ancore interne (#id) per la navigazione e per lo Speakable/lettura assistita.
 */
export function KBTableOfContents({ sections }: { sections?: GuideSection[] }) {
  if (!sections || sections.length === 0) return null

  return (
    <nav aria-labelledby="toc-title" className="rounded-xl border border-border bg-card/50 p-5">
      <h2 id="toc-title" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Indice dei contenuti
      </h2>
      <ol className="space-y-2">
        {sections.map((s, i) => (
          <li key={s.id} className="flex gap-2 text-sm">
            <span className="text-primary-blue font-medium">{i + 1}.</span>
            <a href={`#${s.id}`} className="text-foreground hover:text-primary-blue transition-colors">
              {s.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
