const nodemailer = require("nodemailer")
import { isSystemicEmailProviderError } from "@/lib/dem/provider-health"

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType?: string
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
  listUnsubscribe?: string | false
  campaignId?: string
  transactional?: boolean
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it").replace(/\/$/, "")
const UNSUBSCRIBE_MAILTO = "clienti@4bid.it"

export function htmlToText(html: string): string {
  let s = html
  s = s.replace(/<!--[\s\S]*?-->/g, "")
  s = s.replace(/<(head|style|script)[\s\S]*?<\/\1>/gi, "")
  s = s.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
    const label = inner.replace(/<[^>]+>/g, "").trim()
    const url = String(href).trim()
    if (!url || url.startsWith("{{") || url.startsWith("mailto:") || label === url) return label
    return `${label} (${url})`
  })
  s = s.replace(/<br\s*\/?>/gi, "\n")
  s = s.replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
  s = s.replace(/<li[^>]*>/gi, "- ")
  s = s.replace(/<[^>]+>/g, "")
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&egrave;/gi, "è")
    .replace(/&agrave;/gi, "à")
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ")
  return s.trim()
}

function buildUnsubscribeHeaders(
  to: string | string[],
  listUnsubscribe: string | false | undefined,
  campaignId: string | undefined,
  existing: Record<string, string> | undefined,
): Record<string, string> {
  if (listUnsubscribe === false) return {}
  const hasHeader = existing && Object.keys(existing).some((k) => k.toLowerCase() === "list-unsubscribe")
  if (hasHeader) return {}
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

function smtpPassword(): string | undefined {
  return process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim()
}

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = smtpPassword()
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10)
  const explicitSecure = process.env.SMTP_SECURE?.trim().toLowerCase()
  const secure = explicitSecure ? explicitSecure === "true" : port === 465

  if (!host || !user || !pass) return null

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  }
}

function resolveFrom(transactional?: boolean): string {
  const user = process.env.SMTP_USER?.trim() || "clienti@4bid.it"
  const configured = transactional
    ? process.env.SMTP_FROM_TRANSACTIONAL?.trim()
    : process.env.SMTP_FROM_MARKETING?.trim()
  const fallback = process.env.SMTP_FROM?.trim()
  if (configured) return configured
  if (fallback) return fallback
  return transactional ? `4Bid Project Room <${user}>` : `4BID SRL <${user}>`
}

function smtpStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null
  const record = error as Record<string, unknown>
  if (typeof record.responseCode === "number") return record.responseCode
  return null
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
  const config = smtpConfig()
  if (!config) {
    const message = "Configurazione SMTP incompleta: verificare SMTP_HOST, SMTP_USER e SMTP_PASSWORD/SMTP_PASS"
    console.error(`[v0] ${message}`)
    return {
      success: false as const,
      error: message,
      systemic: true,
      statusCode: null,
    }
  }

  const mergedHeaders = {
    ...buildUnsubscribeHeaders(to, listUnsubscribe, campaignId, headers),
    ...headers,
  }

  try {
    const transporter = nodemailer.createTransport(config)
    const info = await transporter.sendMail({
      from: resolveFrom(transactional),
      to,
      subject,
      html,
      text: text && text.trim() ? text : htmlToText(html),
      replyTo: replyTo || process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || "clienti@4bid.it",
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

    return { success: true as const, messageId: info?.messageId }
  } catch (error) {
    console.error("[v0] Errore invio SMTP:", error)
    const message = error instanceof Error ? error.message : "Errore SMTP sconosciuto"
    const statusCode = smtpStatusCode(error)
    return {
      success: false as const,
      error: message,
      systemic: isSystemicEmailProviderError({ message, statusCode }),
      statusCode,
    }
  }
}
