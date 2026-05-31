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

    // Recipients are paginated: the full list can be ~30k rows, so we fetch one
    // page at a time with .range() and let the UI navigate with prev/next buttons.
    const PAGE_SIZE = 500
    const requestedPage = Math.max(0, Number.parseInt(searchParams.get("page") || "0", 10) || 0)
    const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
    const page = Math.min(requestedPage, lastPage)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: recipients, error: recipientsError } = await supabase
      .from("dem_recipients")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })
      .range(from, to)

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
      recipientsPage: page,
      recipientsPageSize: PAGE_SIZE,
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
