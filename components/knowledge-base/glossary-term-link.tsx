import Link from "next/link"
import { getGlossaryTerm } from "@/lib/knowledge-base"

/**
 * Richiamo inline di un termine del glossario. Collega alla pagina /glossario/[slug]
 * e mostra la definizione come tooltip nativo. Usato dall'auto-link nelle guide.
 */
export function GlossaryTermLink({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const term = getGlossaryTerm(slug)
  if (!term) return <>{children}</>

  return (
    <Link
      href={`/glossario/${term.slug}`}
      title={term.definition}
      className="border-b border-dotted border-primary-blue/60 text-primary-blue decoration-dotted underline-offset-2 hover:border-primary-blue"
    >
      {children}
    </Link>
  )
}
