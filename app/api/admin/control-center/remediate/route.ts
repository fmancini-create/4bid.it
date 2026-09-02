import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { getAuditProject } from "@/lib/control-center/projects"
import { remediateFindings } from "@/lib/control-center/remediation"

export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdminEmail(user.email)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  if (!process.env.GITHUB_FIX_TOKEN) {
    return NextResponse.json({ error: "GITHUB_FIX_TOKEN non configurato" }, { status: 503 })
  }

  const body = (await request.json().catch(() => ({}))) as { findingId?: string; project?: string; allFixable?: boolean }
  const admin = createAdminClient()

  let projectSlug = body.project || ""
  let findings: Record<string, any>[] = []

  if (body.findingId) {
    const { data, error } = await admin.from("technical_audit_findings").select("*").eq("id", body.findingId).single()
    if (error || !data) return NextResponse.json({ error: "Problema non trovato" }, { status: 404 })
    findings = [data]
    projectSlug = data.project_slug
  } else if (body.allFixable && projectSlug) {
    const { data: run, error: runError } = await admin
      .from("technical_audit_runs")
      .select("id")
      .eq("project_slug", projectSlug)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single()
    if (runError || !run) return NextResponse.json({ error: "Nessuna analisi disponibile per il repository" }, { status: 404 })

    const { data, error } = await admin.from("technical_audit_findings").select("*").eq("run_id", run.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    findings = data || []
  } else {
    return NextResponse.json({ error: "Specificare findingId oppure project + allFixable" }, { status: 400 })
  }

  const project = getAuditProject(projectSlug)
  if (!project) return NextResponse.json({ error: "Repository non riconosciuto" }, { status: 400 })

  try {
    const result = await remediateFindings(project, findings as any)
    return NextResponse.json(result, { status: result.ok || result.requiresReview ? 200 : 409 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Intervento non riuscito" }, { status: 500 })
  }
}
