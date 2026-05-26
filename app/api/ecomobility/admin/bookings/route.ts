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
    .from("ecomobility_bookings")
    .select(`
      *,
      customer:ecomobility_customers(*),
      vehicle:ecomobility_vehicles(*, vehicle_type:ecomobility_vehicle_types(*))
    `)
    .eq("structure_id", structureId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[v0] Error fetching bookings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: data })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: "ID and status required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Se il veicolo viene ritirato, registra l'orario
  if (status === "picked_up") {
    updates.actual_pickup_datetime = new Date().toISOString()

    // Aggiorna anche lo stato del veicolo
    const { data: booking } = await supabase.from("ecomobility_bookings").select("vehicle_id").eq("id", id).single()

    if (booking?.vehicle_id) {
      await supabase
        .from("ecomobility_vehicles")
        .update({ status: "rented", updated_at: new Date().toISOString() })
        .eq("id", booking.vehicle_id)
    }
  }

  // Se completato, rilascia il veicolo
  if (status === "completed") {
    const { data: booking } = await supabase.from("ecomobility_bookings").select("vehicle_id").eq("id", id).single()

    if (booking?.vehicle_id) {
      await supabase
        .from("ecomobility_vehicles")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", booking.vehicle_id)
    }
  }

  const { error } = await supabase.from("ecomobility_bookings").update(updates).eq("id", id)

  if (error) {
    console.error("[v0] Error updating booking:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity
  const { data: bookingData } = await supabase
    .from("ecomobility_bookings")
    .select("structure_id, vehicle_id, customer_id")
    .eq("id", id)
    .single()

  if (bookingData) {
    await supabase.from("ecomobility_operation_logs").insert({
      structure_id: bookingData.structure_id,
      booking_id: id,
      vehicle_id: bookingData.vehicle_id,
      action: `booking_status_changed_to_${status}`,
      details: { customer_id: bookingData.customer_id },
    })
  }

  return NextResponse.json({ success: true })
}
