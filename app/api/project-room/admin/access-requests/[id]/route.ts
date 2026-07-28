/**
 * Review an access request (organisation admins only).
 *
 * Approving does NOT create a user and does NOT send email. It mints a
 * single-use invitation and returns the link once, for the admin to forward
 * manually. Nothing is emailed from here, so an accidental click cannot reach
 * a client.
 */

import { NextResponse } from "next/server"

import { requireOrgAdmin, isUuid } from "@/lib/project-room/auth"
import { createAdminClient } from "@/lib/supabase/server"
import { recordAudit } from "@/lib/project-room/activity"
import {
  createInvitationToken,
  invitationExpiry,
  invitationUrl,
  isInvitableRole,
} from "@/lib/project-room/invitations"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  // Authenticate before any database read: a 404-vs-403 difference on an
  // unauthenticated request would leak which request ids exist.
  const admin = await requireOrgAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Identificativo richiesta non valido." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>
  const action = payload.action
  const reviewNote = typeof payload.review_note === "string" ? payload.review_note.trim().slice(0, 2000) : null

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Azione non riconosciuta." }, { status: 400 })
  }

  const db = createAdminClient()

  const { data: accessRequest, error: fetchError } = await db
    .from("pr_access_requests")
    .select("id, email, first_name, last_name, status")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("[v0] access request lookup failed:", fetchError.message)
    return NextResponse.json({ error: "Impossibile leggere la richiesta." }, { status: 500 })
  }
  if (!accessRequest) {
    return NextResponse.json({ error: "Richiesta non trovata." }, { status: 404 })
  }
  if (accessRequest.status !== "pending") {
    // Prevents two admins approving the same request twice (double invitation).
    return NextResponse.json(
      { error: "Questa richiesta e gia stata gestita." },
      { status: 409 },
    )
  }

  if (action === "reject") {
    const { error } = await db
      .from("pr_access_requests")
      .update({
        status: "rejected",
        review_note: reviewNote,
        reviewed_by: admin.data.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")

    if (error) {
      console.error("[v0] access request reject failed:", error.message)
      return NextResponse.json({ error: "Impossibile aggiornare la richiesta." }, { status: 500 })
    }

    await recordAudit({
      userId: admin.data.id,
      action: "access_request.reviewed",
      entityType: "access_request",
      entityId: id,
      metadata: { outcome: "rejected" },
    })

    return NextResponse.json({ status: "rejected" })
  }

  // ---- approve ----
  const projectId = typeof payload.project_id === "string" ? payload.project_id : ""
  const role = payload.role
  const canDownload = payload.can_download === true

  if (!isUuid(projectId)) {
    return NextResponse.json({ error: "Seleziona un progetto valido." }, { status: 400 })
  }
  if (!isInvitableRole(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 })
  }

  // The project must belong to the admin's own organisation, otherwise an admin
  // of org A could invite someone into a project of org B.
  const { data: project, error: projectError } = await db
    .from("pr_projects")
    .select("id, name, organization_id")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) {
    console.error("[v0] project lookup failed:", projectError.message)
    return NextResponse.json({ error: "Impossibile leggere il progetto." }, { status: 500 })
  }
  if (!project || project.organization_id !== admin.data.organizationId) {
    return NextResponse.json({ error: "Progetto non trovato." }, { status: 404 })
  }

  const { raw, hash } = createInvitationToken()

  const { data: invitation, error: inviteError } = await db
    .from("pr_invitations")
    .insert({
      project_id: projectId,
      email: accessRequest.email,
      role,
      can_download: canDownload,
      token: hash,
      invited_by: admin.data.id,
      expires_at: invitationExpiry(),
    })
    .select("id, expires_at")
    .single()

  if (inviteError || !invitation) {
    console.error("[v0] invitation insert failed:", inviteError?.message)
    return NextResponse.json({ error: "Impossibile creare l'invito." }, { status: 500 })
  }

  const { error: updateError } = await db
    .from("pr_access_requests")
    .update({
      status: "approved",
      review_note: reviewNote,
      reviewed_by: admin.data.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")

  if (updateError) {
    // Roll back the invitation so we never leave a live token attached to a
    // request that still looks pending.
    await db.from("pr_invitations").delete().eq("id", invitation.id)
    console.error("[v0] access request approve failed:", updateError.message)
    return NextResponse.json({ error: "Impossibile aggiornare la richiesta." }, { status: 500 })
  }

  await recordAudit({
    projectId,
    userId: admin.data.id,
    action: "member.invited",
    entityType: "invitation",
    entityId: invitation.id,
    // The raw token is deliberately absent from the audit metadata.
    metadata: { email: accessRequest.email, role, can_download: canDownload, project: project.name },
  })

  return NextResponse.json({
    status: "approved",
    invitation: {
      id: invitation.id,
      expires_at: invitation.expires_at,
      // Shown once. We never store or log this value.
      url: invitationUrl(new URL(request.url).origin, raw),
    },
  })
}
