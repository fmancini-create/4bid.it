/**
 * Outbound notifications for the Project Room.
 *
 * Two rules hold for everything in this file:
 *
 *   1. Sending must never fail the caller. An access request that is already
 *      saved, or an invitation that already exists, must not be reported as an
 *      error because an SMTP hop was down. Every function returns a result
 *      object and swallows its own exceptions.
 *   2. Recipients are resolved from the database, not from a hardcoded address.
 *      `SUPER_ADMIN_EMAIL` is currently copy-pasted into a dozen admin pages;
 *      duplicating it again here would mean a new admin silently never gets
 *      notified.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-resend"
import { ROLE_LABELS } from "@/lib/project-room/types"

/** Last-resort recipient if no organisation admin has a readable email. */
const FALLBACK_ADMIN_EMAIL = "f.mancini@4bid.it"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it").replace(/\/$/, "")

export interface NotifyResult {
  sent: boolean
  /** Present when sending was attempted and failed. Safe to show to an admin. */
  error?: string
  /** How many recipients the message went to. */
  recipients?: number
}

/** Minimal HTML escaping: these values come from a public, unauthenticated form. */
function esc(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Domains reserved by RFC 2606/6761: they can never receive mail. Test accounts
 * end up in the admin list during verification, and sending to them produces
 * hard bounces that damage the sending domain's reputation for the real
 * recipients — so they are dropped before the send, not after.
 */
const UNDELIVERABLE_TLDS = [".test", ".invalid", ".example", ".localhost", ".local"]

function isUndeliverable(email: string): boolean {
  const domain = email.split("@")[1] ?? ""
  return UNDELIVERABLE_TLDS.some((tld) => domain.endsWith(tld))
}

/**
 * Email addresses of every admin of the organisation.
 *
 * Falls back to the known super admin address when the lookup yields nothing,
 * so a misconfigured membership table cannot silence the alert entirely.
 */
async function resolveAdminEmails(): Promise<string[]> {
  try {
    const db = createAdminClient()
    const { data: admins } = await db.from("pr_organization_members").select("user_id").eq("role", "admin")

    const ids = [...new Set((admins ?? []).map((row) => row.user_id).filter(Boolean))]
    if (ids.length === 0) return [FALLBACK_ADMIN_EMAIL]

    // No PostgREST embed: joins on this schema have proved ambiguous before.
    const { data: profiles } = await db.from("profiles").select("email").in("id", ids)

    const emails = [
      ...new Set(
        (profiles ?? [])
          .map((row) => (typeof row.email === "string" ? row.email.trim().toLowerCase() : ""))
          .filter((email) => email.includes("@") && !isUndeliverable(email)),
      ),
    ]

    return emails.length > 0 ? emails : [FALLBACK_ADMIN_EMAIL]
  } catch (error) {
    console.log("[v0] resolveAdminEmails failed:", error instanceof Error ? error.message : "unknown")
    return [FALLBACK_ADMIN_EMAIL]
  }
}

const wrapper = (inner: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2933;max-width:560px">
  ${inner}
</div>`

/**
 * Tells the 4Bid admins that somebody asked for Project Room access.
 *
 * Without this the request landed in a table nobody was watching: the row was
 * written correctly and no human was told, which is indistinguishable from the
 * form being broken.
 */
export async function notifyNewAccessRequest(request: {
  first_name: string
  last_name: string
  email: string
  company?: string | null
  job_role?: string | null
  phone?: string | null
  message?: string | null
  /** True when an existing pending request was re-submitted rather than created. */
  resubmitted?: boolean
}): Promise<NotifyResult> {
  const recipients = await resolveAdminEmails()
  const name = `${request.first_name} ${request.last_name}`.trim()
  const panelUrl = `${SITE_URL}/area-riservata/admin`

  const rows: [string, string | null | undefined][] = [
    ["Nome", name],
    ["Email", request.email],
    ["Azienda", request.company],
    ["Ruolo", request.job_role],
    ["Telefono", request.phone],
  ]

  const details = rows
    .filter(([, value]) => Boolean(value))
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#52606d">${label}</td><td style="padding:4px 0"><strong>${esc(value)}</strong></td></tr>`,
    )
    .join("")

  const subject = request.resubmitted
    ? `Richiesta accesso aggiornata: ${name}`
    : `Nuova richiesta di accesso alla Project Room: ${name}`

  const html = wrapper(`
    <h2 style="margin:0 0 4px;font-size:19px">${request.resubmitted ? "Richiesta di accesso aggiornata" : "Nuova richiesta di accesso"}</h2>
    <p style="margin:0 0 16px;color:#52606d">Project Room 4Bid</p>
    <table style="border-collapse:collapse;margin-bottom:16px">${details}</table>
    ${
      request.message
        ? `<p style="margin:0 0 4px;color:#52606d">Messaggio</p>
           <blockquote style="margin:0 0 16px;padding:10px 14px;background:#f5f7fa;border-left:3px solid #5B9BD5;white-space:pre-wrap">${esc(request.message)}</blockquote>`
        : ""
    }
    <p style="margin:0 0 20px">
      <a href="${panelUrl}" style="display:inline-block;background:#5B9BD5;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:600">Apri il pannello e approva</a>
    </p>
    <p style="margin:0;color:#7b8794;font-size:13px">
      La richiesta resta in attesa finche non viene approvata o rifiutata dal pannello.
    </p>`)

  try {
    const result = await sendEmail({
      // Array, non una stringa con virgole: Resend risponde 422 in quel caso.
      to: recipients,
      subject,
      html,
      replyTo: request.email,
      // Purely transactional: an unsubscribe header on an internal alert would
      // let one click switch off the notifications this whole feature depends on.
      listUnsubscribe: false,
    })

    if (!result.success) {
      console.log("[v0] access request alert not sent:", result.error)
      return { sent: false, error: result.error, recipients: recipients.length }
    }
    return { sent: true, recipients: recipients.length }
  } catch (error) {
    console.log("[v0] access request alert threw:", error instanceof Error ? error.message : "unknown")
    return { sent: false, error: "Invio non riuscito." }
  }
}

/**
 * Delivers an invitation link to the invited client.
 *
 * The raw token is a bearer credential, so it appears in the message body and
 * nowhere else: it is never logged here, and the caller must not persist it.
 */
export async function sendInvitationEmail(params: {
  to: string
  url: string
  projectName: string
  role: string
  expiresAt: string
  /** Optional note from the admin, shown above the button. */
  note?: string | null
  invitedByName?: string | null
}): Promise<NotifyResult> {
  const roleLabel = ROLE_LABELS[params.role as keyof typeof ROLE_LABELS] ?? params.role
  const expiry = new Date(params.expiresAt).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const html = wrapper(`
    <h2 style="margin:0 0 4px;font-size:19px">Accesso alla Project Room</h2>
    <p style="margin:0 0 16px;color:#52606d">${esc(params.invitedByName) || "4Bid"} ti ha dato accesso al progetto <strong>${esc(params.projectName)}</strong>.</p>
    ${
      params.note
        ? `<blockquote style="margin:0 0 16px;padding:10px 14px;background:#f5f7fa;border-left:3px solid #5B9BD5;white-space:pre-wrap">${esc(params.note)}</blockquote>`
        : ""
    }
    <table style="border-collapse:collapse;margin-bottom:16px">
      <tr><td style="padding:4px 12px 4px 0;color:#52606d">Progetto</td><td style="padding:4px 0"><strong>${esc(params.projectName)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#52606d">Ruolo</td><td style="padding:4px 0"><strong>${esc(roleLabel)}</strong></td></tr>
    </table>
    <p style="margin:0 0 20px">
      <a href="${params.url}" style="display:inline-block;background:#5B9BD5;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:600">Attiva il tuo accesso</a>
    </p>
    <p style="margin:0 0 8px;color:#52606d;font-size:13px">
      Il link e valido fino al <strong>${expiry}</strong> e puo essere usato una sola volta.
      Se hai gia un account 4Bid, accedi con le tue credenziali: l'accesso al progetto e gia attivo.
    </p>
    <p style="margin:0;color:#7b8794;font-size:13px">
      Non condividere questo link: chi lo possiede puo accedere ai documenti del progetto.
    </p>`)

  // Resend ACCEPTS reserved domains like .test and only fails later, at delivery:
  // the API would report success while the message hard-bounces, so the panel
  // would claim "email inviata" for an address that can never receive it. Those
  // bounces also degrade the sending domain's reputation for real clients.
  if (isUndeliverable(params.to)) {
    return { sent: false, error: "Dominio non recapitabile: inoltra il link manualmente." }
  }

  try {
    const result = await sendEmail({
      to: params.to,
      subject: `Accesso alla Project Room 4Bid: ${params.projectName}`,
      html,
      listUnsubscribe: false,
    })

    if (!result.success) {
      console.log("[v0] invitation email not sent:", result.error)
      return { sent: false, error: result.error }
    }
    return { sent: true, recipients: 1 }
  } catch (error) {
    console.log("[v0] invitation email threw:", error instanceof Error ? error.message : "unknown")
    return { sent: false, error: "Invio non riuscito." }
  }
}
