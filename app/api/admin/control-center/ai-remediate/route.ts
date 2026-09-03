import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { getAuditProject } from "@/lib/control-center/projects"
import { startAiRemediation, type AiFindingRow } from "@/lib/control-center/ai-remediation"

export const maxDuration = 300

export async function POST(request: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isSuperAdminEmail(user.email)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }
  if (!process.env.GITHUB_FIX_TOKEN) {
    return NextResponse.json({ error: "GITHUB_FIX_TOKEN non configurato" }, { status: 503 })
  }

  const body = (await request.json().catch(() => ({}))) as { findingId?: string }
  if (!body.findingId) return NextResponse.json({ error: "findingId mancante" }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("technical_audit_findings")
    .select("*")
    .eq("id", body.findingId)
    .single()
  if (error || !data) return NextResponse.json({ error: "Problema non trovato" }, { status: 404 })

  const finding = data as AiFindingRow
  const project = getAuditProject(finding.project_slug)
  if (!project) return NextResponse.json({ error: "Repository non riconosciuto" }, { status: 400 })

  try {
    const result = await startAiRemediation(project, finding)
    return NextResponse.json(result, { status: result.ok || result.requiresReview ? 200 : 409 })
  } catch (error) {
    console.error("[control-center/ai-remediate]", {
      project: project.slug,
      repository: project.repository,
      findingId: finding.id,
      code: finding.code,
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: error instanceof Error ? error.message : "Remediation AI non riuscita" }, { status: 500 })
  }
}
