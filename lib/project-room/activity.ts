/**
 * Audit trail and in-app notifications.
 *
 * Both are written exclusively with the service role: clients have no INSERT
 * privilege on `pr_audit_logs` or `pr_notifications`, so an audit entry can
 * never be forged or suppressed from the browser.
 *
 * Neither function throws. Losing a log line must not roll back the action
 * the user actually asked for, so failures are logged and swallowed.
 */

import { createAdminClient } from "@/lib/supabase/server"

export type AuditAction =
  | "project.viewed"
  | "document.viewed"
  | "version.uploaded"
  | "version.downloaded"
  | "version.status_changed"
  | "comment.created"
  | "comment.updated"
  | "comment.deleted"
  | "comment.status_changed"
  | "revision.created"
  | "revision.reviewed"
  | "member.invited"
  | "member.role_changed"
  | "member.removed"
  | "invitation.accepted"
  | "access_request.created"
  | "access_request.reviewed"
  | "project.created"
  | "project.updated"

export async function recordAudit(params: {
  projectId?: string | null
  userId?: string | null
  action: AuditAction
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from("pr_audit_logs").insert({
      project_id: params.projectId ?? null,
      user_id: params.userId ?? null,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    })
    if (error) console.log("[v0] recordAudit failed:", params.action, error.message)
  } catch (error) {
    console.log("[v0] recordAudit threw:", (error as Error).message)
  }
}

export async function notifyUsers(params: {
  userIds: string[]
  projectId?: string | null
  type: string
  title: string
  body?: string | null
  link?: string | null
  /** Never notify the person who triggered the event. */
  exceptUserId?: string | null
}): Promise<void> {
  const recipients = Array.from(new Set(params.userIds.filter((id) => id && id !== params.exceptUserId)))
  if (recipients.length === 0) return

  try {
    const admin = createAdminClient()
    const { error } = await admin.from("pr_notifications").insert(
      recipients.map((userId) => ({
        user_id: userId,
        project_id: params.projectId ?? null,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      })),
    )
    if (error) console.log("[v0] notifyUsers failed:", error.message)
  } catch (error) {
    console.log("[v0] notifyUsers threw:", (error as Error).message)
  }
}

/**
 * Everyone who should hear about activity on a project: explicit project
 * members plus the organization admins (who are implicit members).
 */
export async function projectAudience(projectId: string): Promise<string[]> {
  try {
    const admin = createAdminClient()

    const [{ data: members }, { data: project }] = await Promise.all([
      admin.from("pr_project_members").select("user_id").eq("project_id", projectId),
      admin.from("pr_projects").select("organization_id").eq("id", projectId).maybeSingle(),
    ])

    const ids = (members ?? []).map((m) => m.user_id as string)

    if (project?.organization_id) {
      const { data: admins } = await admin
        .from("pr_organization_members")
        .select("user_id")
        .eq("organization_id", project.organization_id)
        .eq("role", "admin")
      for (const a of admins ?? []) ids.push(a.user_id as string)
    }

    return Array.from(new Set(ids))
  } catch (error) {
    console.log("[v0] projectAudience threw:", (error as Error).message)
    return []
  }
}
