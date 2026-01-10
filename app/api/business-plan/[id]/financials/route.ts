import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("business_plan_financials")
    .select("*")
    .eq("business_plan_id", id)
    .order("year", { ascending: true })

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
    .from("business_plan_financials")
    .insert({
      business_plan_id: id,
      year: body.year,
      // Valori default per hotel 4 stelle
      occupancy_rate: 65.0,
      adr: 180.0,
      fb_revenue_per_room_night: 45.0,
      fb_external_covers_day: 30,
      fb_avg_ticket_external: 55.0,
      spa_revenue_per_room_night: 25.0,
      spa_external_clients_day: 10,
      spa_avg_ticket_external: 80.0,
      other_revenue_per_room_night: 10.0,
      room_cost_pct: 15.0,
      fb_cost_pct: 35.0,
      spa_cost_pct: 25.0,
      staff_cost_monthly: 85000.0,
      rent_cost_monthly: 25000.0,
      utilities_cost_monthly: 18000.0,
      maintenance_cost_monthly: 8000.0,
      insurance_cost_monthly: 5000.0,
      marketing_cost_monthly: 12000.0,
      admin_cost_monthly: 6000.0,
      ota_commission_pct: 18.0,
      ota_share_pct: 40.0,
      other_fixed_monthly: 5000.0,
      initial_investment: 8000000.0,
      depreciation_years: 20,
      loan_amount: 5000000.0,
      loan_interest_rate: 4.5,
      loan_years: 15,
    })
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
    .from("business_plan_financials")
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
