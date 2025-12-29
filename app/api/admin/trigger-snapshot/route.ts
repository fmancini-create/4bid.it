import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export async function POST() {
  try {
    const supabase = await createClient()

    // Verifica autenticazione admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Chiama la funzione PostgreSQL per salvare lo snapshot
    const { error } = await supabase.rpc("save_daily_snapshot")

    if (error) {
      console.error("[v0] Error saving daily snapshot:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Snapshot salvato con successo",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error in trigger-snapshot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
