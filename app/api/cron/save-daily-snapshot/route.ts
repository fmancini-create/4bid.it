import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Questo endpoint dovrebbe essere chiamato da un cron job giornaliero (es. Vercel Cron)
// Per configurarlo: aggiungi in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/save-daily-snapshot",
//     "schedule": "0 0 * * *"
//   }]
// }

export async function GET(request: Request) {
  try {
    // Verifica authorization header per sicurezza
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Chiama la funzione PostgreSQL per salvare lo snapshot
    const { error } = await supabase.rpc("save_daily_snapshot")

    if (error) {
      console.error("Error saving daily snapshot:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Daily snapshot saved successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in save-daily-snapshot cron:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
