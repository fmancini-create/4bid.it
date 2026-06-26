// Punto di accesso unico alla Knowledge Base pubblica + helper trasversali.

export * from "./types"
export * from "./glossary"
export * from "./taxonomy"

import { GLOSSARY } from "./glossary"
import { KB_BASE_URL } from "./taxonomy"

const BASE = "https://www.4bid.it"

/** Stima del tempo di lettura (parole / 200 wpm, minimo 1 minuto). */
export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Etichetta leggibile: "4 min di lettura". */
export function readingTimeLabel(text: string): string {
  return `${readingTimeMinutes(text)} min di lettura`
}

export interface KBBreadcrumbItem {
  name: string
  url: string
}

/** Breadcrumb base della Knowledge Base (Home → Knowledge Base → …). */
export function kbBreadcrumbs(...trail: KBBreadcrumbItem[]): KBBreadcrumbItem[] {
  return [
    { name: "Home", url: BASE },
    { name: "Knowledge Base", url: KB_BASE_URL },
    ...trail,
  ]
}

/**
 * Auto-link del glossario: dato un testo, individua la PRIMA occorrenza di
 * ciascun termine (o alias) e restituisce i segmenti, marcando i match con lo
 * slug del termine. Pensato per richiamare automaticamente il glossario nelle
 * guide senza dover taggare a mano. Case-insensitive, una sola volta per termine.
 */
export interface AutoLinkSegment {
  text: string
  termSlug?: string
}

export function autoLinkGlossary(text: string): AutoLinkSegment[] {
  // Costruisce coppie [pattern, slug] ordinate per lunghezza decrescente
  // così i termini più lunghi/specifici hanno precedenza.
  const patterns: { needle: string; slug: string }[] = []
  for (const t of GLOSSARY) {
    const variants = [t.term, ...(t.aliases ?? [])]
    for (const v of variants) patterns.push({ needle: v.toLowerCase(), slug: t.slug })
  }
  patterns.sort((a, b) => b.needle.length - a.needle.length)

  const used = new Set<string>()
  const segments: AutoLinkSegment[] = [{ text }]

  for (const { needle, slug } of patterns) {
    if (used.has(slug)) continue
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if (seg.termSlug) continue // già linkato
      const idx = seg.text.toLowerCase().indexOf(needle)
      if (idx === -1) continue
      // Verifica confine di parola semplice
      const before = seg.text[idx - 1]
      const after = seg.text[idx + needle.length]
      const isWordBoundary = (c?: string) => c === undefined || /[^a-zà-ù0-9]/i.test(c)
      if (!isWordBoundary(before) || !isWordBoundary(after)) continue

      const matched = seg.text.slice(idx, idx + needle.length)
      const left = seg.text.slice(0, idx)
      const right = seg.text.slice(idx + needle.length)
      const replacement: AutoLinkSegment[] = []
      if (left) replacement.push({ text: left })
      replacement.push({ text: matched, termSlug: slug })
      if (right) replacement.push({ text: right })
      segments.splice(i, 1, ...replacement)
      used.add(slug)
      break
    }
  }
  return segments
}

export function glossaryUrl(slug: string): string {
  return `${BASE}/glossario/${slug}`
}

export const GLOSSARY_BASE_URL = `${BASE}/glossario`
