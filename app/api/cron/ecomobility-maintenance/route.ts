import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendPickupReminder } from "@/lib/ecomobility/notifications"

// Cron Ecomobility - manutenzione stati
// 1) Cancella prenotazioni pending non pagate da > 30 min e libera il veicolo
// 2) Riporta veicoli charging -> available quando estimated_available_time è scaduto
// 3) Reminder ritiro 24h prima ai clienti (idempotente via pickup_reminder_sent_at)
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

  // 3) Reminder ritiro 24h
  // Finestra: pickup_datetime tra now+22h e now+26h, non ancora reminded, status confirmed
  const in22h = new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString()
  const in26h = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString()
  let remindersSent = 0

  const { data: upcomingBookings } = await supabase
    .from("ecomobility_bookings")
    .select(
      "id, booking_code, pickup_datetime, customer:ecomobility_customers(email,first_name,last_name), vehicle:ecomobility_vehicles(brand,model), structure:ecomobility_structures(name,slug)",
    )
    .in("status", ["confirmed"])
    .is("pickup_reminder_sent_at", null)
    .gte("pickup_datetime", in22h)
    .lte("pickup_datetime", in26h)
    .limit(100)

  if (upcomingBookings) {
    for (const b of upcomingBookings) {
      const c: any = b.customer
      const v: any = b.vehicle
      const s: any = b.structure
      if (!c?.email) continue
      try {
        const vehicleName = `${v?.brand || ""} ${v?.model || ""}`.trim() || "Veicolo"
        const pickupFmt = new Date(b.pickup_datetime).toLocaleString("it-IT", {
          dateStyle: "long",
          timeStyle: "short",
        })
        const r = await sendPickupReminder(
          c.email,
          `${c.first_name || ""} ${c.last_name || ""}`.trim(),
          b.booking_code,
          vehicleName,
          pickupFmt,
          s?.name || "",
          s?.slug || "",
        )
        if (r.success) {
          await supabase
            .from("ecomobility_bookings")
            .update({ pickup_reminder_sent_at: now.toISOString() })
            .eq("id", b.id)
          remindersSent++
        }
      } catch (e) {
        console.error("[v0] pickup reminder error:", b.id, e)
      }
    }
  }

  return NextResponse.json({
    success: true,
    cancelledCount,
    releasedCount,
    remindersSent,
    timestamp: now.toISOString(),
  })
}
