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
    db
      .from("pr_audit_logs")
      .select("id, action, entity_type, metadata, created_at, user_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(60),
  ])

  const projects = projectsResult.data ?? []
  const projectNames = new Map(projects.map((p) => [p.id, p.name]))

  // Invitations are fetched without an organisation column (the table has none),
  // so they are filtered down to this organisation's projects in memory.
  const invitations = (invitationsResult.data ?? [])
    .filter((row) => projectNames.has(row.project_id))
    .map((row) => ({ ...row, project_name: projectNames.get(row.project_id) ?? "—" }))

  const profile = await getProfile(admin.data.user.id)

  return (
    <ProjectRoomShell profile={profile} isAdmin>
      <AdminClient
        requests={requestsResult.data ?? []}
        projects={projects}
        invitations={invitations}
        auditEntries={auditResult.data ?? []}
      />
    </ProjectRoomShell>
  )
}
