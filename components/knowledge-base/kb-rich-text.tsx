import { autoLinkGlossary } from "@/lib/knowledge-base"
import { GlossaryTermLink } from "./glossary-term-link"

/**
 * Renderizza un testo applicando l'AUTO-LINK del glossario: la prima occorrenza
 * di ogni termine (o alias) diventa un collegamento alla relativa voce.
 * Pensato per i paragrafi delle guide: il glossario si richiama da solo.
 */
export function KBRichText({ children, className }: { children: string; className?: string }) {
  const segments = autoLinkGlossary(children)
  return (
    <p className={className}>
      {segments.map((seg, i) =>
        seg.termSlug ? (
          <GlossaryTermLink key={i} slug={seg.termSlug}>
            {seg.text}
          </GlossaryTermLink>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  )
}
