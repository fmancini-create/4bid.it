import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from("social_settings")
      .update({
        posting_frequency_days: body.posting_frequency_days,
        auto_generate_enabled: body.auto_generate_enabled,
        topics: body.topics,
        tone: body.tone,
        include_hashtags: body.include_hashtags,
        default_hashtags: body.default_hashtags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating settings:", error)
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 })
  }
}
