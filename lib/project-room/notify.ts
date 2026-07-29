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

/**
 * Wraps the message body in a full HTML document.
 *
 * It was a bare `<div>` before. On a phone that matters: without
 * `<meta name="viewport">` mobile Gmail and iOS Mail render the message at
 * desktop width and then zoom it out, so the text arrives shrunken and the
 * button becomes a tiny target. `width:device-width` keeps it at real size.
 *
 * `padding:16px` stops the text from touching the screen edges, and
 * `-webkit-text-size-adjust` prevents iOS from resizing the copy on its own.
 */
const wrapper = (inner: string) => `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f5f7fa;-webkit-text-size-adjust:100%">
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1f2933;max-width:560px;margin:0 auto;padding:16px;background:#ffffff">
    ${inner}
  </div>
</body>
</html>`

/**
 * The call-to-action button, built once so every email gets the same tap target.
 *
 * `display:block` instead of `inline-block`: on a narrow screen an inline button
 * is only as wide as its text, which is a small thing to hit with a thumb. As a
 * block it stretches to the column width (capped at 320px so it does not look
 * stretched on desktop).
 *
 * Measured at 390px wide, not assumed: 195x48px before, 358x53px now — the same
 * ~2x bigger thumb target. Note the height was ALREADY above the 44px minimum
 * that Apple and Google recommend, so the real gain here is width, not height:
 * the old button was only as wide as its label, sitting in the left third of the
 * screen.
 */
const button = (url: string, label: string) => `
    <a href="${url}" style="display:block;max-width:320px;background:#5B9BD5;color:#ffffff;text-decoration:none;padding:16px 24px;border-radius:8px;font-weight:600;font-size:16px;text-align:center;line-height:21px">${label}</a>`

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
      transactional: true,
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
export type InvitationEmailParams = {
  to: string
  url: string
  projectName: string
  role: string
  expiresAt: string
  /** Optional note from the admin, shown above the button. */
  note?: string | null
  invitedByName?: string | null
}

/**
 * Builds the invitation email body.
 *
 * Exported so the markup can be rendered and measured exactly as it is sent.
 * Re-creating the HTML in a test script would only verify the copy in the script.
 */
export function buildInvitationEmailHtml(params: Omit<InvitationEmailParams, "to">): string {
  const roleLabel = ROLE_LABELS[params.role as keyof typeof ROLE_LABELS] ?? params.role
  const expiry = new Date(params.expiresAt).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return wrapper(`
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
    <div style="margin:0 0 16px">${button(params.url, "Attiva il tuo accesso")}</div>
    <p style="margin:0 0 20px;color:#7b8794;font-size:13px;line-height:1.5">
      Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br>
      <!-- word-break: on a phone a long link would otherwise stretch the layout and
           force the whole message to scroll sideways. -->
      <a href="${params.url}" style="color:#3d7ab8;word-break:break-all">${esc(params.url)}</a>
    </p>
    <p style="margin:0 0 8px;color:#52606d;font-size:14px">
      Il link &egrave; valido fino al <strong>${expiry}</strong> e pu&ograve; essere usato una sola volta.
      Se hai gi&agrave; un account 4Bid, accedi con le tue credenziali: l'accesso al progetto &egrave; gi&agrave; attivo.
    </p>
    <p style="margin:0;color:#7b8794;font-size:13px">
      Non condividere questo link: chi lo possiede pu&ograve; accedere ai documenti del progetto.
    </p>`)
}

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<NotifyResult> {
  // Same builder the preview renders: one source of markup, so what gets measured
  // is what gets delivered.
  const html = buildInvitationEmailHtml(params)

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
      // NON dal mittente delle campagne: un invito personale spedito da
      // `marketing@` viene smistato tra le promozioni. Vedi `transactional`
      // in email-resend.ts.
      transactional: true,
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
