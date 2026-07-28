import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isUuid, requireDocumentAccess } from "@/lib/project-room/auth"
import { canReviewRevision } from "@/lib/project-room/permissions"
import { notifyUsers, recordAudit } from "@/lib/project-room/activity"
import { REVISION_STATUS_LABELS, REVISION_STATUSES, type RevisionStatus } from "@/lib/project-room/types"

/**
 * Review a revision proposal: approve, reject, or mark it incorporated.
 *
 * Reviewing your own proposal is refused. Not because the database cannot
 * express it, but because an approval by its own author carries no information
 * about whether 4Bid accepted the change.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Identificativo non valido." }, { status: 400 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 })
  }

  const status = typeof payload.status === "string" ? payload.status : ""
  if (!REVISION_STATUSES.includes(status as RevisionStatus) || status === "da_valutare") {
    return NextResponse.json({ error: "Stato non valido." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: revision, error: loadError } = await admin
    .from("pr_revision_proposals")
    .select("id, document_id, project_id, created_by, status")
    .eq("id", id)
    .maybeSingle()

  if (loadError) {
    console.log("[v0] revision load failed:", loadError.message)
    return NextResponse.json({ error: "Impossibile leggere la proposta." }, { status: 500 })
  }
  if (!revision) {
    return NextResponse.json({ error: "Proposta non trovata." }, { status: 404 })
  }

  const access = await requireDocumentAccess(revision.document_id as string)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (!canReviewRevision(access.data.role)) {
    return NextResponse.json({ error: "Il tuo ruolo non consente di valutare le proposte." }, { status: 403 })
  }

  if (revision.created_by === access.data.user.id) {
    return NextResponse.json({ error: "Non puoi valutare una tua proposta." }, { status: 403 })
  }

  const reviewNote =
    typeof payload.review_note === "string" && payload.review_note.trim()
      ? payload.review_note.trim().slice(0, 2000)
      : null

  const { error } = await admin
    .from("pr_revision_proposals")
    .update({
      status,
      review_note: reviewNote,
      reviewed_by: access.data.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.log("[v0] revision review failed:", error.message)
    return NextResponse.json({ error: "Impossibile aggiornare la proposta." }, { status: 500 })
  }

  await recordAudit({
    projectId: access.data.projectId,
    userId: access.data.user.id,
    action: "revision.reviewed",
    entityType: "revision",
    entityId: id,
    metadata: { status },
  })

  // Only the author is notified: this is feedback on their proposal.
  await notifyUsers({
    userIds: [revision.created_by as string],
    projectId: access.data.projectId,
    type: "revision.reviewed",
    title: `La tua proposta e stata valutata: ${REVISION_STATUS_LABELS[status as RevisionStatus]}`,
    body: reviewNote,
    link: `/area-riservata/documenti/${access.data.documentId}?tab=revisioni`,
    exceptUserId: access.data.user.id,
  })

  return NextResponse.json({ ok: true })
}
