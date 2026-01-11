import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: Request) {
  try {
    // Verifichiamo solo se NON è in produzione o se l'header corrisponde
    const authHeader = request.headers.get("authorization")

    // In produzione Vercel, i cron sono automaticamente autorizzati
    // L'header x-vercel-cron-signature viene aggiunto automaticamente da Vercel
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")

    const isManuallyAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`

    const isDev = process.env.NODE_ENV === "development"

    if (!isDev && !isVercelCron && !isManuallyAuthorized) {
      console.error("[v0] Cron unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    console.log("[v0] Starting daily snapshot save...")

    // Ottieni tutte le landing pages
    const { data: pages, error: pagesError } = await supabase.from("landing_pages").select("id, views, conversions")

    if (pagesError) {
      console.error("[v0] Error fetching landing pages:", pagesError)
      return NextResponse.json({ error: pagesError.message }, { status: 500 })
    }

    console.log(`[v0] Found ${pages?.length || 0} landing pages to snapshot`)

    // Inserisci uno snapshot per ogni landing page
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    const snapshots =
      pages?.map((page) => ({
        landing_page_id: page.id,
        date: today,
        views: page.views || 0,
        conversions: page.conversions || 0,
      })) || []

    if (snapshots.length > 0) {
      const { error: insertError } = await supabase.from("landing_page_daily_stats").upsert(snapshots, {
        onConflict: "landing_page_id,date",
        ignoreDuplicates: false,
      })

      if (insertError) {
        console.error("[v0] Error inserting daily stats:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    console.log("[v0] Daily snapshot saved successfully at", new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: "Daily snapshot saved successfully",
      pages_saved: snapshots.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error in save-daily-snapshot cron:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
