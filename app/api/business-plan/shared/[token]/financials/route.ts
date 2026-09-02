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

  if (shareError || !share) return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 })
  }

  const { data, error } = await supabase
    .from("business_plan_financials")
    .select("*")
    .eq("business_plan_id", share.business_plan_id)
    .order("year", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mappedData = data?.map((d) => ({
    ...d,
    year_number: d.year,
    rent_cost: (d.rent_cost_monthly || 0) * 12,
    utilities_cost: (d.utilities_cost_monthly || 0) * 12,
    maintenance_cost: (d.maintenance_cost_monthly || 0) * 12,
    insurance_cost: (d.insurance_cost_monthly || 0) * 12,
    marketing_cost: (d.marketing_cost_monthly || 0) * 12,
    admin_cost: (d.admin_cost_monthly || 0) * 12,
    other_fixed_cost: (d.other_fixed_monthly || 0) * 12,
  })) || []

  return NextResponse.json(mappedData)
}
