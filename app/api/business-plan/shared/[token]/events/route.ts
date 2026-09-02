import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

const ALLOWED_EVENTS = new Set([
  "presentation_started",
  "presentation_completed",
  "presentation_slide_viewed",
  "benchmark_viewed",
  "scenarios_viewed",
  "products_viewed",
  "corporate_report_opened",
])

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = getBusinessPlanShareSession(request, token)
  if (!session) return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const eventType = typeof body.eventType === "string" ? body.eventType : ""
  if (!ALLOWED_EVENTS.has(eventType)) return NextResponse.json({ error: "Evento non valido" }, { status: 400 })

  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {}
  const supabase = createAdminClient()
  const { data: share, error } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, expires_at")
    .eq("token", token)
    .eq("id", session.shareId)
    .single()

  if (error || !share) return NextResponse.json({ error: "Condivisione non valida" }, { status: 404 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) return NextResponse.json({ error: "Link scaduto" }, { status: 410 })

  const { error: insertError } = await supabase.from("business_plan_share_events").insert({
    share_id: share.id,
    business_plan_id: share.business_plan_id,
    event_type: eventType,
    recipient_email: session.visitorEmail,
    metadata: {
      ...metadata,
      visitor_name: session.visitorName,
      visitor_email: session.visitorEmail,
      visitor_company: session.visitorCompany || null,
      user_agent: request.headers.get("user-agent"),
    },
  })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
