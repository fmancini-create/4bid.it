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

export async function sendEmail({ to, subject, html, replyTo, attachments }: EmailOptions) {
  const client = getClient()
  if (!client) {
    console.error("[v0] RESEND_API_KEY non configurata")
    return { success: false, error: "RESEND_API_KEY non configurata" }
  }

  try {
    const { data, error } = await client.emails.send({
      from: resolveFrom(),
      to,
      subject,
      html,
      // Replies go to a monitored mailbox. Order: explicit arg > env override > default.
      replyTo: replyTo || process.env.RESEND_REPLY_TO || process.env.SMTP_FROM || "clienti@4bid.it",
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
