import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  console.log("[v0] Financials GET - id:", id)

  const { data, error } = await supabase
    .from("business_plan_years")
    .select("*")
    .eq("business_plan_id", id)
    .order("year_number", { ascending: true })

  console.log("[v0] Financials GET - data:", data?.length || 0, "records")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("business_plan_years")
    .upsert(
      {
        business_plan_id: id,
        year_number: body.year_number || 1,
        rooms_available: body.rooms_available || 90,
        opening_days: body.opening_days || 365,
        occupancy_rate: body.occupancy_rate || 65.0,
        adr: body.adr || 180.0,
        fb_revenue_pct: body.fb_revenue_pct || 35.0,
        spa_revenue_pct: body.spa_revenue_pct || 12.0,
        other_revenue_pct: body.other_revenue_pct || 5.0,
        congress_revenue_pct: body.congress_revenue_pct || 20.0,
        rooms_cost_pct: body.rooms_cost_pct || 25.0,
        fb_cost_pct: body.fb_cost_pct || 35.0,
        spa_cost_pct: body.spa_cost_pct || 40.0,
        other_cost_pct: body.other_cost_pct || 20.0,
        congress_cost_pct: body.congress_cost_pct || 45.0,
        staff_rooms_cost: body.staff_rooms_cost || 400000.0,
        staff_fb_cost: body.staff_fb_cost || 300000.0,
        staff_spa_cost: body.staff_spa_cost || 150000.0,
        staff_congress_cost: body.staff_congress_cost || 100000.0,
        staff_admin_cost: body.staff_admin_cost || 180000.0,
        rent_cost: body.rent_cost || 180000.0,
        utilities_cost: body.utilities_cost || 120000.0,
        marketing_cost: body.marketing_cost || 80000.0,
        maintenance_cost: body.maintenance_cost || 60000.0,
        insurance_cost: body.insurance_cost || 35000.0,
        admin_cost: body.admin_cost || 45000.0,
        other_fixed_cost: body.other_fixed_cost || 30000.0,
        depreciation: body.depreciation || 150000.0,
        interest_cost: body.interest_cost || 80000.0,
        tax_rate: body.tax_rate || 24.0,
      },
      {
        onConflict: "business_plan_id,year_number",
      },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("business_plan_years")
    .upsert({
      ...body,
      business_plan_id: id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
