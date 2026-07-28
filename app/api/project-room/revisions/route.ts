import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireDocumentAccess } from "@/lib/project-room/auth"
import { canProposeRevision } from "@/lib/project-room/permissions"
import { notifyUsers, projectAudience, recordAudit } from "@/lib/project-room/activity"
import { displayName } from "@/lib/project-room/types"
import { getProfile } from "@/lib/project-room/queries"

const MAX_TEXT = 5000

/**
 * Propose a rewording of a passage.
 *
 * A proposal always starts as `da_valutare`: the client INSERT privilege does
 * not include `status`, so even a crafted request cannot self-approve.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 })
  }

  const documentId = typeof payload.document_id === "string" ? payload.document_id : ""
  const access = await requireDocumentAccess(documentId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (!canProposeRevision(access.data.role)) {
    return NextResponse.json({ error: "Il tuo ruolo non consente di proporre revisioni." }, { status: 403 })
  }

  const proposedText = typeof payload.proposed_text === "string" ? payload.proposed_text.trim() : ""
  if (proposedText.length === 0) {
    return NextResponse.json({ error: "Il testo proposto non puo essere vuoto." }, { status: 400 })
  }
  if (proposedText.length > MAX_TEXT) {
    return NextResponse.json({ error: "Il testo proposto supera la lunghezza massima." }, { status: 400 })
  }

  const originalText =
    typeof payload.original_text === "string" && payload.original_text.trim()
      ? payload.original_text.trim().slice(0, MAX_TEXT)
      : null

  const pageNumber =
    typeof payload.page_number === "number" && Number.isFinite(payload.page_number) && payload.page_number > 0
      ? Math.floor(payload.page_number)
      : null

  const admin = createAdminClient()

  const { data: inserted, error } = await admin
    .from("pr_revision_proposals")
    .insert({
      project_id: access.data.projectId,
      document_id: access.data.documentId,
      page_number: pageNumber,
      original_text: originalText,
      proposed_text: proposedText,
      created_by: access.data.user.id,
    })
    .select("id")
    .single()

  if (error || !inserted) {
    console.log("[v0] revision insert failed:", error?.message)
    return NextResponse.json({ error: "Impossibile salvare la proposta." }, { status: 500 })
  }

  await recordAudit({
    projectId: access.data.projectId,
    userId: access.data.user.id,
    action: "revision.created",
    entityType: "revision",
    entityId: inserted.id as string,
    metadata: { page_number: pageNumber },
  })

  const [audience, profile] = await Promise.all([
    projectAudience(access.data.projectId),
    getProfile(access.data.user.id),
  ])

  await notifyUsers({
    userIds: audience,
    projectId: access.data.projectId,
    type: "revision.created",
    title: `Nuova proposta di revisione da ${displayName(profile)}`,
    body: proposedText.slice(0, 200),
    link: `/area-riservata/documenti/${access.data.documentId}?tab=revisioni`,
    exceptUserId: access.data.user.id,
  })

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 })
}
