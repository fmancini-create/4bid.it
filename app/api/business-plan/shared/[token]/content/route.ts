import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = getBusinessPlanShareSession(request, token)
  if (!session) return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 })

  const supabase = createAdminClient()
  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, expires_at")
    .eq("token", token)
    .eq("id", session.shareId)
    .single()

  if (shareError || !share) return NextResponse.json({ error: "Condivisione non valida" }, { status: 404 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 })
  }

  const { data: plan, error: planError } = await supabase
    .from("business_plans")
    .select("*")
    .eq("id", share.business_plan_id)
    .single()

  if (planError || !plan) return NextResponse.json({ error: "Business plan non trovato" }, { status: 404 })

  return NextResponse.json(plan)
}
