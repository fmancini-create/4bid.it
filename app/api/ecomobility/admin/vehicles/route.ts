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
    .from("ecomobility_vehicles")
    .select("*, vehicle_type:ecomobility_vehicle_types(*)")
    .eq("structure_id", structureId)
    .order("code")

  if (error) {
    console.error("[v0] Error fetching vehicles:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vehicles: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { structure_id, vehicle_type_id, code, name, description, image_url } = body

  if (!structure_id || !vehicle_type_id || !code || !name) {
    return NextResponse.json({ error: "Dati mancanti: structure_id, vehicle_type_id, code e name sono obbligatori" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("ecomobility_vehicles")
    .insert({
      structure_id,
      vehicle_type_id,
      code,
      name,
      description: description || null,
      image_url: image_url || null,
      status: "available",
      battery_level: 100,
      battery_status: "available",
    })
    .select("*, vehicle_type:ecomobility_vehicle_types(*)")
    .single()

  if (error) {
    console.error("[v0] Error creating vehicle:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vehicle: data })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("ecomobility_vehicles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating vehicle:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vehicle: data })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: "ID and status required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("ecomobility_vehicles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating vehicle status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
