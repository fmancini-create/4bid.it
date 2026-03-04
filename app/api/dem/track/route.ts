import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// 1x1 transparent GIF pixel
const TRANSPARENT_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("t") // "open" or "click"
  const campaignId = searchParams.get("c")
  const recipientId = searchParams.get("r")
  const url = searchParams.get("u") // only for click events

  if (!type || !campaignId || !recipientId) {
    return new NextResponse("Missing parameters", { status: 400 })
  }

  const supabase = createAdminClient()
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  try {
    // Get recipient email for tracking
    const { data: recipient } = await supabase
      .from("dem_recipients")
      .select("email")
      .eq("id", recipientId)
      .single()

    // Insert tracking event
    await supabase.from("dem_tracking_events").insert({
      campaign_id: campaignId,
      recipient_id: recipientId,
      email: recipient?.email || "",
      event_type: type === "click" ? "click" : "open",
      url: url || null,
      ip_address: ip,
      user_agent: userAgent,
    })

    if (type === "open") {
      // Update recipient open counts
      const { data: currentRecipient } = await supabase
        .from("dem_recipients")
        .select("open_count, first_open_at")
        .eq("id", recipientId)
        .single()

      const isFirstOpen = !currentRecipient?.first_open_at
      const updateData: Record<string, unknown> = {
        open_count: (currentRecipient?.open_count || 0) + 1,
        last_open_at: new Date().toISOString(),
      }
      if (isFirstOpen) {
        updateData.first_open_at = new Date().toISOString()
      }

      await supabase
        .from("dem_recipients")
        .update(updateData)
        .eq("id", recipientId)

      // Update campaign open counts
      const { data: campaign } = await supabase
        .from("dem_campaigns")
        .select("open_count, unique_opens")
        .eq("id", campaignId)
        .single()

      const campaignUpdate: Record<string, unknown> = {
        open_count: (campaign?.open_count || 0) + 1,
      }
      if (isFirstOpen) {
        campaignUpdate.unique_opens = (campaign?.unique_opens || 0) + 1
      }

      await supabase
        .from("dem_campaigns")
        .update(campaignUpdate)
        .eq("id", campaignId)

      // Return transparent pixel
      return new NextResponse(TRANSPARENT_PIXEL, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    if (type === "click" && url) {
      // Update recipient click counts
      const { data: currentRecipient } = await supabase
        .from("dem_recipients")
        .select("click_count, first_click_at")
        .eq("id", recipientId)
        .single()

      const isFirstClick = !currentRecipient?.first_click_at
      const updateData: Record<string, unknown> = {
        click_count: (currentRecipient?.click_count || 0) + 1,
      }
      if (isFirstClick) {
        updateData.first_click_at = new Date().toISOString()
      }

      await supabase
        .from("dem_recipients")
        .update(updateData)
        .eq("id", recipientId)

      // Update campaign click counts
      const { data: campaign } = await supabase
        .from("dem_campaigns")
        .select("click_count, unique_clicks")
        .eq("id", campaignId)
        .single()

      const campaignUpdate: Record<string, unknown> = {
        click_count: (campaign?.click_count || 0) + 1,
      }
      if (isFirstClick) {
        campaignUpdate.unique_clicks = (campaign?.unique_clicks || 0) + 1
      }

      await supabase
        .from("dem_campaigns")
        .update(campaignUpdate)
        .eq("id", campaignId)

      // Redirect to the actual URL
      return NextResponse.redirect(decodeURIComponent(url))
    }

    return new NextResponse("Invalid event type", { status: 400 })
  } catch (error) {
    console.error("DEM tracking error:", error)
    // Still return pixel/redirect even on error to not break user experience
    if (type === "open") {
      return new NextResponse(TRANSPARENT_PIXEL, {
        headers: { "Content-Type": "image/gif" },
      })
    }
    if (type === "click" && url) {
      return NextResponse.redirect(decodeURIComponent(url))
    }
    return new NextResponse("Error", { status: 500 })
  }
}
