/**
 * Organisation admin console: access requests, invitations, audit trail.
 *
 * Everything is read with the service role *after* `requireOrgAdmin()` has
 * confirmed the caller, and every query is scoped to that admin's own
 * organisation.
 */

import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { requireOrgAdmin } from "@/lib/project-room/auth"
import { createAdminClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/project-room/queries"
import { ProjectRoomShell } from "@/components/project-room/shell"
import AdminClient from "./client"

export const metadata: Metadata = {
  title: "Amministrazione | Area riservata 4Bid",
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = "force-dynamic"

/**
 * Audit entries shown per load. The exact total is queried alongside so the UI
 * can state how many entries exist rather than silently truncating the trail.
 */
const AUDIT_PAGE_SIZE = 60

export default async function AdminPage() {
  const admin = await requireOrgAdmin()
  if (!admin.ok) {
    // 401 means "not signed in", anything else means "signed in but not an
    // admin" — the latter must not bounce to the login form in a loop.
    redirect(admin.status === 401 ? "/area-riservata/login?redirect=/area-riservata/admin" : "/area-riservata/progetti")
  }

  const db = createAdminClient()
  const organizationId = admin.data.organizationId

  const [requestsResult, projectsResult, invitationsResult, auditResult] = await Promise.all([
    db
      .from("pr_access_requests")
      .select("id, first_name, last_name, email, company, phone, job_role, message, status, review_note, reviewed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("pr_projects")
      .select("id, name, status")
      .eq("organization_id", organizationId)
      .order("name"),
    db
      .from("pr_invitations")
      .select("id, email, role, can_download, expires_at, accepted_at, revoked_at, created_at, project_id")
      .order("created_at", { ascending: false })
      .limit(50),
    // `ip_address` and `user_agent` are deliberately NOT selected: they are
    // recorded for forensics but must never reach the browser.
    db
      .from("pr_audit_logs")
      .select("id, action, entity_type, metadata, created_at, user_id", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(AUDIT_PAGE_SIZE),
  ])

  const projects = projectsResult.data ?? []
  const projectNames = new Map(projects.map((p) => [p.id, p.name]))

  // Invitations are fetched without an organisation column (the table has none),
  // so they are filtered down to this organisation's projects in memory.
  const invitations = (invitationsResult.data ?? [])
    .filter((row) => projectNames.has(row.project_id))
    .map((row) => ({ ...row, project_name: projectNames.get(row.project_id) ?? "—" }))

  // Resolve the actor of each audit entry: a log that only shows a UUID cannot
  // answer "who did this", which is the whole point of keeping it.
  const auditRows = auditResult.data ?? []
  const actorIds = [...new Set(auditRows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))]

  const actorNames = new Map<string, string>()
  if (actorIds.length > 0) {
    const { data: actors } = await db.from("profiles").select("id, first_name, last_name, email").in("id", actorIds)
    for (const actor of actors ?? []) {
      const name = [actor.first_name, actor.last_name].filter(Boolean).join(" ").trim()
      actorNames.set(actor.id, name || actor.email || "Utente rimosso")
    }
  }

  const auditEntries = auditRows.map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>
    // `user_id` is ON DELETE SET NULL, so fall back to the email denormalised
    // into the metadata at write time before giving up on the attribution.
    const denormalised = typeof metadata.actor_email === "string" ? metadata.actor_email : null
    const actor = (row.user_id ? actorNames.get(row.user_id) : null) ?? denormalised

    return {
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      metadata: row.metadata,
      created_at: row.created_at,
      actor: actor ?? "Account rimosso",
    }
  })

  const profile = await getProfile(admin.data.id)

  return (
    <ProjectRoomShell profile={profile} isAdmin>
      <AdminClient
        requests={requestsResult.data ?? []}
        projects={projects}
        invitations={invitations}
        auditEntries={auditEntries}
        auditTotal={auditResult.count ?? auditEntries.length}
        auditPageSize={AUDIT_PAGE_SIZE}
      />
    </ProjectRoomShell>
  )
}
