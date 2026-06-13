import crypto from "crypto"

/**
 * Libreria per "Parlano di noi": interroga il feed RSS di Google News per le
 * keyword dell'azienda e dei prodotti 4BID, senza alcuna API key.
 *
 * Endpoint usato (gratuito):
 *   https://news.google.com/rss/search?q=<query>&hl=it&gl=IT&ceid=IT:it
 */

export interface PressKeyword {
  /** Query inviata a Google News (frase esatta tra virgolette per ridurre il rumore) */
  query: string
  /** Etichetta salvata su DB per sapere quale termine ha generato il match */
  label: string
}

/**
 * Keyword monitorate: tutti i prodotti + azienda.
 * Le frasi sono tra virgolette per forzare il match esatto su Google News.
 */
export const PRESS_KEYWORDS: PressKeyword[] = [
  { query: '"4BID SRL"', label: "4BID SRL" },
  { query: '"4bid.it"', label: "4bid.it" },
  { query: '"Santaddeo" revenue management', label: "Santaddeo" },
  { query: '"Manubot"', label: "Manubot" },
  { query: '"HotelProfitAI" OR "HotelProfit AI"', label: "HotelProfitAI" },
  { query: '"Hotel Accelerator" 4bid', label: "Hotel Accelerator" },
  { query: '"4BID Ecomobility"', label: "4BID Ecomobility" },
  { query: '"Autoexel"', label: "Autoexel" },
]

export interface RawNewsItem {
  title: string
  url: string
  source: string | null
  snippet: string | null
  publishedAt: string | null
  keyword: string
}

function buildFeedUrl(query: string): string {
  const q = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${q}&hl=it&gl=IT&ceid=IT:it`
}

/** Estrae il contenuto del primo tag indicato all'interno di un blocco XML. */
function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  const m = block.match(re)
  if (!m) return null
  return m[1].trim()
}

/** Rimuove CDATA e decodifica le entità HTML più comuni. */
function clean(value: string | null): string | null {
  if (!value) return null
  let v = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  // 1) decodifica le entità PRIMA (così &lt;a href&gt; torna un vero tag)
  v = v
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
  // 2) poi rimuove tutti i tag HTML (inclusi quelli ricomparsi dalla decodifica)
  v = v.replace(/<[^>]+>/g, " ")
  return v.replace(/\s+/g, " ").trim()
}

/**
 * Normalizza un URL per il dedup: lowercase su host, rimozione di slash finali
 * e parametri di tracking. Usato per generare l'hash univoco.
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ""
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "oc"]
    drop.forEach((p) => u.searchParams.delete(p))
    let s = `${u.protocol}//${u.host.toLowerCase()}${u.pathname}`.replace(/\/$/, "")
    const qs = u.searchParams.toString()
    if (qs) s += `?${qs}`
    return s
  } catch {
    return url.trim()
  }
}

export function hashUrl(url: string): string {
  return crypto.createHash("sha256").update(normalizeUrl(url)).digest("hex")
}

/** Parsa il body RSS in una lista di item grezzi. */
function parseRss(xml: string, keyword: string): RawNewsItem[] {
  const items: RawNewsItem[] = []
  const blocks = xml.match(/<item>([\s\S]*?)<\/item>/gi) || []
  for (const block of blocks) {
    const title = clean(extractTag(block, "title"))
    const rawLink = clean(extractTag(block, "link"))
    if (!title || !rawLink) continue

    const pubDateRaw = extractTag(block, "pubDate")
    const publishedAt = pubDateRaw ? new Date(pubDateRaw.trim()).toISOString() : null

    // Google News mette spesso "Titolo - Fonte" e/o un tag <source>
    const source = clean(extractTag(block, "source"))
    let cleanTitle = title
    let resolvedSource = source
    const dashIdx = title.lastIndexOf(" - ")
    if (dashIdx > 0 && dashIdx > title.length - 60) {
      const tail = title.slice(dashIdx + 3).trim()
      // rimuove il suffisso "- Fonte" dal titolo (sia che la fonte arrivi dal tag, sia dal titolo)
      cleanTitle = title.slice(0, dashIdx).trim()
      if (!resolvedSource) resolvedSource = tail
    }

    const snippet = clean(extractTag(block, "description"))
    // Google News spesso mette in description solo "Titolo Fonte": inutile da mostrare.
    const isRedundantSnippet =
      !snippet || snippet.startsWith(cleanTitle) || cleanTitle.startsWith(snippet.slice(0, 40))

    items.push({
      title: cleanTitle,
      url: rawLink,
      source: resolvedSource,
      snippet: isRedundantSnippet ? null : snippet.slice(0, 500),
      publishedAt: publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? publishedAt : null,
      keyword,
    })
  }
  return items
}

/** Interroga Google News per una singola keyword. */
export async function fetchNewsForKeyword(kw: PressKeyword): Promise<RawNewsItem[]> {
  const res = await fetch(buildFeedUrl(kw.query), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 4BID-PressBot/1.0; +https://www.4bid.it)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    // evita cache lato fetch
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Google News HTTP ${res.status} per "${kw.label}"`)
  }
  const xml = await res.text()
  return parseRss(xml, kw.label)
}

/** Interroga Google News per tutte le keyword configurate. */
export async function fetchAllNews(): Promise<{ items: RawNewsItem[]; errors: string[] }> {
  const items: RawNewsItem[] = []
  const errors: string[] = []
  for (const kw of PRESS_KEYWORDS) {
    try {
      const found = await fetchNewsForKeyword(kw)
      items.push(...found)
    } catch (e: any) {
      errors.push(e.message || String(e))
    }
  }
  return { items, errors }
}
