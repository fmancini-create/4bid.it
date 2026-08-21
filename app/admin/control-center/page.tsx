import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { AUDIT_PROJECTS } from "@/lib/control-center/projects"
import ControlCenterDashboard from "./control-center-dashboard"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Control Center | Admin 4 BID", description: "Salute tecnica dei prodotti 4 BID" }

export default async function ControlCenterPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect("/admin/login")
  if (!isSuperAdminEmail(user.email)) redirect("/admin")

  let runs: Record<string, unknown>[] = []
  let findings: Record<string, unknown>[] = []
  let storageReady = true
  try {
    const admin = createAdminClient()
    const [runsResult, findingsResult] = await Promise.all([
      admin.from("technical_audit_runs").select("*").order("completed_at", { ascending: false }).limit(100),
      admin.from("technical_audit_findings").select("*").order("created_at", { ascending: false }).limit(500),
    ])
    if (runsResult.error || findingsResult.error) storageReady = false
    runs = runsResult.data || []
    findings = findingsResult.data || []
  } catch {
    storageReady = false
  }

  const latestRuns = AUDIT_PROJECTS.map((project) => ({
    project,
    run: runs.find((run) => run.project_slug === project.slug) || null,
  }))

  return (
    <ControlCenterDashboard
      userEmail={user.email || ""}
      latestRuns={latestRuns}
      findings={findings}
      history={runs}
      storageReady={storageReady}
      githubReady={Boolean(process.env.GITHUB_AUDIT_TOKEN)}
    />
  )
}

