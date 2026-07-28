/**
 * Profile page. Fixes the header's "Il mio profilo" entry, which previously
 * pointed at a route that did not exist.
 */

import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { requireUser, requireOrgAdmin } from "@/lib/project-room/auth"
import { getProfile, listProjectsForUser } from "@/lib/project-room/queries"
import { ProjectRoomShell } from "@/components/project-room/shell"
import { ROLE_LABELS } from "@/lib/project-room/types"
import ProfileClient from "./client"

export const metadata: Metadata = {
  title: "Il mio profilo - Area Riservata 4BID",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const guard = await requireUser()
  if (!guard.ok) {
    redirect("/area-riservata/login?redirect=/area-riservata/profilo")
  }

  const [profile, projects, adminGuard] = await Promise.all([
    getProfile(guard.data.id),
    listProjectsForUser(guard.data.id),
    requireOrgAdmin(),
  ])

  return (
    <ProjectRoomShell profile={profile} isAdmin={adminGuard.ok}>
      <ProfileClient
        email={profile?.email ?? guard.data.email ?? ""}
        firstName={profile?.first_name ?? ""}
        lastName={profile?.last_name ?? ""}
        company={profile?.company ?? ""}
        jobRole={profile?.job_role ?? ""}
        memberships={projects.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          roleLabel: ROLE_LABELS[p.role],
          canDownload: p.can_download,
        }))}
      />
    </ProjectRoomShell>
  )
}
