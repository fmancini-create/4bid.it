import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("c")
  if (!campaignId) return NextResponse.json({ error: "Missing campaign id" }, { status: 400 })

  const supabase = createAdminClient()

  // Dati campagna con aggregati
  const { data: campaign } = await supabase
    .from("dem_campaigns")
    .select("id, name, subject, status, sent_at, sent_count, failed_count, open_count, click_count, unique_opens, unique_clicks")
    .eq("id", campaignId)
    .single()

  // Destinatari con statistiche
  const { data: recipients } = await supabase
    .from("dem_recipients")
    .select("id, email, nome, cognome, nome_azienda, tipo_contatto, send_status, sent_at, open_count, click_count, first_open_at, last_open_at, first_click_at")
    .eq("campaign_id", campaignId)
    .order("open_count", { ascending: false })

  // Ultimi 20 eventi (per timeline)
  const { data: events } = await supabase
    .from("dem_tracking_events")
    .select("id, event_type, email, url, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(30)

  // Click per URL
  const { data: clicksByUrl } = await supabase
    .from("dem_tracking_events")
    .select("url")
    .eq("campaign_id", campaignId)
    .eq("event_type", "click")
    .not("url", "is", null)

  const urlCounts: Record<string, number> = {}
  for (const e of clicksByUrl || []) {
    if (e.url) urlCounts[e.url] = (urlCounts[e.url] || 0) + 1
  }
  const topLinks = Object.entries(urlCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([url, count]) => ({ url, count }))

  return NextResponse.json({ campaign, recipients, events, topLinks })
}
