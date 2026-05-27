import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { listDevices } from "@/lib/ecomobility/balin"

// GET - lista device Balin (live dall'API) + stato locale di linking
export async function GET() {
  try {
    if (!process.env.BALIN_EMAIL || !process.env.BALIN_API_TOKEN) {
      return NextResponse.json({ error: "balin_credentials_missing" }, { status: 500 })
    }
    const supabase = createAdminClient()
    const remote = await listDevices()

    const imeis = remote.map((d) => d.imei).filter(Boolean) as string[]
    const { data: localDevices } = imeis.length
      ? await supabase
          .from("ecomobility_devices")
          .select(
            "id, imei, vehicle_id, structure_id, last_synced_at, battery_level, last_location_lat, last_location_lng, last_position_at",
          )
          .in("imei", imeis)
      : { data: [] }

    const byImei = new Map((localDevices || []).map((l: any) => [l.imei, l]))
    const merged = remote.map((d) => ({
      ...d,
      local: byImei.get(d.imei) || null,
    }))
    return NextResponse.json({ devices: merged, total: merged.length })
  } catch (error: any) {
    console.error("[v0] Balin devices list error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - link/unlink un IMEI a un veicolo (crea o aggiorna ecomobility_devices)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imei, vehicleId, structureId, model, action } = body as {
      imei: string
      vehicleId?: string | null
      structureId: string
      model?: string
      action?: "link" | "unlink"
    }
    if (!imei || !structureId) {
      return NextResponse.json({ error: "imei and structureId required" }, { status: 400 })
    }
    const supabase = createAdminClient()

    if (action === "unlink") {
      const { error } = await supabase
        .from("ecomobility_devices")
        .update({ vehicle_id: null })
        .eq("imei", imei)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    const { data: existing } = await supabase
      .from("ecomobility_devices")
      .select("id")
      .eq("imei", imei)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from("ecomobility_devices")
        .update({
          vehicle_id: vehicleId || null,
          structure_id: structureId,
          model: model || null,
          provider: "balin",
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from("ecomobility_devices").insert({
        imei,
        serial_number: imei,
        vehicle_id: vehicleId || null,
        structure_id: structureId,
        provider: "balin",
        device_type: "tracker",
        manufacturer: "Balin.app",
        model: model || null,
        status: "active",
        installed_at: new Date().toISOString(),
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Balin device link error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
