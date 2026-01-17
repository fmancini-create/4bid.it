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
    .order("name")

  if (error) {
    console.error("[v0] Error fetching pricing:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pricing: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    structure_id,
    vehicle_type_id,
    name,
    min_price,
    price_first_hour,
    price_second_hour,
    price_third_hour,
    price_per_hour_after,
    max_price_day,
    deposit_amount,
  } = body

  if (!structure_id || !vehicle_type_id || !name) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("ecomobility_pricing")
    .insert({
      structure_id,
      vehicle_type_id,
      name,
      min_price,
      price_first_hour,
      price_second_hour,
      price_third_hour,
      price_per_hour_after,
      max_price_day,
      deposit_amount,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating pricing:", error)
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
    console.error("[v0] Error updating pricing:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pricing: data })
}
