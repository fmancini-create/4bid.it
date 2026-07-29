import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isUuid, requireDocumentAccess } from "@/lib/project-room/auth"
import { canDeleteComment, canEditComment, canModerateComments } from "@/lib/project-room/permissions"
import { recordAudit } from "@/lib/project-room/activity"
import { COMMENT_STATUSES, type CommentStatus } from "@/lib/project-room/types"

const MAX_CONTENT = 5000

/**
 * Edit the body, change the status, or soft-delete a comment.
 *
 * Each of the three is a distinct permission, checked separately: an author may
 * fix their own wording but not mark it approved, while a reviewer may change
 * the status of anyone's comment but not rewrite its text.
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

  const admin = createAdminClient()
  const { data: comment, error: loadError } = await admin
    .from("pr_comments")
    .select("id, document_id, project_id, author_id, created_at, deleted_at")
    .eq("id", id)
    .maybeSingle()

  if (loadError) {
    console.log("[v0] comment load failed:", loadError.message)
    return NextResponse.json({ error: "Impossibile leggere il commento." }, { status: 500 })
  }
  if (!comment) {
    return NextResponse.json({ error: "Commento non trovato." }, { status: 404 })
  }

  const access = await requireDocumentAccess(comment.document_id as string)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (comment.deleted_at) {
    return NextResponse.json({ error: "Il commento e stato eliminato." }, { status: 409 })
  }

  const viewerId = access.data.user.id
  const role = access.data.role

  // ---- soft delete ----
  if (payload.action === "delete") {
    if (!canDeleteComment({ role, authorId: comment.author_id as string, viewerId })) {
      return NextResponse.json({ error: "Non puoi eliminare questo commento." }, { status: 403 })
    }
    const { error } = await admin.from("pr_comments").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (error) {
      console.log("[v0] comment delete failed:", error.message)
      return NextResponse.json({ error: "Impossibile eliminare il commento." }, { status: 500 })
    }
    await recordAudit({
      projectId: access.data.projectId,
      userId: viewerId,
      action: "comment.deleted",
      entityType: "comment",
      entityId: id,
    })
    return NextResponse.json({ ok: true })
  }

  const updates: Record<string, unknown> = {}

  // ---- status change ----
  if (typeof payload.status === "string") {
    if (!COMMENT_STATUSES.includes(payload.status as CommentStatus)) {
      return NextResponse.json({ error: "Stato non valido." }, { status: 400 })
    }
    if (!canModerateComments(role)) {
      return NextResponse.json({ error: "Il tuo ruolo non consente di cambiare lo stato." }, { status: 403 })
    }
    const status = payload.status as CommentStatus
    updates.status = status
    const closing = status === "risolto" || status === "approvato" || status === "respinto"
    updates.resolved_by = closing ? viewerId : null
    updates.resolved_at = closing ? new Date().toISOString() : null
  }

  // ---- body edit ----
  if (typeof payload.content === "string") {
    const content = payload.content.trim()
    if (content.length === 0) {
      return NextResponse.json({ error: "Il commento non può essere vuoto." }, { status: 400 })
    }
    if (content.length > MAX_CONTENT) {
      return NextResponse.json({ error: "Il commento supera la lunghezza massima." }, { status: 400 })
    }

    // Replies are what make an edit unfair, so this is counted, not assumed.
    const { count } = await admin
      .from("pr_comments")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id)
      .is("deleted_at", null)

    const allowed = canEditComment({
      role,
      authorId: comment.author_id as string,
      viewerId,
      createdAt: comment.created_at as string,
      hasReplies: (count ?? 0) > 0,
    })

    if (!allowed) {
      return NextResponse.json(
        { error: "Il commento non è più modificabile: ha ricevuto risposte o è passato troppo tempo." },
        { status: 403 },
      )
    }
    updates.content = content
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nessuna modifica richiesta." }, { status: 400 })
  }

  const { error } = await admin.from("pr_comments").update(updates).eq("id", id)
  if (error) {
    console.log("[v0] comment update failed:", error.message)
    return NextResponse.json({ error: "Impossibile aggiornare il commento." }, { status: 500 })
  }

  await recordAudit({
    projectId: access.data.projectId,
    userId: viewerId,
    action: updates.status ? "comment.status_changed" : "comment.updated",
    entityType: "comment",
    entityId: id,
    metadata: updates.status ? { status: updates.status } : {},
  })

  return NextResponse.json({ ok: true })
}
