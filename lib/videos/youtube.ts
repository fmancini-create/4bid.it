/**
 * Libreria "Video guide": importa i video del canale YouTube di 4BID dal feed
 * RSS pubblico del canale, senza alcuna API key e senza costi.
 *
 * Endpoint usato (gratuito, pubblico):
 *   https://www.youtube.com/feeds/videos.xml?channel_id=<CHANNEL_ID>
 *
 * Il feed restituisce gli ultimi ~15 video con: videoId, titolo, descrizione,
 * data di pubblicazione e miniatura. La durata NON e' esposta dal feed RSS:
 * resta null (opzionale nello schema VideoObject).
 */

/** ID del canale YouTube di 4BID ("4 BID SRL Revenue Guru"). */
export const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCHvdH9ci_8Zkl4D-bAoMOBw"

/** URL pubblico del canale, usato nei link e nello schema SEO. */
export const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`

export interface RawVideoItem {
  videoId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  publishedAt: string | null
}

function feedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
}

/** Estrae il contenuto del primo tag indicato all'interno di un blocco XML. */
function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  const m = block.match(re)
  return m ? m[1].trim() : null
}

/** Estrae il valore di un attributo da un tag self-closing (es. media:thumbnail url="..."). */
function extractAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}="([^"]+)"`, "i")
  const m = block.match(re)
  return m ? m[1] : null
}

/** Rimuove CDATA e decodifica le entita' HTML piu' comuni. */
function clean(value: string | null): string | null {
  if (!value) return null
  let v = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  v = v
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
  return v.replace(/\s+/g, " ").trim()
}

/** Miniatura ad alta risoluzione ricostruita dal videoId (piu' affidabile del feed). */
export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

/** Parsa il feed Atom del canale in una lista di video grezzi. */
function parseFeed(xml: string): RawVideoItem[] {
  const items: RawVideoItem[] = []
  const blocks = xml.match(/<entry>([\s\S]*?)<\/entry>/gi) || []
  for (const block of blocks) {
    const videoId = clean(extractTag(block, "yt:videoId"))
    const title = clean(extractTag(block, "title"))
    if (!videoId || !title) continue

    const publishedRaw = extractTag(block, "published")
    const publishedAt =
      publishedRaw && !Number.isNaN(Date.parse(publishedRaw.trim()))
        ? new Date(publishedRaw.trim()).toISOString()
        : null

    // La descrizione sta in media:description (spesso vuota per i video importati).
    const description = clean(extractTag(block, "media:description"))
    const thumbnailUrl = extractAttr(block, "media:thumbnail", "url") || thumbnailFor(videoId)

    items.push({
      videoId,
      title,
      description: description || null,
      thumbnailUrl,
      publishedAt,
    })
  }
  return items
}

/**
 * Scarica e parsa il feed RSS del canale YouTube configurato.
 * Ritorna { items, error }: in caso di problemi non lancia, cosi' il chiamante
 * (cron/admin) puo' gestire l'errore senza far fallire l'intera richiesta.
 */
export async function fetchChannelVideos(
  channelId: string = YOUTUBE_CHANNEL_ID,
): Promise<{ items: RawVideoItem[]; error: string | null }> {
  try {
    const res = await fetch(feedUrl(channelId), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; 4BID-VideoBot/1.0; +https://www.4bid.it)",
        Accept: "application/atom+xml, application/xml, text/xml",
      },
      cache: "no-store",
    })
    if (!res.ok) {
      return { items: [], error: `YouTube RSS HTTP ${res.status}` }
    }
    const xml = await res.text()
    return { items: parseFeed(xml), error: null }
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : "Errore feed YouTube" }
  }
}

/** Estrae il videoId da un URL YouTube (watch, youtu.be, shorts, embed) o da un ID nudo. */
export function parseYoutubeId(input: string): string | null {
  const raw = input.trim()
  // ID nudo (11 caratteri tipici di YouTube)
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw
  try {
    const u = new URL(raw)
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0]
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v")
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v
      // /shorts/<id> oppure /embed/<id>
      const m = u.pathname.match(/\/(shorts|embed|v)\/([A-Za-z0-9_-]{11})/)
      if (m) return m[2]
    }
  } catch {
    // non e' un URL valido
  }
  return null
}
