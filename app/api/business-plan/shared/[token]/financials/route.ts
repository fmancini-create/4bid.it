import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  console.log("[v0] Shared financials GET - token:", token)

  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("business_plan_id")
    .eq("token", token)
    .single()

  if (shareError || !share) {
    console.error("[v0] Share not found:", shareError)
    return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  }

  console.log("[v0] Share found, loading financials for business_plan_id:", share.business_plan_id)

  const { data, error } = await supabase
    .from("business_plan_financials")
    .select("*")
    .eq("business_plan_id", share.business_plan_id)
    .order("year", { ascending: true })

  if (error) {
    console.error("[v0] Error loading financials:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] Financials loaded:", data?.length || 0, "years")

  // Map year to year_number and convert monthly to annual for frontend
  const mappedData = data?.map(d => ({
    ...d,
    year_number: d.year,
    // Convert monthly costs to annual for frontend display
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
