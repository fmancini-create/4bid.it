import { createAdminClient } from "@/lib/supabase/server-admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const structureId = request.nextUrl.searchParams.get("structure_id")

  if (!structureId) {
    return NextResponse.json({ error: "structure_id richiesto" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("ecomobility_vehicle_types")
    .select("*")
    .eq("structure_id", structureId)
    .order("name", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching vehicle types:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { structure_id, name, description, icon, max_speed_kmh, avg_range_km, requires_license, max_passengers } = body

  if (!structure_id || !name) {
    return NextResponse.json({ error: "structure_id e name richiesti" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("ecomobility_vehicle_types")
    .insert({
      structure_id,
      name,
      description: description || null,
      icon: icon || "bike",
      max_speed_kmh: max_speed_kmh || 25,
      avg_range_km: avg_range_km || 50,
      requires_license: requires_license || false,
      max_passengers: max_passengers || 1,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating vehicle type:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { id, name, description, icon, max_speed_kmh, avg_range_km, requires_license, max_passengers } = body

  if (!id) {
    return NextResponse.json({ error: "id richiesto" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("ecomobility_vehicle_types")
    .update({
      name,
      description,
      icon,
      max_speed_kmh,
      avg_range_km,
      requires_license,
      max_passengers,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating vehicle type:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()
  const id = request.nextUrl.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id richiesto" }, { status: 400 })
  }

  // Verifica che non ci siano veicoli associati
  const { data: vehicles } = await supabase.from("ecomobility_vehicles").select("id").eq("vehicle_type_id", id).limit(1)

  if (vehicles && vehicles.length > 0) {
    return NextResponse.json(
      { error: "Impossibile eliminare: ci sono veicoli associati a questo tipo" },
      { status: 400 },
    )
  }

  const { error } = await supabase.from("ecomobility_vehicle_types").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting vehicle type:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
