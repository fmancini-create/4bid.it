/**
 * Resend an invitation, optionally correcting the address, role or download
 * permission.
 *
 * Link handling, which is the whole point of this endpoint:
 *   - address unchanged  -> the SAME link is resent, when it can be recovered
 *   - address changed    -> a NEW link is always issued and the old one dies
 *
 * That second rule is not negotiable. The first recipient already holds a
 * working credential for a confidential project; if the address was mistyped,
 * quietly resending the same link would leave a stranger with access. Rotating
 * is the only correct behaviour, and the response reports which of the two
 * happened so the UI can never imply otherwise.
 */

import { NextResponse } from "next/server"

import { recordAudit } from "@/lib/project-room/activity"
import { isUuid, requireOrgAdmin } from "@/lib/project-room/auth"
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
  invitationUrl,
  isInvitableRole,
} from "@/lib/project-room/invitations"
import { sendInvitationEmail } from "@/lib/project-room/notify"
import { canPreserveTokens, openToken, sealToken, tokenMatchesFingerprint } from "@/lib/project-room/token-vault"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireOrgAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Identificativo invito non valido." }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    payload = {}
  }
  const body = (payload ?? {}) as Record<string, unknown>

  const db = createAdminClient()

  const { data: invitation, error: fetchError } = await db
    .from("pr_invitations")
    // `revoked_at` is required, not decorative: the rotation rule below keys off
    // it. Leaving it out of this list made `invitation.revoked_at` undefined, so
    // the "a revoked invitation must come back with a fresh link" branch read as
    // present in the source but could never fire.
    .select(
      "id, project_id, email, role, can_download, token, token_sealed, accepted_at, revoked_at, resend_count",
    )
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("[v0] invitation lookup failed:", fetchError.message)
    return NextResponse.json({ error: "Impossibile leggere l'invito." }, { status: 500 })
  }
  if (!invitation) {
    return NextResponse.json({ error: "Invito non trovato." }, { status: 404 })
  }

  // An accepted invitation has already become a real membership. Re-mailing a
  // link would either fail on accept or look like a second account.
  if (invitation.accepted_at) {
    return NextResponse.json(
      {
        error:
          "Questo invito è già stato accettato: la persona ha accesso. Gestisci i suoi permessi dai membri del progetto.",
      },
      { status: 409 },
    )
  }

  // ---- requested changes -------------------------------------------------

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : invitation.email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Indirizzo email non valido." }, { status: 400 })
  }

  // Reserved TLDs are accepted by Resend but can never be delivered, so the UI
  // would report success for an address that hard-bounces and damages the
  // sender reputation.
  if (/\.(test|invalid|example|localhost)$/i.test(email)) {
    return NextResponse.json({ error: "Questo dominio non può ricevere email. Usa un indirizzo reale." }, { status: 400 })
  }

  const role = body.role === undefined ? invitation.role : body.role
  if (!isInvitableRole(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 })
  }

  const canDownload = body.can_download === undefined ? invitation.can_download === true : body.can_download === true
  const emailChanged = email !== invitation.email

  // ---- decide the link ---------------------------------------------------

  let raw: string | null = null
  let tokenHash = invitation.token as string
  let sealed = invitation.token_sealed as string | null
  let rotated = true
  let rotationReason: string | null = null

  if (emailChanged) {
    rotationReason = "address_changed"
  } else if (invitation.revoked_at) {
    // A revocation is a deliberate act: an admin decided that link had to stop
    // working, and one common reason is that it leaked. Reviving the invitation
    // with the SAME link would reopen exactly the hole the revocation closed, so
    // a revoked invitation always comes back with a fresh link.
    rotationReason = "was_revoked"
  } else if (!canPreserveTokens()) {
    rotationReason = "no_key"
  } else {
    const recovered = openToken(invitation.token_sealed as string | null)
    if (!recovered) {
      // No sealed copy (the invitation predates this feature) or a different key.
      rotationReason = "not_recoverable"
    } else if (!tokenMatchesFingerprint(recovered, invitation.token as string, hashInvitationToken)) {
      // The two columns disagree. Mailing this link would send something the
      // accept endpoint rejects, so rotate rather than send a dead link.
      rotationReason = "fingerprint_mismatch"
    } else {
      raw = recovered
      rotated = false
    }
  }

  if (!raw) {
    const fresh = createInvitationToken()
    raw = fresh.raw
    tokenHash = fresh.hash
    sealed = sealToken(fresh.raw)
  }

  // ---- persist -----------------------------------------------------------

  const expiresAt = invitationExpiry()

  const { data: updated, error: updateError } = await db
    .from("pr_invitations")
    .update({
      email,
      role,
      can_download: canDownload,
      token: tokenHash,
      token_sealed: sealed,
      // The clock restarts: resending a nearly-expired invitation would be
      // pointless if it kept the old deadline.
      expires_at: expiresAt,
      // A resend un-revokes, which is exactly what "resend a revoked invitation"
      // has to mean.
      revoked_at: null,
      resent_at: new Date().toISOString(),
      resend_count: ((invitation.resend_count as number | null) ?? 0) + 1,
    })
    .eq("id", id)
    // Guards a race: if someone accepted while this ran, do not resurrect a
    // spent invitation. No rows back => that is what happened.
    .is("accepted_at", null)
    .select("id")

  if (updateError) {
    console.error("[v0] invitation resend update failed:", updateError.message)
    return NextResponse.json({ error: "Impossibile aggiornare l'invito." }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "L'invito è stato accettato in questo momento: aggiorna la pagina." },
      { status: 409 },
    )
  }

  // ---- deliver -----------------------------------------------------------

  const { data: project } = await db
    .from("pr_projects")
    .select("name")
    .eq("id", invitation.project_id as string)
    .maybeSingle()

  const url = invitationUrl(new URL(request.url).origin, raw)

  // `sent`, not `ok`: matches NotifyResult as the creation route uses it.
  let emailResult: { sent: boolean; error?: string } = { sent: false }
  try {
    emailResult = await sendInvitationEmail({
      to: email,
      url,
      projectName: (project?.name as string | undefined) ?? "Project Room",
      role,
      expiresAt,
      note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
    })
  } catch (error) {
    emailResult = { sent: false, error: error instanceof Error ? error.message : "invio non riuscito" }
  }

  await recordAudit({
    projectId: invitation.project_id as string,
    userId: admin.data.id,
    action: "invitation.resent",
    entityType: "invitation",
    entityId: id,
    metadata: {
      email,
      ...(emailChanged ? { previous_email: invitation.email } : {}),
      role,
      can_download: canDownload,
      link_rotated: rotated,
      ...(rotationReason ? { rotation_reason: rotationReason } : {}),
      email_sent: emailResult.sent,
    },
  })

  return NextResponse.json({
    ok: true,
    invitation: { id, email, role, can_download: canDownload, expires_at: expiresAt },
    // Always returned: the admin must be able to copy the link even when the
    // email fails, otherwise the invitation is stuck with no way to deliver it.
    url,
    link_rotated: rotated,
    rotation_reason: rotationReason,
    email_sent: emailResult.sent,
    email_error: emailResult.sent ? null : (emailResult.error ?? null),
  })
}
