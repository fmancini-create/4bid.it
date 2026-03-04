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

    // Get recipients with their statuses
    const { data: recipients, error: recipientsError } = await supabase
      .from("dem_recipients")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })

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
      events: events || [],
      summary: {
        total: recipients?.length || 0,
        sent: recipients?.filter((r) => r.send_status === "sent").length || 0,
        failed: recipients?.filter((r) => r.send_status === "failed").length || 0,
        pending: recipients?.filter((r) => r.send_status === "pending").length || 0,
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
