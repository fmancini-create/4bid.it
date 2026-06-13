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
 *
 * IMPORTANTE su Google News:
 * - Una ricerca generica viene "clusterizzata": per un brand poco citato torna
 *   spesso 1 solo risultato anche se gli articoli sono di più (es. "Santaddeo").
 * - L'operatore `site:` aggira il clustering e fa emergere gli articoli sepolti,
 *   ma restituisce anche TANTO rumore dell'intero sito -> serve `isRelevant()`.
 * Per questo combiniamo: query per brand + query per testata di settore, e poi
 * filtriamo SEMPRE i risultati con isRelevant() (titolo deve citare un brand).
 */
export const PRESS_KEYWORDS: PressKeyword[] = [
  // --- Query per brand (broad, senza qualificatori troppo restrittivi) ---
  { query: '"4 Bid" OR "4BID" OR "4bid.it"', label: "4BID" },
  { query: '"Santaddeo"', label: "Santaddeo" },
  { query: '"Manubot"', label: "Manubot" },
  { query: '"HotelProfitAI" OR "HotelProfit AI"', label: "HotelProfitAI" },
  { query: '"Hotel Accelerator" 4bid', label: "Hotel Accelerator" },
  { query: '"4BID Ecomobility" OR "Ecomobility 4bid"', label: "4BID Ecomobility" },
  { query: '"Autoexel"', label: "Autoexel" },
]

/**
 * Testate di settore (turismo/hospitality) dove i nostri brand compaiono o
 * potrebbero comparire. Le interroghiamo con `site:` per scavalcare il
 * clustering di Google News, poi filtriamo con isRelevant().
 */
const OUTLET_SITES = [
  "travelnostop.com",
  "guidaviaggi.it",
  "hotelmag.it",
  "italiaatavola.net",
  "jobintourism.it",
  "mastermeeting.it",
  "hospitalitynews.it",
]

/** Termini brand usati dal filtro di pertinenza (normalizzati lowercase, no spazi doppi). */
const BRAND_TOKENS = [
  "santaddeo",
  "4 bid",
  "4bid",
  "manubot",
  "hotelprofit",
  "hotel accelerator",
  "ecomobility",
  "autoexel",
]

/** Titoli "spazzatura" di Google News (pagine archivio/categoria/tagline testata). */
const JUNK_TITLE_RE = /(archivi$|^categoria:|il giornale del|^home$|cookie policy|privacy policy)/i

/**
 * Tiene solo le notizie che citano davvero un nostro brand nel titolo o snippet.
 * Senza questo filtro le query `site:` porterebbero in coda decine di articoli
 * non pertinenti (es. "Alitalia", "Falkensteiner").
 */
export function isRelevant(item: { title: string; snippet: string | null }): boolean {
  const hay = `${item.title} ${item.snippet || ""}`.toLowerCase().replace(/\s+/g, " ")
  if (JUNK_TITLE_RE.test(item.title.trim())) return false
  return BRAND_TOKENS.some((t) => hay.includes(t))
}

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

/**
 * Chiave di dedup per le menzioni stampa.
 *
 * NON usiamo l'URL perché Google News restituisce un link di redirect DIVERSO
 * per ogni query (token univoco): lo stesso articolo avrebbe hash diversi.
 * Deduplichiamo invece su titolo normalizzato + fonte, che restano costanti.
 */
export function pressDedupHash(title: string, source: string | null): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // accenti
      .replace(/[^a-z0-9]+/g, " ") // punteggiatura/virgolette -> spazio
      .replace(/\s+/g, " ")
      .trim()
  const key = `${norm(title)}|${norm(source || "")}`
  return crypto.createHash("sha256").update(key).digest("hex")
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

/**
 * Interroga Google News per tutte le keyword configurate + le testate di
 * settore (via `site:`), applica il filtro di pertinenza e deduplica per URL.
 */
export async function fetchAllNews(): Promise<{ items: RawNewsItem[]; errors: string[] }> {
  const errors: string[] = []
  const byHash = new Map<string, RawNewsItem>()

  // Tutte le query: per brand + per testata di settore.
  const queries: PressKeyword[] = [...PRESS_KEYWORDS]
  const brandGroup = '("4 Bid" OR "4bid" OR Santaddeo OR Manubot OR HotelProfitAI OR "Hotel Accelerator" OR Autoexel)'
  for (const site of OUTLET_SITES) {
    queries.push({ query: `${brandGroup} site:${site}`, label: `site:${site}` })
  }

  for (const kw of queries) {
    try {
      const found = await fetchNewsForKeyword(kw)
      for (const item of found) {
        if (!isRelevant(item)) continue
        const h = pressDedupHash(item.title, item.source)
        // tiene il primo match; preferisce una label di brand a una label site:
        const existing = byHash.get(h)
        if (!existing) {
          byHash.set(h, item)
        } else if (existing.keyword.startsWith("site:") && !item.keyword.startsWith("site:")) {
          byHash.set(h, item)
        }
      }
    } catch (e: any) {
      errors.push(e.message || String(e))
    }
  }

  return { items: [...byHash.values()], errors }
}
