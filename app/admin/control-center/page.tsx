import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { AUDIT_PROJECTS } from "@/lib/control-center/projects"
import ControlCenterDashboard from "./control-center-dashboard"
import ControlCenterAiPanel from "./control-center-ai-panel"

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
  const latestRunIds = new Set(
    latestRuns
      .map((item) => item.run?.id)
      .filter((value): value is string => typeof value === "string"),
  )
  const aiFindings = findings
    .filter((finding) => typeof finding.run_id === "string" && latestRunIds.has(finding.run_id))
    .map((finding) => ({
      id: String(finding.id || ""),
      project_slug: String(finding.project_slug || ""),
      code: String(finding.code || ""),
      title: String(finding.title || ""),
      description: typeof finding.description === "string" ? finding.description : null,
      severity: typeof finding.severity === "string" ? finding.severity : null,
      change_type: typeof finding.change_type === "string" ? finding.change_type : null,
    }))
    .filter((finding) => finding.id && finding.project_slug && finding.code)

  const githubFixReady = Boolean(process.env.GITHUB_FIX_TOKEN)
  const aiReady = Boolean(process.env.VERCEL || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)

  return (
    <>
      <div className="bg-muted/30 pt-6">
        <div className="max-w-7xl mx-auto px-4">
          <ControlCenterAiPanel
            projects={AUDIT_PROJECTS}
            findings={aiFindings}
            githubFixReady={githubFixReady}
            aiReady={aiReady}
          />
        </div>
      </div>
      <ControlCenterDashboard
        userEmail={user.email || ""}
        latestRuns={latestRuns}
        findings={findings}
        history={runs}
        storageReady={storageReady}
        githubReady={Boolean(process.env.GITHUB_AUDIT_TOKEN)}
        githubFixReady={githubFixReady}
      />
    </>
  )
}
