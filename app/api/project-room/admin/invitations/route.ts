/**
 * Create an invitation directly (organisation admins only).
 *
 * Until now an invitation could only come into existence as a side effect of
 * approving an access request, which meant 4Bid could not invite a client at
 * all: the client had to find the site and ask first. This route is the missing
 * half — the admin decides project, role and download permission up front.
 *
 * The raw token is returned exactly once and never stored (only its SHA-256
 * hash is), so the response is the only chance to capture the link. It is
 * returned even when the email fails, otherwise a mail outage would silently
 * strand an invitation nobody can deliver.
 */

import { NextResponse } from "next/server"

import { requireOrgAdmin, isUuid } from "@/lib/project-room/auth"
import { createAdminClient } from "@/lib/supabase/server"
import { recordAudit } from "@/lib/project-room/activity"
import {
  createInvitationToken,
  invitationExpiry,
  invitationRejection,
  invitationUrl,
  isInvitableRole,
} from "@/lib/project-room/invitations"
import { sendInvitationEmail } from "@/lib/project-room/notify"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_NOTE = 1000

export async function POST(request: Request) {
  const admin = await requireOrgAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase().slice(0, 254) : ""
  const projectId = typeof payload.project_id === "string" ? payload.project_id : ""
  const role = payload.role
  const canDownload = payload.can_download === true
  const note = typeof payload.note === "string" ? payload.note.trim().slice(0, MAX_NOTE) || null : null
  // Default true: the admin asked for delivery by email, so a missing flag must
  // not silently fall back to "generated but never sent".
  const shouldSend = payload.send_email !== false

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Inserisci un indirizzo email valido." }, { status: 400 })
  }
  if (!isUuid(projectId)) {
    return NextResponse.json({ error: "Seleziona un progetto." }, { status: 400 })
  }
  if (!isInvitableRole(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 })
  }

  const db = createAdminClient()

  // The project must belong to the caller's organisation. A project in another
  // organisation answers 404, exactly like one that does not exist, so this
  // route cannot be used to probe for project ids.
  const { data: project, error: projectError } = await db
    .from("pr_projects")
    .select("id, name, organization_id")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) {
    console.error("[v0] invite project lookup failed:", projectError.message)
    return NextResponse.json({ error: "Impossibile leggere il progetto." }, { status: 500 })
  }
  if (!project || project.organization_id !== admin.data.organizationId) {
    return NextResponse.json({ error: "Progetto non trovato." }, { status: 404 })
  }

  // Already a member? Sending an invitation would produce a link that dies on
  // arrival ("invito gia utilizzato"), so say so plainly instead.
  //
  // The check goes through `profiles`: `auth.users` is not readable through
  // PostgREST even with the service role, so account existence is never probed
  // directly.
  const { data: existingProfile } = await db.from("profiles").select("id").ilike("email", email).maybeSingle()

  if (existingProfile) {
    const { data: membership } = await db
      .from("pr_project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", existingProfile.id)
      .maybeSingle()

    if (membership) {
      return NextResponse.json(
        { error: "Questa persona ha gia accesso al progetto. Modifica il suo ruolo dalla scheda Accessi." },
        { status: 409 },
      )
    }
  }

  // An invitation is a bearer credential. If a still-valid one exists for the
  // same person and project, it is revoked here so only ONE live link can open
  // this project at a time — a lost link is replaced, not duplicated.
  const { data: previous } = await db
    .from("pr_invitations")
    .select("id, accepted_at, revoked_at, expires_at")
    .eq("project_id", projectId)
    .ilike("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null)

  const stillValid = (previous ?? []).filter((row) => invitationRejection(row) === null)
  if (stillValid.length > 0) {
    await db
      .from("pr_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .in(
        "id",
        stillValid.map((row) => row.id),
      )
      .is("accepted_at", null)
  }

  const { raw, hash } = createInvitationToken()
  const expiresAt = invitationExpiry()

  const { data: invitation, error: insertError } = await db
    .from("pr_invitations")
    .insert({
      project_id: projectId,
      email,
      role,
      can_download: canDownload,
      token: hash,
      invited_by: admin.data.id,
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single()

  if (insertError || !invitation) {
    console.error("[v0] direct invitation insert failed:", insertError?.message)
    return NextResponse.json({ error: "Impossibile creare l'invito." }, { status: 500 })
  }

  const url = invitationUrl(new URL(request.url).origin, raw)

  // Sent before the audit entry so the outcome can be recorded, but its failure
  // never invalidates the invitation: the link in the response still works.
  let emailResult: { sent: boolean; error?: string } = { sent: false }
  if (shouldSend) {
    emailResult = await sendInvitationEmail({
      to: email,
      url,
      projectName: project.name,
      role,
      expiresAt: invitation.expires_at,
      note,
      invitedByName: admin.data.email ?? null,
    })
  }

  await recordAudit({
    projectId,
    userId: admin.data.id,
    action: "member.invited",
    entityType: "invitation",
    entityId: invitation.id,
    // The raw token is deliberately absent. `email_sent` is recorded so a
    // client claiming "I never got it" can be answered from the trail.
    metadata: {
      email,
      role,
      can_download: canDownload,
      project: project.name,
      source: "direct_invite",
      replaced_previous: stillValid.length,
      email_sent: emailResult.sent,
    },
  })

  return NextResponse.json({
    invitation: {
      id: invitation.id,
      email,
      role,
      can_download: canDownload,
      expires_at: invitation.expires_at,
      project_name: project.name,
      // Shown once: never stored, never logged.
      url,
    },
    email: emailResult,
    replaced_previous: stillValid.length,
  })
}
