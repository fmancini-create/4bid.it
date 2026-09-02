import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = getBusinessPlanShareSession(request, token)
  if (!session) return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 })

  const supabase = createAdminClient()
  const { data: share, error } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, can_download, expires_at")
    .eq("token", token)
    .eq("id", session.shareId)
    .single()

  if (error || !share) return NextResponse.json({ error: "Condivisione non valida" }, { status: 404 })
  if (!share.can_download) return NextResponse.json({ error: "Download non consentito" }, { status: 403 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) return NextResponse.json({ error: "Link scaduto" }, { status: 410 })

  await supabase.from("business_plan_share_events").insert({
    share_id: share.id,
    business_plan_id: share.business_plan_id,
    event_type: "downloaded",
    recipient_email: session.visitorEmail,
    metadata: {
      visitor_name: session.visitorName,
      visitor_company: session.visitorCompany || null,
      user_agent: request.headers.get("user-agent"),
    },
  })

  return NextResponse.redirect(new URL(`/api/business-plan/${share.business_plan_id}/pdf`, request.url))
}
