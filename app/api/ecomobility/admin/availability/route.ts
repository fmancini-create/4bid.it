import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

// GET - Recupera orari apertura e blocchi
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const structureId = searchParams.get("structureId")

  if (!structureId) {
    return NextResponse.json({ error: "Structure ID required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Recupera orari apertura
  const { data: schedule, error: scheduleError } = await supabase
    .from("ecomobility_schedule")
    .select("*")
    .eq("structure_id", structureId)
    .order("day_of_week")

  // Recupera blocchi date/fasce
  const { data: blockedSlots, error: blockedError } = await supabase
    .from("ecomobility_blocked_slots")
    .select("*")
    .eq("structure_id", structureId)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date")

  if (scheduleError || blockedError) {
    console.error("[v0] Error fetching availability:", scheduleError || blockedError)
    return NextResponse.json({ error: "Errore nel recupero disponibilita" }, { status: 500 })
  }

  return NextResponse.json({ schedule: schedule || [], blockedSlots: blockedSlots || [] })
}

// POST - Crea/aggiorna orari o blocchi
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, structureId, ...data } = body

  if (!structureId) {
    return NextResponse.json({ error: "Structure ID required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (type === "schedule") {
    // Upsert orario giornaliero
    const { day_of_week, is_open, open_time, close_time } = data

    const { data: result, error } = await supabase
      .from("ecomobility_schedule")
      .upsert({
        structure_id: structureId,
        day_of_week,
        is_open,
        open_time: is_open ? open_time : null,
        close_time: is_open ? close_time : null,
      }, {
        onConflict: "structure_id,day_of_week"
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error upserting schedule:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ schedule: result })
  }

  if (type === "blocked") {
    // Crea blocco data/fascia
    const { date, start_time, end_time, reason, all_day } = data

    const { data: result, error } = await supabase
      .from("ecomobility_blocked_slots")
      .insert({
        structure_id: structureId,
        date,
        start_time: all_day ? null : start_time,
        end_time: all_day ? null : end_time,
        reason: reason || null,
        all_day: all_day || false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating blocked slot:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ blockedSlot: result })
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 })
}

// DELETE - Elimina blocco
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("ecomobility_blocked_slots")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[v0] Error deleting blocked slot:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
