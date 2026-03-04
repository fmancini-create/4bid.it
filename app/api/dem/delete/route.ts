import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 })

    const supabase = createAdminClient()

    // Elimina prima i destinatari (FK constraint)
    await supabase.from("dem_recipients").delete().eq("campaign_id", id)
    await supabase.from("dem_tracking_events").delete().eq("campaign_id", id)

    const { error } = await supabase.from("dem_campaigns").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
