import { createHash } from "crypto"
import {
  PROJECT_TERMS_SOURCES,
  type ProjectTermsFailure,
  type ProjectTermsSnapshot,
  type QuoteContractTerms,
  type TermsBlock,
  type TermsProject,
} from "./terms"

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»",
  egrave: "è", eacute: "é", agrave: "à", ograve: "ò", ugrave: "ù", igrave: "ì", euro: "€", hellip: "…", ndash: "–", mdash: "—",
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[String(name).toLowerCase()] ?? match)
}

/**
 * Estrae il contenuto leggibile: solo <main>, senza menu, intestazioni e pie'
 * di pagina, altrimenti il cliente si troverebbe il sito intero dentro le
 * condizioni e il confronto fra versioni diventerebbe rumore.
 */
export function extractTermsBlocks(html: string): TermsBlock[] {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html
  const cleaned = main.replace(/<(script|style|nav|footer|header|svg)\b[\s\S]*?<\/\1>/gi, " ")
  const blocks: TermsBlock[] = []
  const pattern = /<(h[1-4]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(cleaned))) {
    const tag = match[1].toLowerCase()
    const text = decodeEntities(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
    if (!text) continue
    if (blocks.length && blocks[blocks.length - 1].text === text) continue
    blocks.push({ type: tag.startsWith("h") ? "heading" : tag === "li" ? "item" : "paragraph", text })
  }
  return blocks
}

export function termsVersionFrom(blocks: TermsBlock[]): string | null {
  for (const block of blocks) {
    const found = block.text.match(/(?:ultimo aggiornamento|aggiornato il|in vigore dal|last updated)\s*:?\s*([^.]{3,60})/i)
    if (found) return found[1].trim()
  }
  return null
}

export function blocksToText(blocks: TermsBlock[]): string {
  return blocks.map(block => (block.type === "item" ? `- ${block.text}` : block.text)).join("\n")
}

async function fetchProjectTerms(project: TermsProject): Promise<ProjectTermsSnapshot | ProjectTermsFailure> {
  const source = PROJECT_TERMS_SOURCES[project]
  const url = process.env[`${project.toUpperCase()}_TERMS_URL`] || source.url
  const fetchedAt = new Date().toISOString()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal, headers: { "user-agent": "4bid-quotes/1.0" } })
    if (!response.ok) throw new Error(`pagina non disponibile (${response.status})`)
    const blocks = extractTermsBlocks(await response.text())
    const text = blocksToText(blocks)
    // Una pagina che risponde 200 ma senza testo e' un fallimento: senza questa
    // soglia il preventivo mostrerebbe una sezione vuota spacciata per condizioni.
    if (text.length < 400) throw new Error(`contenuto troppo breve (${text.length} caratteri): condizioni non riconosciute`)
    return {
      project,
      label: source.label,
      url,
      title: blocks.find(block => block.type === "heading")?.text || `Condizioni ${source.label}`,
      version: termsVersionFrom(blocks),
      blocks,
      text,
      characters: text.length,
      hash: createHash("sha256").update(text).digest("hex").slice(0, 16),
      fetched_at: fetchedAt,
    }
  } catch (error) {
    const reason = (error as Error)?.name === "AbortError" ? "tempo scaduto" : (error as Error)?.message || "errore sconosciuto"
    return { project, label: source.label, url, error: reason, fetched_at: fetchedAt }
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchContractTerms(projects: TermsProject[]): Promise<QuoteContractTerms> {
  const unique = [...new Set(projects)]
  const results = await Promise.all(unique.map(fetchProjectTerms))
  return {
    version: 1,
    generated_at: new Date().toISOString(),
    projects: results.filter((entry): entry is ProjectTermsSnapshot => "blocks" in entry),
    failures: results.filter((entry): entry is ProjectTermsFailure => "error" in entry),
  }
}
