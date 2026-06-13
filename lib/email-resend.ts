import { Resend } from "resend"

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType?: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
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
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it").replace(/\/$/, "")
const UNSUBSCRIBE_MAILTO = "clienti@4bid.it"

/**
 * Costruisce gli header List-Unsubscribe (+ List-Unsubscribe-Post per il
 * one-click RFC 8058). Ritorna {} se non applicabile.
 */
function buildUnsubscribeHeaders(
  to: string,
  listUnsubscribe: string | false | undefined,
  campaignId: string | undefined,
  existing: Record<string, string> | undefined,
): Record<string, string> {
  // Disabilitato esplicitamente.
  if (listUnsubscribe === false) return {}
  // Chi invia ha gia impostato il proprio header (es. il sistema DEM): non tocchiamo.
  const hasHeader = existing && Object.keys(existing).some((k) => k.toLowerCase() === "list-unsubscribe")
  if (hasHeader) return {}
  // Solo per destinatario singolo (il one-click deve essere per-utente).
  if (to.includes(",")) return {}

  let url: string
  if (typeof listUnsubscribe === "string") {
    url = listUnsubscribe
  } else {
    const encoded = Buffer.from(to.trim().toLowerCase()).toString("base64url")
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
function resolveFrom(): string {
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
  replyTo,
  attachments,
  headers,
  listUnsubscribe,
  campaignId,
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
      from: resolveFrom(),
      to,
      subject,
      html,
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
