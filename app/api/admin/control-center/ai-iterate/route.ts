import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { getAuditProject } from "@/lib/control-center/projects"
import { continueAiRemediation } from "@/lib/control-center/ai-remediation"

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

  const body = (await request.json().catch(() => ({}))) as { project?: string; prNumber?: number }
  if (!body.project || !Number.isInteger(body.prNumber) || Number(body.prNumber) <= 0) {
    return NextResponse.json({ error: "Specificare project e prNumber" }, { status: 400 })
  }
  const project = getAuditProject(body.project)
  if (!project) return NextResponse.json({ error: "Repository non riconosciuto" }, { status: 400 })

  try {
    const result = await continueAiRemediation(project, Number(body.prNumber))
    return NextResponse.json(result, { status: result.ok || result.requiresReview ? 200 : 409 })
  } catch (error) {
    console.error("[control-center/ai-iterate]", {
      project: project.slug,
      repository: project.repository,
      prNumber: body.prNumber,
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: error instanceof Error ? error.message : "Iterazione AI non riuscita" }, { status: 500 })
  }
}
