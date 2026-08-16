import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { analyzeProject } from "@/lib/control-center/analyzer"
import { AUDIT_PROJECTS, getAuditProject } from "@/lib/control-center/projects"
import { saveAuditResult } from "@/lib/control-center/storage"

export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdminEmail(user.email)) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { project?: string }
  const projects = body.project ? [getAuditProject(body.project)].filter(Boolean) : AUDIT_PROJECTS
  if (!projects.length) return NextResponse.json({ error: "Progetto non riconosciuto" }, { status: 400 })

  const results = []
  for (const project of projects) {
    if (!project) continue
    try {
      const result = await analyzeProject(project)
      const runId = await saveAuditResult(result)
      results.push({ ok: true, runId, project: project.slug, status: result.status, score: result.scores.overall })
    } catch (error) {
      results.push({ ok: false, project: project.slug, error: error instanceof Error ? error.message : "Errore sconosciuto" })
    }
  }
  return NextResponse.json({ results }, { status: results.some((item) => item.ok) ? 200 : 500 })
}

