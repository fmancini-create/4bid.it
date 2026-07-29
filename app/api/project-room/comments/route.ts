import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireDocumentAccess } from "@/lib/project-room/auth"
import { canComment } from "@/lib/project-room/permissions"
import { notifyUsers, projectAudience, recordAudit } from "@/lib/project-room/activity"
import { COMMENT_TYPES, type CommentType } from "@/lib/project-room/types"
import { displayName } from "@/lib/project-room/types"
import { getProfile } from "@/lib/project-room/queries"

const MAX_CONTENT = 5000

/**
 * Create a comment (or a reply).
 *
 * The project is derived from the document server-side; a `project_id` sent by
 * the client is ignored, so a comment can never be attached to a project the
 * caller cannot reach.
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

  if (!canComment(access.data.role)) {
    return NextResponse.json({ error: "Il tuo ruolo non consente di commentare." }, { status: 403 })
  }

  const content = typeof payload.content === "string" ? payload.content.trim() : ""
  if (content.length === 0) {
    return NextResponse.json({ error: "Il commento non può essere vuoto." }, { status: 400 })
  }
  if (content.length > MAX_CONTENT) {
    return NextResponse.json({ error: "Il commento supera la lunghezza massima." }, { status: 400 })
  }

  const commentType: CommentType = COMMENT_TYPES.includes(payload.comment_type as CommentType)
    ? (payload.comment_type as CommentType)
    : "commento"

  const admin = createAdminClient()

  // A reply must belong to the same document, otherwise threads could be
  // grafted across documents (and across permission boundaries).
  let parentId: string | null = null
  if (typeof payload.parent_id === "string" && payload.parent_id) {
    const { data: parent } = await admin
      .from("pr_comments")
      .select("id, document_id")
      .eq("id", payload.parent_id)
      .maybeSingle()
    if (!parent || parent.document_id !== access.data.documentId) {
      return NextResponse.json({ error: "Commento padre non valido." }, { status: 400 })
    }
    parentId = parent.id as string
  }

  // The version must belong to this document for the same reason.
  let versionId: string | null = null
  if (typeof payload.version_id === "string" && payload.version_id) {
    const { data: version } = await admin
      .from("pr_document_versions")
      .select("id, document_id")
      .eq("id", payload.version_id)
      .maybeSingle()
    if (!version || version.document_id !== access.data.documentId) {
      return NextResponse.json({ error: "Versione non valida." }, { status: 400 })
    }
    versionId = version.id as string
  }

  const pageNumber =
    typeof payload.page_number === "number" && Number.isFinite(payload.page_number) && payload.page_number > 0
      ? Math.floor(payload.page_number)
      : null

  const { data: inserted, error } = await admin
    .from("pr_comments")
    .insert({
      project_id: access.data.projectId,
      document_id: access.data.documentId,
      version_id: versionId,
      page_number: pageNumber,
      comment_type: commentType,
      content,
      author_id: access.data.user.id,
      parent_id: parentId,
    })
    .select("id")
    .single()

  if (error || !inserted) {
    console.log("[v0] comment insert failed:", error?.message)
    return NextResponse.json({ error: "Impossibile salvare il commento." }, { status: 500 })
  }

  await recordAudit({
    projectId: access.data.projectId,
    userId: access.data.user.id,
    action: "comment.created",
    entityType: "comment",
    entityId: inserted.id as string,
    metadata: { comment_type: commentType, page_number: pageNumber },
  })

  const [audience, profile] = await Promise.all([
    projectAudience(access.data.projectId),
    getProfile(access.data.user.id),
  ])

  await notifyUsers({
    userIds: audience,
    projectId: access.data.projectId,
    type: "comment.created",
    title: `Nuovo commento di ${displayName(profile)}`,
    body: content.slice(0, 200),
    link: `/area-riservata/documenti/${access.data.documentId}`,
    exceptUserId: access.data.user.id,
  })

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 })
}
