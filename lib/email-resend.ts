import { Resend } from "resend"

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType?: string
}

interface EmailOptions {
  /**
   * Destinatario singolo oppure elenco.
   *
   * NON passare piu indirizzi in una sola stringa separata da virgole: l'API di
   * Resend la rifiuta con un 422 `validation_error`. Per piu destinatari usare
   * un array, che viene inoltrato all'API cosi com'e.
   */
  to: string | string[]
  subject: string
  html: string
  /**
   * Versione testo semplice. Se non fornita viene generata automaticamente
   * dall'HTML. Inviare SEMPRE una parte text/plain oltre all'HTML migliora la
   * deliverability (le mail solo-HTML sono un classico segnale di spam).
   */
  text?: string
  replyTo?: string
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
  /**
   * Controllo dell'header List-Unsubscribe (richiesto da Gmail/Yahoo per i
   * mittenti di massa, migliora molto la deliverability):
   * - undefined (default): viene generato automaticamente un link one-click
   *   per il destinatario, salvo che `headers` ne contenga gia uno.
   * - string: usa quell'URL come endpoint di disiscrizione.
   * - false: non aggiunge alcun header (per email puramente transazionali).
   */
  listUnsubscribe?: string | false
  /** Id campagna opzionale, accodato al link di disiscrizione. */
  campaignId?: string
  /**
   * Usa il mittente per la posta di SERVIZIO (inviti, avvisi) invece di quello
   * pubblicitario.
   *
   * Perche' esiste: le 10 campagne DEM hanno raggiunto oltre 31.000 indirizzi
   * partendo da `marketing@mrk.4bid.it`, e finora un invito personale partiva
   * dalla stessa identita'. Per Gmail e' un segnale da posta pubblicitaria, che
   * la smista in Promozioni o Spam invece della posta in arrivo.
   *
   * ATTENZIONE: entrambi i mittenti devono restare su `mrk.4bid.it`, il solo
   * dominio verificato su Resend. Verificato con l'API: `progetti@4bid.it` e
   * `no-reply@px.4bid.it` vengono RIFIUTATI con 403 "domain is not verified",
   * quindi spostare li' il mittente non migliorerebbe il recapito: azzererebbe
   * gli invii. La parte prima della chiocciola invece e' libera.
   */
  transactional?: boolean
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it").replace(/\/$/, "")
const UNSUBSCRIBE_MAILTO = "clienti@4bid.it"

/**
 * Converte l'HTML dell'email in testo semplice leggibile:
 * - rimuove head/style/script e i marker di allegato/tracking
 * - trasforma <a href> in "testo (url)" per non perdere i link
 * - preserva le interruzioni di riga di blocchi e <br>
 * - decodifica le entita' HTML piu' comuni
 * Nessuna dipendenza esterna: sufficiente per una parte text/plain di fallback.
 */
export function htmlToText(html: string): string {
  let s = html
  // Rimuovi commenti HTML (inclusi i marker <!--ATTACH:...-->).
  s = s.replace(/<!--[\s\S]*?-->/g, "")
  // Rimuovi blocchi non testuali.
  s = s.replace(/<(head|style|script)[\s\S]*?<\/\1>/gi, "")
  // Link: mantieni testo + URL (salta ancore/mailto gia' leggibili e placeholder).
  s = s.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
    const label = inner.replace(/<[^>]+>/g, "").trim()
    const url = String(href).trim()
    if (!url || url.startsWith("{{") || url.startsWith("mailto:") || label === url) return label
    return `${label} (${url})`
  })
  // Interruzioni di riga per <br> e chiusure di blocco.
  s = s.replace(/<br\s*\/?>/gi, "\n")
  s = s.replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
  s = s.replace(/<li[^>]*>/gi, "- ")
  // Rimuovi tutti i tag residui.
  s = s.replace(/<[^>]+>/g, "")
  // Decodifica entita' comuni.
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&egrave;/gi, "è")
    .replace(/&agrave;/gi, "à")
  // Normalizza spazi e righe vuote multiple.
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ")
  return s.trim()
}

/**
 * Costruisce gli header List-Unsubscribe (+ List-Unsubscribe-Post per il
 * one-click RFC 8058). Ritorna {} se non applicabile.
 */
function buildUnsubscribeHeaders(
  to: string | string[],
  listUnsubscribe: string | false | undefined,
  campaignId: string | undefined,
  existing: Record<string, string> | undefined,
): Record<string, string> {
  // Disabilitato esplicitamente.
  if (listUnsubscribe === false) return {}
  // Chi invia ha gia impostato il proprio header (es. il sistema DEM): non tocchiamo.
  const hasHeader = existing && Object.keys(existing).some((k) => k.toLowerCase() === "list-unsubscribe")
  if (hasHeader) return {}
  // Solo per destinatario singolo (il one-click deve essere per-utente): un
  // array con piu indirizzi, o una stringa con la virgola, non sono ammessi.
  const recipients = Array.isArray(to) ? to : [to]
  if (recipients.length !== 1 || recipients[0].includes(",")) return {}
  const single = recipients[0]

  let url: string
  if (typeof listUnsubscribe === "string") {
    url = listUnsubscribe
  } else {
    const encoded = Buffer.from(single.trim().toLowerCase()).toString("base64url")
    url = `${SITE_URL}/api/dem/unsubscribe?e=${encoded}${campaignId ? `&c=${encodeURIComponent(campaignId)}` : ""}`
  }

  return {
    "List-Unsubscribe": `<${url}>, <mailto:${UNSUBSCRIBE_MAILTO}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  }
}

// Lazily create the client so the module can be imported even if the key is
// missing (we return a clean error instead of throwing at import time).
let _client: Resend | null = null
function getClient(): Resend | null {
  if (_client) return _client
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _client = new Resend(key)
  return _client
}

/**
 * Resolve the "From" address.
 * - RESEND_FROM should be a verified sender on your Resend account,
 *   e.g. `4BID.IT <dem@mail.4bid.it>`.
 * - Falls back to Resend's shared test sender, which can ONLY deliver to the
 *   email address that owns the Resend account (useful for the first test).
 */
function resolveFrom(transactional?: boolean): string {
  if (transactional) {
    const tx = process.env.RESEND_FROM_TRANSACTIONAL?.trim()
    if (tx) return tx
    // Stesso dominio verificato, identita' diversa: un invito personale non deve
    // presentarsi come "marketing". Il nome visualizzato dice a cosa serve, cosi
    // il destinatario riconosce il messaggio anche se lo trova tra le promozioni.
    return "4Bid Project Room <progetti@mrk.4bid.it>"
  }
  const from = process.env.RESEND_FROM?.trim()
  if (from) return from
  // Default sender on the verified subdomain mrk.4bid.it.
  // A monitored mailbox (not no-reply) improves deliverability and trust.
  // NOTE: works only once the domain is "Verified" on Resend.
  return "4BID SRL <marketing@mrk.4bid.it>"
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments,
  headers,
  listUnsubscribe,
  campaignId,
  transactional,
}: EmailOptions) {
  const client = getClient()
  if (!client) {
    console.error("[v0] RESEND_API_KEY non configurata")
    return { success: false, error: "RESEND_API_KEY non configurata" }
  }

  // Header List-Unsubscribe (one-click) generati in automatico se non disabilitati.
  const mergedHeaders = {
    ...buildUnsubscribeHeaders(to, listUnsubscribe, campaignId, headers),
    ...headers,
  }

  try {
    const { data, error } = await client.emails.send({
      from: resolveFrom(transactional),
      to,
      subject,
      html,
      // Parte text/plain: fornita esplicitamente o derivata dall'HTML.
      text: text && text.trim() ? text : htmlToText(html),
      // Replies go to a monitored mailbox. Order: explicit arg > env override > default.
      replyTo: replyTo || process.env.RESEND_REPLY_TO || process.env.SMTP_FROM || "clienti@4bid.it",
      headers: mergedHeaders,
      attachments:
        attachments && attachments.length > 0
          ? attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType,
            }))
          : undefined,
    })

    if (error) {
      console.error("[v0] Errore invio Resend:", error)
      return { success: false, error: error.message || "Errore Resend" }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error("[v0] Eccezione invio Resend:", error)
    return { success: false, error: error instanceof Error ? error.message : "Errore sconosciuto" }
  }
}
