import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { analyzeProject } from "@/lib/control-center/analyzer"
import { AUDIT_PROJECTS, getAuditProject } from "@/lib/control-center/projects"
import { saveAuditResult } from "@/lib/control-center/storage"
import type { AuditProject } from "@/lib/control-center/types"

export const maxDuration = 300

async function analyzeOne(project: AuditProject) {
  try {
    const result = await analyzeProject(project)
    const runId = await saveAuditResult(result)
    return { ok: true as const, runId, project: project.slug, status: result.status, score: result.scores.overall }
  } catch (error) {
    return { ok: false as const, project: project.slug, error: error instanceof Error ? error.message : "Errore sconosciuto" }
  }
}

async function analyzeWithLimit(projects: AuditProject[], concurrency = 3) {
  const results: Awaited<ReturnType<typeof analyzeOne>>[] = []
  for (let index = 0; index < projects.length; index += concurrency) {
    const batch = projects.slice(index, index + concurrency)
    const batchResults = await Promise.all(batch.map(analyzeOne))
    results.push(...batchResults)
  }
  return results
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdminEmail(user.email)) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { project?: string }
  const projects = body.project
    ? [getAuditProject(body.project)].filter((project): project is AuditProject => Boolean(project))
    : AUDIT_PROJECTS

  if (!projects.length) return NextResponse.json({ error: "Progetto non riconosciuto" }, { status: 400 })

  const results = await analyzeWithLimit(projects, body.project ? 1 : 3)
  return NextResponse.json({ results }, { status: results.some((item) => item.ok) ? 200 : 500 })
}
