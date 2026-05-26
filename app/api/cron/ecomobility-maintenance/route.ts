import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

// Cron Ecomobility - manutenzione stati
// 1) Cancella prenotazioni pending non pagate da > 30 min e libera il veicolo
// 2) Riporta veicoli charging -> available quando estimated_available_time è scaduto
// Schedulato ogni 10 min.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}` &&
    !request.headers.get("x-vercel-cron")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString()

  // 1) Pending expired
  const { data: stalePending, error: staleErr } = await supabase
    .from("ecomobility_bookings")
    .select("id, vehicle_id")
    .eq("status", "pending")
    .lt("created_at", thirtyMinAgo)

  let cancelledCount = 0
  if (!staleErr && stalePending) {
    for (const b of stalePending) {
      await supabase
        .from("ecomobility_bookings")
        .update({
          status: "cancelled",
          payment_status: "expired",
          notes: "Auto-cancellata: pagamento non completato in 30 min",
          updated_at: now.toISOString(),
        })
        .eq("id", b.id)
      if (b.vehicle_id) {
        await supabase
          .from("ecomobility_vehicles")
          .update({ status: "available", updated_at: now.toISOString() })
          .eq("id", b.vehicle_id)
          .in("status", ["reserved"]) // solo se era stato riservato, non se è in uso
      }
      cancelledCount++
    }
  }

  // 2) Veicoli charging -> available
  const { data: chargedVehicles, error: chargingErr } = await supabase
    .from("ecomobility_vehicles")
    .select("id")
    .eq("status", "charging")
    .lte("estimated_available_time", now.toISOString())

  let releasedCount = 0
  if (!chargingErr && chargedVehicles) {
    for (const v of chargedVehicles) {
      await supabase
        .from("ecomobility_vehicles")
        .update({
          status: "available",
          battery_status: "ok",
          estimated_available_time: null,
          updated_at: now.toISOString(),
        })
        .eq("id", v.id)
      releasedCount++
    }
  }

  return NextResponse.json({
    success: true,
    cancelledCount,
    releasedCount,
    timestamp: now.toISOString(),
  })
}
