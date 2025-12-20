import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    // Supportiamo sia Authorization Bearer che x-vercel-cron-secret
    const authHeader = request.headers.get("authorization")
    const vercelCronHeader = request.headers.get("x-vercel-cron-secret")

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      vercelCronHeader === process.env.CRON_SECRET ||
      // Vercel invia anche CRON_SECRET come env var durante l'esecuzione
      request.headers.get("x-vercel-signature") !== null

    // In development o se CRON_SECRET non è configurato, permetti l'accesso
    const isDev = process.env.NODE_ENV === "development"
    const hasCronSecret = !!process.env.CRON_SECRET

    if (!isDev && hasCronSecret && !isAuthorized) {
      console.error("[v0] Cron unauthorized - headers:", {
        auth: authHeader ? "present" : "missing",
        vercelCron: vercelCronHeader ? "present" : "missing",
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Chiama la funzione PostgreSQL per salvare lo snapshot
    const { error } = await supabase.rpc("save_daily_snapshot")

    if (error) {
      console.error("[v0] Error saving daily snapshot:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Daily snapshot saved successfully at", new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: "Daily snapshot saved successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error in save-daily-snapshot cron:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
