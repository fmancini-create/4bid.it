import { createAdminClient } from "@/lib/supabase/server"
import type { AuditResult } from "./types"

export async function saveAuditResult(result: AuditResult) {
  const supabase = createAdminClient()
  const { data: run, error } = await supabase
    .from("technical_audit_runs")
    .insert({
      project_slug: result.project.slug,
      project_name: result.project.name,
      repository: result.project.repository,
      branch: result.project.branch,
      commit_sha: result.commitSha,
      commit_url: result.commitUrl,
      commit_message: result.commitMessage,
      status: result.status,
      score_overall: result.scores.overall,
      scores: result.scores,
      metrics: result.metrics,
      engine_version: result.engineVersion,
      started_at: result.startedAt,
      completed_at: result.completedAt,
      duration_ms: result.durationMs,
    })
    .select("id")
    .single()
  if (error || !run) throw new Error(`Salvataggio audit fallito: ${error?.message || "ID mancante"}`)
  if (result.findings.length) {
    const { error: findingsError } = await supabase.from("technical_audit_findings").insert(
      result.findings.map((item) => ({
        run_id: run.id,
        project_slug: result.project.slug,
        code: item.code,
        category: item.category,
        severity: item.severity,
        title: item.title,
        description: item.description,
        evidence: item.evidence || null,
        remediation: item.remediation,
        file_path: item.filePath || null,
        change_type: item.changeType,
      })),
    )
    if (findingsError) throw new Error(`Salvataggio finding fallito: ${findingsError.message}`)
  }
  return run.id as string
}
