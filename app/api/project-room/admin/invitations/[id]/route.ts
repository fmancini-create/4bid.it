/**
 * Revoke a pending invitation (organisation admins only).
 *
 * Revoking is a soft state change: the row is kept so the audit trail still
 * shows that an invitation existed and who cancelled it.
 */

import { NextResponse } from "next/server"

import { requireOrgAdmin, isUuid } from "@/lib/project-room/auth"
import { createAdminClient } from "@/lib/supabase/server"
import { recordAudit } from "@/lib/project-room/activity"

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireOrgAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Identificativo invito non valido." }, { status: 400 })
  }

  const db = createAdminClient()

  const { data: invitation, error: fetchError } = await db
    .from("pr_invitations")
    .select("id, project_id, email, accepted_at, revoked_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("[v0] invitation lookup failed:", fetchError.message)
    return NextResponse.json({ error: "Impossibile leggere l'invito." }, { status: 500 })
  }
  if (!invitation) {
    return NextResponse.json({ error: "Invito non trovato." }, { status: 404 })
  }

  // Scope the invitation to the admin's own organisation via its project.
  const { data: project } = await db
    .from("pr_projects")
    .select("id, organization_id")
    .eq("id", invitation.project_id)
    .maybeSingle()

  if (!project || project.organization_id !== admin.data.organizationId) {
    // Same 404 as a missing row: an admin of another org learns nothing.
    return NextResponse.json({ error: "Invito non trovato." }, { status: 404 })
  }

  if (invitation.accepted_at) {
    return NextResponse.json(
      { error: "L'invito è già stato accettato. Rimuovi il membro dal progetto per revocargli l'accesso." },
      { status: 409 },
    )
  }
  if (invitation.revoked_at) {
    return NextResponse.json({ error: "Invito già revocato." }, { status: 409 })
  }

  const { error: updateError } = await db
    .from("pr_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("accepted_at", null)

  if (updateError) {
    console.error("[v0] invitation revoke failed:", updateError.message)
    return NextResponse.json({ error: "Impossibile revocare l'invito." }, { status: 500 })
  }

  await recordAudit({
    projectId: invitation.project_id,
    userId: admin.data.id,
    action: "member.removed",
    entityType: "invitation",
    entityId: id,
    metadata: { email: invitation.email, outcome: "invitation_revoked" },
  })

  return NextResponse.json({ ok: true })
}
