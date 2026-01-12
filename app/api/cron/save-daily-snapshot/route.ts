import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: Request) {
  try {
    // Verifichiamo solo se NON è in produzione o se l'header corrisponde
    const authHeader = request.headers.get("authorization")
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")
    const isManuallyAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isDev = process.env.NODE_ENV === "development"

    console.log("[v0] Cron authorization check:", {
      isDev,
      isVercelCron,
      isManuallyAuthorized,
      hasAuthHeader: !!authHeader,
      userAgent: request.headers.get("user-agent"),
    })

    if (!isDev && !isVercelCron && !isManuallyAuthorized) {
      console.error("[v0] Cron unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    console.log("[v0] Starting daily snapshot save at", new Date().toISOString())
    console.log("[v0] Environment check:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    })

    // Ottieni tutte le landing pages
    const { data: pages, error: pagesError } = await supabase.from("landing_pages").select("id, views, conversions")

    if (pagesError) {
      console.error("[v0] Error fetching landing pages:", pagesError)
      return NextResponse.json({ error: pagesError.message }, { status: 500 })
    }

    console.log(`[v0] Found ${pages?.length || 0} landing pages to snapshot`)
    console.log(
      "[v0] Landing pages data:",
      pages?.map((p) => ({ id: p.id, views: p.views, conversions: p.conversions })),
    )

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    const snapshots =
      pages?.map((page) => ({
        landing_page_id: page.id,
        date: today,
        views: page.views || 0,
        conversions: page.conversions || 0,
      })) || []

    console.log("[v0] Attempting to insert snapshots:", {
      count: snapshots.length,
      date: today,
      snapshots: snapshots,
    })

    if (snapshots.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("landing_page_daily_stats")
        .upsert(snapshots, {
          onConflict: "landing_page_id,date",
          ignoreDuplicates: false,
        })
        .select()

      if (insertError) {
        console.error("[v0] Error inserting daily stats:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        })
        return NextResponse.json({ error: insertError.message, details: insertError }, { status: 500 })
      }

      console.log("[v0] Successfully inserted snapshots:", insertedData)
    }

    console.log("[v0] Daily snapshot saved successfully at", new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: "Daily snapshot saved successfully",
      pages_saved: snapshots.length,
      timestamp: new Date().toISOString(),
      snapshots_preview: snapshots.slice(0, 3),
    })
  } catch (error) {
    console.error("[v0] Error in save-daily-snapshot cron:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
