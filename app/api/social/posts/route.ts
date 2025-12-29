import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
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
      .from("social_posts")
      .insert({
        content: body.content,
        platforms: body.platforms,
        status: body.status,
        scheduled_for: body.scheduled_for || null,
        auto_publish: body.auto_publish,
        requires_approval: !body.auto_publish,
        is_ai_generated: body.is_ai_generated || false,
        ai_topic: body.ai_topic || null,
        hashtags: body.content.match(/#\w+/g) || [],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating post:", error)
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { data, error } = await supabase.from("social_posts").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching posts:", error)
    return NextResponse.json({ error: "Errore nel recupero" }, { status: 500 })
  }
}
