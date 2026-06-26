import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

// 1x1 GIF trasparente
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("c")
  const recipientId = searchParams.get("r")
  const email = searchParams.get("e") ? decodeURIComponent(searchParams.get("e")!) : null

  if (campaignId && email) {
    const supabase = createAdminClient()

    // Inserisci evento
    await supabase.from("dem_tracking_events").insert({
      campaign_id: campaignId,
      recipient_id: recipientId || null,
      email,
      event_type: "open",
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      user_agent: request.headers.get("user-agent") || null,
    })

    // Aggiorna contatori destinatario
    const now = new Date().toISOString()
    const { data: rec } = await supabase
      .from("dem_recipients")
      .select("id, open_count, first_open_at")
      .eq("campaign_id", campaignId)
      .eq("email", email)
      .single()

    if (rec) {
      await supabase
        .from("dem_recipients")
        .update({
          open_count: (rec.open_count || 0) + 1,
          first_open_at: rec.first_open_at || now,
          last_open_at: now,
        })
        .eq("id", rec.id)
    }

    // Aggiorna contatori campagna
    const { count: totalOpens } = await supabase
      .from("dem_tracking_events")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("event_type", "open")

    const { count: uniqueOpens } = await supabase
      .from("dem_recipients")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .gt("open_count", 0)

    await supabase
      .from("dem_campaigns")
      .update({ open_count: totalOpens || 0, unique_opens: uniqueOpens || 0 })
      .eq("id", campaignId)
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
