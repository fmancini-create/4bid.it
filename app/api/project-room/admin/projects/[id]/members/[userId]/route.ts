/**
 * Change or revoke one project membership.
 *
 * This route exists because `pr_project_members` grants no UPDATE at all to
 * `authenticated` (verified against `information_schema.column_privileges`).
 * Role and `can_download` are deliberately unreachable from the browser: RLS
 * alone does not distinguish columns, so a client that could update its own row
 * could promote itself to `admin` or grant itself downloads. Every change to a
 * membership therefore has to pass through here, with a server-side check.
 *
 * Without this route the access decided at approval time was permanent: a
 * client who left their company kept document access forever.
 */

import { NextResponse } from "next/server"

import { recordAudit } from "@/lib/project-room/activity"
import { isUuid, requireOrgAdmin } from "@/lib/project-room/auth"
import { createAdminClient } from "@/lib/supabase/server"
import { PROJECT_ROLES, type ProjectRole } from "@/lib/project-room/types"

interface RouteContext {
  params: Promise<{ id: string; userId: string }>
}

/**
 * Resolve the target membership, refusing anything outside the caller's own
 * organisation. Returns the same 404 for "no such project", "project in another
 * organisation" and "user is not a member", so this endpoint cannot be used to
 * probe which project or user ids exist.
 */
async function resolveTarget(projectId: string, userId: string, organizationId: string) {
  if (!isUuid(projectId) || !isUuid(userId)) {
    return { ok: false as const, status: 400, error: "Identificativo non valido." }
  }

  const db = createAdminClient()

  const { data: project, error: projectError } = await db
    .from("pr_projects")
    .select("id, name, organization_id")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) {
    console.log("[v0] member route project lookup failed:", projectError.message)
    return { ok: false as const, status: 500, error: "Impossibile verificare il progetto." }
  }
  if (!project || project.organization_id !== organizationId) {
    return { ok: false as const, status: 404, error: "Progetto non trovato." }
  }

  const { data: membership, error: membershipError } = await db
    .from("pr_project_members")
    .select("id, role, can_download")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle()

  if (membershipError) {
    console.log("[v0] member route membership lookup failed:", membershipError.message)
    return { ok: false as const, status: 500, error: "Impossibile verificare l'accesso." }
  }
  if (!membership) {
    return { ok: false as const, status: 404, error: "Accesso non trovato." }
  }

  return { ok: true as const, db, project, membership }
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireOrgAdmin()
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const { id: projectId, userId } = await context.params
  const target = await resolveTarget(projectId, userId, guard.data.organizationId)
  if (!target.ok) {
    return NextResponse.json({ error: target.error }, { status: target.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>
  const updates: { role?: ProjectRole; can_download?: boolean } = {}

  if (payload.role !== undefined) {
    if (typeof payload.role !== "string" || !PROJECT_ROLES.includes(payload.role as ProjectRole)) {
      return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 })
    }
    updates.role = payload.role as ProjectRole
  }

  if (payload.can_download !== undefined) {
    if (typeof payload.can_download !== "boolean") {
      return NextResponse.json({ error: "Permesso di download non valido." }, { status: 400 })
    }
    updates.can_download = payload.can_download
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nessuna modifica richiesta." }, { status: 400 })
  }

  const { error } = await target.db.from("pr_project_members").update(updates).eq("id", target.membership.id)

  if (error) {
    console.log("[v0] member update failed:", error.message)
    return NextResponse.json({ error: "Impossibile aggiornare l'accesso." }, { status: 500 })
  }

  // Record the previous values too: "who changed what, from what" is the part
  // that matters when reconstructing who could see a document on a given day.
  await recordAudit({
    projectId,
    userId: guard.data.id,
    action: "member.role_changed",
    entityType: "pr_project_members",
    entityId: target.membership.id,
    metadata: {
      target_user_id: userId,
      previous_role: target.membership.role,
      previous_can_download: target.membership.can_download,
      ...(updates.role !== undefined ? { new_role: updates.role } : {}),
      ...(updates.can_download !== undefined ? { new_can_download: updates.can_download } : {}),
    },
  })

  return NextResponse.json({
    ok: true,
    role: updates.role ?? (target.membership.role as ProjectRole),
    can_download: updates.can_download ?? Boolean(target.membership.can_download),
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await requireOrgAdmin()
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const { id: projectId, userId } = await context.params
  const target = await resolveTarget(projectId, userId, guard.data.organizationId)
  if (!target.ok) {
    return NextResponse.json({ error: target.error }, { status: target.status })
  }

  const { error } = await target.db.from("pr_project_members").delete().eq("id", target.membership.id)

  if (error) {
    console.log("[v0] member removal failed:", error.message)
    return NextResponse.json({ error: "Impossibile revocare l'accesso." }, { status: 500 })
  }

  // Written after the delete, and carrying the role it had: the membership row
  // no longer exists, so this entry is the only remaining record of it.
  await recordAudit({
    projectId,
    userId: guard.data.id,
    action: "member.removed",
    entityType: "pr_project_members",
    entityId: target.membership.id,
    metadata: {
      target_user_id: userId,
      previous_role: target.membership.role,
      previous_can_download: target.membership.can_download,
    },
  })

  return NextResponse.json({ ok: true })
}
