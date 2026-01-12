import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

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

    const sql = neon(process.env.SUPABASE_POSTGRES_URL!)

    console.log("[v0] Starting daily snapshot save at", new Date().toISOString())
    console.log("[v0] Environment check:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    })

    // Ottieni tutte le landing pages
    const pages = await sql`SELECT id, views, conversions FROM landing_pages`

    console.log(`[v0] Found ${pages?.length || 0} landing pages to snapshot`)
    console.log(
      "[v0] Landing pages data:",
      pages?.map((p) => ({ id: p.id, views: p.views, conversions: p.conversions })),
    )

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

    if (pages && pages.length > 0) {
      // Inserisci ogni snapshot usando SQL diretto (bypassa RLS)
      for (const page of pages) {
        await sql`
          INSERT INTO landing_page_daily_stats (landing_page_id, date, views, conversions)
          VALUES (${page.id}, ${today}, ${page.views || 0}, ${page.conversions || 0})
          ON CONFLICT (landing_page_id, date) 
          DO UPDATE SET views = ${page.views || 0}, conversions = ${page.conversions || 0}
        `
        console.log(`[v0] Saved snapshot for page ${page.id}`)
      }
    }

    console.log("[v0] Daily snapshot saved successfully at", new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: "Daily snapshot saved successfully",
      pages_saved: pages?.length || 0,
      timestamp: new Date().toISOString(),
      snapshots_preview: pages?.slice(0, 3) || [],
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
