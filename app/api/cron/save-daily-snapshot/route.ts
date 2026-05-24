import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Auth: Vercel cron header OR manual Bearer CRON_SECRET (dev or curl)
    const authHeader = request.headers.get("authorization")
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") ||
      request.headers.get("user-agent")?.includes("vercel-cron")
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

    // Use the Supabase REST client with the service role key. This bypasses RLS
    // without depending on a direct Postgres connection.
    //
    // IMPORTANT: do NOT use `neon(SUPABASE_POSTGRES_URL)` here. The Neon driver
    // talks only to the Neon HTTP proxy on `*.neon.tech`; pointing it at a
    // Supabase Postgres host (`db.<ref>.supabase.co`) fails with `fetch failed`
    // and 500s every cron run. See user memory entry "Bug @neondatabase/serverless
    // puntato a Supabase (18/05/2026)".
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] Missing Supabase env:", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
      })
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase credentials" },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    console.log("[v0] Starting daily snapshot save at", new Date().toISOString())

    // Read the current totals for every landing page
    const { data: pages, error: pagesError } = await supabase
      .from("landing_pages")
      .select("id, views, conversions")

    if (pagesError) {
      console.error("[v0] Failed to read landing_pages:", pagesError)
      return NextResponse.json(
        { error: "Failed to read landing pages", details: pagesError.message },
        { status: 500 },
      )
    }

    console.log(`[v0] Found ${pages?.length ?? 0} landing pages to snapshot`)

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

    let upserted = 0
    const failures: Array<{ landing_page_id: string; error: string }> = []

    if (pages && pages.length > 0) {
      const rows = pages.map((p) => ({
        landing_page_id: p.id,
        date: today,
        views: p.views ?? 0,
        conversions: p.conversions ?? 0,
      }))

      // Bulk upsert first (single round-trip when the unique index exists).
      const { error: bulkError } = await supabase
        .from("landing_page_daily_stats")
        .upsert(rows, { onConflict: "landing_page_id,date" })

      if (bulkError) {
        console.warn(
          "[v0] Bulk upsert failed, falling back to per-row upsert:",
          bulkError.message,
        )

        // Fallback: per-row upsert so one bad row doesn't kill the rest.
        for (const row of rows) {
          const { error: rowError } = await supabase
            .from("landing_page_daily_stats")
            .upsert(row, { onConflict: "landing_page_id,date" })

          if (rowError) {
            console.error(`[v0] Failed to upsert page ${row.landing_page_id}:`, rowError.message)
            failures.push({ landing_page_id: row.landing_page_id, error: rowError.message })
          } else {
            upserted += 1
          }
        }
      } else {
        upserted = rows.length
      }
    }

    console.log("[v0] Daily snapshot finished at", new Date().toISOString(), {
      pages_found: pages?.length ?? 0,
      upserted,
      failures: failures.length,
    })

    return NextResponse.json({
      success: failures.length === 0,
      message:
        failures.length === 0
          ? "Daily snapshot saved successfully"
          : "Daily snapshot saved with some failures",
      pages_found: pages?.length ?? 0,
      upserted,
      failures,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error in save-daily-snapshot cron:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
