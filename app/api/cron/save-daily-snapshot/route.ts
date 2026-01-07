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
