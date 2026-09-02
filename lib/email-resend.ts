// Legacy filename kept to avoid touching every caller in this migration.
// Runtime routing is now provider-agnostic:
// - transactional/service email -> Google Workspace (SMTP_* env vars), with a
//   Brevo failover only when Workspace fails before an SMTP session starts
// - DEM/follow-up marketing email -> Brevo SMTP relay (BREVO_* env vars)

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

let workspaceTransporter: any = null
let brevoTransporter: any = null

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

function workspaceSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = smtpPassword()
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10)
  const explicitSecure = process.env.SMTP_SECURE?.trim().toLowerCase()
  const secure = explicitSecure ? explicitSecure === "true" : port === 465
  const normalizedPort = Number.isFinite(port) ? port : 587

  if (!host || !user || !pass) return null

  return {
    host,
    port: normalizedPort,
    secure,
    requireTLS: !secure && normalizedPort === 587,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    auth: { user, pass },
    // A connection that has not produced an SMTP greeting within five seconds
    // is considered unavailable. On transactional mail we can then use the
    // Brevo fallback while still being comfortably inside cron execution time.
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 30_000,
  }
}

function brevoPassword(): string | undefined {
  return process.env.BREVO_SMTP_KEY?.trim() || process.env.BREVO_SMTP_PASSWORD?.trim()
}

function brevoSmtpConfig() {
  const host = process.env.BREVO_SMTP_HOST?.trim() || "smtp-relay.brevo.com"
  const user = process.env.BREVO_SMTP_USER?.trim()
  const pass = brevoPassword()
  const port = Number.parseInt(process.env.BREVO_SMTP_PORT || "587", 10)
  const explicitSecure = process.env.BREVO_SMTP_SECURE?.trim().toLowerCase()
  const secure = explicitSecure ? explicitSecure === "true" : port === 465
  const normalizedPort = Number.isFinite(port) ? port : 587

  if (!user || !pass) return null

  return {
    host,
    port: normalizedPort,
    secure,
    requireTLS: !secure && normalizedPort === 587,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  }
}

function resolveFrom(transactional: boolean): string | null {
  if (transactional) {
    const user = process.env.SMTP_USER?.trim()
    const configured = process.env.SMTP_FROM_TRANSACTIONAL?.trim() || process.env.SMTP_FROM?.trim()
    if (configured) return configured
    return user ? `4Bid Project Room <${user}>` : null
  }

  const brevoUser = process.env.BREVO_SMTP_USER?.trim()
  const configured = process.env.BREVO_FROM_MARKETING?.trim() || process.env.SMTP_FROM_MARKETING?.trim()
  if (configured) return configured
  return brevoUser ? `4BID SRL <${brevoUser}>` : null
}

function resolveTransactionalFallbackFrom(): string | null {
  return process.env.BREVO_FROM_TRANSACTIONAL?.trim() || resolveFrom(false)
}

function resolveReplyTo(transactional: boolean, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim()
  if (transactional) {
    return process.env.SMTP_REPLY_TO?.trim() || process.env.SMTP_FROM?.trim() || "clienti@4bid.it"
  }
  return process.env.BREVO_REPLY_TO?.trim() || process.env.SMTP_REPLY_TO?.trim() || "clienti@4bid.it"
}

function smtpStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null
  const record = error as Record<string, unknown>
  if (typeof record.responseCode === "number") return record.responseCode
  return null
}

function isPreDeliveryConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  const command = typeof record.command === "string" ? record.command.toUpperCase() : ""
  const code = typeof record.code === "string" ? record.code.toUpperCase() : ""

  // CONN means Nodemailer never completed the initial SMTP connection, so the
  // original provider could not have accepted the message. Restrict fallback to
  // network-level failures to avoid ever retrying an ambiguous delivery state.
  if (command !== "CONN") return false
  return ["ETIMEDOUT", "ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND", "EAI_AGAIN"].includes(code)
}

function getTransporter(transactional: boolean, config: Record<string, unknown>) {
  if (transactional) {
    if (!workspaceTransporter) workspaceTransporter = nodemailer.createTransport(config)
    return workspaceTransporter
  }
  if (!brevoTransporter) brevoTransporter = nodemailer.createTransport(config)
  return brevoTransporter
}

function mailPayload(
  options: Pick<EmailOptions, "to" | "subject" | "html" | "text" | "replyTo" | "attachments">,
  from: string,
  headers: Record<string, string>,
  transactionalReplyTo: boolean,
) {
  const { to, subject, html, text, replyTo, attachments } = options
  return {
    from,
    to,
    subject,
    html,
    text: text && text.trim() ? text : htmlToText(html),
    replyTo: resolveReplyTo(transactionalReplyTo, replyTo),
    headers,
    attachments:
      attachments && attachments.length > 0
        ? attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          }))
        : undefined,
  }
}

function successFromInfo(info: any, providerName: string) {
  const rejected = Array.isArray(info?.rejected) ? info.rejected : []
  if (rejected.length > 0) {
    return {
      success: false as const,
      error: `Destinatario rifiutato dal provider: ${rejected.join(", ")}`,
      systemic: false,
      statusCode: null,
      rejected,
    }
  }

  return { success: true as const, messageId: info?.messageId, provider: providerName }
}

export async function sendEmail(options: EmailOptions): Promise<any> {
  const { to } = options

  // Gli invii multi-destinatario vengono serializzati per destinatario. In questo
  // modo un rifiuto parziale SMTP non viene scambiato per successo globale e non
  // rischiamo di saltare definitivamente chi e' stato rifiutato.
  if (Array.isArray(to) && to.length > 1) {
    const results = []
    for (const recipient of to) {
      results.push(await sendEmail({ ...options, to: recipient }))
    }
    const failed = results.filter((r) => !r.success)
    if (failed.length > 0) {
      return {
        success: false as const,
        error: `${failed.length} destinatari non accettati dal provider`,
        systemic: failed.some((r) => r.systemic === true),
        results,
      }
    }
    return { success: true as const, provider: results[0]?.provider, results }
  }

  const {
    subject,
    html,
    text,
    replyTo,
    attachments,
    headers,
    listUnsubscribe,
    campaignId,
    transactional = false,
  } = options

  const providerName = transactional ? "Google Workspace SMTP" : "Brevo SMTP"
  const config = transactional ? workspaceSmtpConfig() : brevoSmtpConfig()
  const from = resolveFrom(transactional)

  if (!config || !from) {
    const message = transactional
      ? "Configurazione email transazionale incompleta: verificare SMTP_HOST, SMTP_USER, SMTP_PASSWORD/SMTP_PASS e mittente SMTP"
      : "Configurazione Brevo incompleta: verificare BREVO_SMTP_USER, BREVO_SMTP_KEY/BREVO_SMTP_PASSWORD e BREVO_FROM_MARKETING"
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
  const payloadOptions = { to, subject, html, text, replyTo, attachments }

  try {
    const transporter = getTransporter(transactional, config)
    const info = await transporter.sendMail(mailPayload(payloadOptions, from, mergedHeaders, transactional))
    return successFromInfo(info, providerName)
  } catch (error) {
    console.error(`[v0] Errore invio ${providerName}:`, error)

    if (transactional && isPreDeliveryConnectionError(error)) {
      // The pooled connection may be poisoned after a network failure; force a
      // fresh Workspace connection on the next independent send.
      workspaceTransporter = null

      const fallbackConfig = brevoSmtpConfig()
      const fallbackFrom = resolveTransactionalFallbackFrom()
      if (fallbackConfig && fallbackFrom) {
        try {
          console.warn("[v0] Google Workspace non raggiungibile prima della sessione SMTP: fallback transazionale su Brevo")
          const fallbackTransporter = getTransporter(false, fallbackConfig)
          const fallbackInfo = await fallbackTransporter.sendMail(
            mailPayload(payloadOptions, fallbackFrom, mergedHeaders, true),
          )
          const result = successFromInfo(fallbackInfo, "Brevo SMTP (transactional fallback)")
          if (result.success) return result
          return result
        } catch (fallbackError) {
          console.error("[v0] Errore fallback transazionale Brevo SMTP:", fallbackError)
          const fallbackMessage =
            fallbackError instanceof Error ? fallbackError.message : "Errore Brevo SMTP fallback sconosciuto"
          const fallbackStatusCode = smtpStatusCode(fallbackError)
          return {
            success: false as const,
            error: `Google Workspace non raggiungibile; fallback Brevo fallito: ${fallbackMessage}`,
            systemic: isSystemicEmailProviderError({ message: fallbackMessage, statusCode: fallbackStatusCode }),
            statusCode: fallbackStatusCode,
          }
        }
      }
    }

    const message = error instanceof Error ? error.message : `Errore ${providerName} sconosciuto`
    const statusCode = smtpStatusCode(error)
    return {
      success: false as const,
      error: message,
      systemic: isSystemicEmailProviderError({ message, statusCode }),
      statusCode,
    }
  }
}
