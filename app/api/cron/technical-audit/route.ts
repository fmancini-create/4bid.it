import { NextResponse } from "next/server"
import { analyzeProject } from "@/lib/control-center/analyzer"
import { AUDIT_PROJECTS } from "@/lib/control-center/projects"
import { saveAuditResult } from "@/lib/control-center/storage"

export const maxDuration = 300

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }
  const results = []
  for (const project of AUDIT_PROJECTS) {
    try {
      const result = await analyzeProject(project)
      await saveAuditResult(result)
      results.push({ project: project.slug, ok: true, status: result.status, score: result.scores.overall })
    } catch (error) {
      results.push({ project: project.slug, ok: false, error: error instanceof Error ? error.message : "Errore sconosciuto" })
    }
  }
  return NextResponse.json({ completedAt: new Date().toISOString(), results })
}

