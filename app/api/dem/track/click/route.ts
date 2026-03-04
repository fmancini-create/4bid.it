import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("c")
  const recipientId = searchParams.get("r")
  const email = searchParams.get("e") ? decodeURIComponent(searchParams.get("e")!) : null
  const url = searchParams.get("u") ? decodeURIComponent(searchParams.get("u")!) : null

  if (campaignId && email && url) {
    const supabase = createAdminClient()

    // Inserisci evento click
    await supabase.from("dem_tracking_events").insert({
      campaign_id: campaignId,
      recipient_id: recipientId || null,
      email,
      event_type: "click",
      url,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      user_agent: request.headers.get("user-agent") || null,
    })

    // Aggiorna contatori destinatario
    const now = new Date().toISOString()
    const { data: rec } = await supabase
      .from("dem_recipients")
      .select("id, click_count, first_click_at")
      .eq("campaign_id", campaignId)
      .eq("email", email)
      .single()

    if (rec) {
      await supabase
        .from("dem_recipients")
        .update({
          click_count: (rec.click_count || 0) + 1,
          first_click_at: rec.first_click_at || now,
        })
        .eq("id", rec.id)
    }

    // Aggiorna contatori campagna
    const { count: totalClicks } = await supabase
      .from("dem_tracking_events")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("event_type", "click")

    const { count: uniqueClicks } = await supabase
      .from("dem_recipients")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .gt("click_count", 0)

    await supabase
      .from("dem_campaigns")
      .update({ click_count: totalClicks || 0, unique_clicks: uniqueClicks || 0 })
      .eq("id", campaignId)

    // Redirect all'URL originale
    return NextResponse.redirect(url)
  }

  // Fallback: redirect a 4bid.it se parametri mancanti
  return NextResponse.redirect("https://4bid.it")
}
