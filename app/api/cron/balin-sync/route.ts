import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  getDevice,
  isQueclink,
  metersToKm,
  voltageToPercent,
  type BalinDevice,
} from "@/lib/ecomobility/balin"

// Cron Balin sync - aggiorna stato devices + ultime posizioni
// Schedulato ogni 5 min. Per ogni ecomobility_device con imei e provider='balin':
//  - chiama GET /device/:imei
//  - aggiorna ecomobility_devices (battery_level, location, status)
//  - se posizione nuova -> insert in ecomobility_device_locations
//  - aggiorna ecomobility_vehicles.battery_level se differente

export async function GET() {
  const supabase = createAdminClient()

  if (!process.env.BALIN_EMAIL || !process.env.BALIN_API_TOKEN) {
    return NextResponse.json({ success: false, error: "balin_credentials_missing" }, { status: 500 })
  }

  const { data: devices, error } = await supabase
    .from("ecomobility_devices")
    .select("id, imei, vehicle_id, model, last_position_at, battery_level, status")
    .eq("provider", "balin")
    .not("imei", "is", null)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  if (!devices || devices.length === 0) {
    return NextResponse.json({ success: true, synced: 0, message: "no_balin_devices" })
  }

  let synced = 0
  let errors = 0
  const now = new Date().toISOString()

  for (const dev of devices) {
    try {
      const remote: BalinDevice | null = await getDevice(dev.imei!)
      if (!remote) continue

      const pos = remote.last_position
      const batteryVoltage = remote.battery_voltage ?? pos?.battery_voltage ?? null
      // QUECLINK ritorna voltaggio -> percentuale; gli altri: keep null e usiamo is_connected come hint
      const batteryPct = isQueclink(remote.model || dev.model)
        ? voltageToPercent(batteryVoltage)
        : null
      const isMoving = Boolean(remote.moving ?? remote.is_moving)
      const isConnected = Boolean(remote.is_connected)
      const odoKm = metersToKm(remote.odometer)
      const positionAt = pos?.recorded_at || null

      // Update device
      const updates: any = {
        last_synced_at: now,
        is_moving: isMoving,
        is_connected: isConnected,
        last_event_type: pos?.type ?? null,
        last_speed_kmh: pos?.speed ?? remote.speed ?? null,
        last_sync_error: null,
        odometer_km: odoKm,
        battery_voltage: batteryVoltage,
      }
      if (batteryPct != null) updates.battery_level = batteryPct
      if (pos?.latitude != null && pos?.longitude != null) {
        updates.last_location_lat = pos.latitude
        updates.last_location_lng = pos.longitude
        updates.last_position_at = positionAt
        updates.last_ping_at = now
      } else if (isConnected) {
        updates.last_ping_at = now
      }
      if (remote.model && remote.model !== dev.model) updates.model = remote.model

      await supabase.from("ecomobility_devices").update(updates).eq("id", dev.id)

      // Insert location point se nuovo
      if (
        pos?.latitude != null &&
        pos?.longitude != null &&
        positionAt &&
        positionAt !== dev.last_position_at
      ) {
        // Prova a legare a un booking attivo del veicolo
        let activeBookingId: string | null = null
        if (dev.vehicle_id) {
          const { data: b } = await supabase
            .from("ecomobility_bookings")
            .select("id")
            .eq("vehicle_id", dev.vehicle_id)
            .in("status", ["picked_up", "in_use"])
            .order("pickup_datetime", { ascending: false })
            .limit(1)
            .maybeSingle()
          activeBookingId = b?.id || null
        }

        await supabase.from("ecomobility_device_locations").insert({
          device_id: dev.id,
          booking_id: activeBookingId,
          latitude: pos.latitude,
          longitude: pos.longitude,
          altitude_m: pos.altitude ?? null,
          speed_kmh: pos.speed ?? null,
          heading: pos.heading ?? null,
          event_type: pos.type ?? null,
          battery_voltage: batteryVoltage,
          recorded_at: positionAt,
          source: "balin",
        })
      }

      // Sync battery sul vehicle (per UI booking)
      if (dev.vehicle_id && batteryPct != null) {
        await supabase
          .from("ecomobility_vehicles")
          .update({ battery_level: batteryPct })
          .eq("id", dev.vehicle_id)
      }

      synced++
    } catch (e: any) {
      errors++
      const msg = String(e?.message || e).slice(0, 500)
      await supabase
        .from("ecomobility_devices")
        .update({ last_sync_error: msg, last_synced_at: now })
        .eq("id", dev.id)
      console.error("[v0] balin sync error:", dev.imei, msg)
    }
  }

  return NextResponse.json({ success: true, synced, errors, total: devices.length })
}
