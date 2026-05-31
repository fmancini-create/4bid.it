import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("c")

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // Get campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from("dem_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Accurate counts via head:true count queries. Plain .select() is capped at
    // 1000 rows by PostgREST, so counting the returned array undercounts large
    // campaigns (we have ~30k recipients). Counts below are exact regardless of size.
    const countByStatus = async (status?: string) => {
      let q = supabase
        .from("dem_recipients")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
      if (status) q = q.eq("send_status", status)
      const { count } = await q
      return count || 0
    }

    const [total, sent, failed, pending, paused] = await Promise.all([
      countByStatus(),
      countByStatus("sent"),
      countByStatus("failed"),
      countByStatus("pending"),
      countByStatus("paused"),
    ])

    // Recipients list is only a preview for the table (full list can be huge).
    const RECIPIENTS_PREVIEW_LIMIT = 500
    const { data: recipients, error: recipientsError } = await supabase
      .from("dem_recipients")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })
      .limit(RECIPIENTS_PREVIEW_LIMIT)

    if (recipientsError) {
      return NextResponse.json({ error: "Error fetching recipients" }, { status: 500 })
    }

    // Get tracking events
    const { data: events } = await supabase
      .from("dem_tracking_events")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(500)

    return NextResponse.json({
      campaign,
      recipients: recipients || [],
      recipientsPreviewLimit: RECIPIENTS_PREVIEW_LIMIT,
      events: events || [],
      summary: {
        total,
        sent,
        failed,
        pending,
        paused,
        opens: campaign.open_count || 0,
        unique_opens: campaign.unique_opens || 0,
        clicks: campaign.click_count || 0,
        unique_clicks: campaign.unique_clicks || 0,
      },
    })
  } catch (error) {
    console.error("DEM stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
