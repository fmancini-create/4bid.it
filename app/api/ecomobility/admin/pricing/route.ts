import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const structureId = searchParams.get("structureId")

  if (!structureId) {
    return NextResponse.json({ error: "Structure ID required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("ecomobility_pricing")
    .select("*, vehicle_type:ecomobility_vehicle_types(*)")
    .eq("structure_id", structureId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching pricing:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pricing: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    structure_id,
    vehicle_type_id,
    hour_1,
    hour_2,
    hour_3,
    hour_4,
    hour_5,
    hour_6,
    hour_7,
    hour_8_plus,
    daily_cap,
    deposit,
    minimum_charge,
  } = body

  if (!structure_id || !vehicle_type_id) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("ecomobility_pricing")
    .insert({
      structure_id,
      vehicle_type_id,
      hour_1: hour_1 || 8.0,
      hour_2: hour_2 || 7.0,
      hour_3: hour_3 || 6.0,
      hour_4: hour_4 || 5.0,
      hour_5: hour_5 || 4.5,
      hour_6: hour_6 || 4.0,
      hour_7: hour_7 || 3.5,
      hour_8_plus: hour_8_plus || 3.0,
      daily_cap: daily_cap || 35.0,
      deposit: deposit || 50.0,
      minimum_charge: minimum_charge || 5.0,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating pricing:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pricing: data })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Pricing ID required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("ecomobility_pricing")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating pricing:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pricing: data })
}
