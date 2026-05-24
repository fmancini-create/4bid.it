import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { data, error } = await supabase
    .from("social_topic_rules")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rules: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = await request.json()
  if (!body?.topic_name || typeof body.topic_name !== "string") {
    return NextResponse.json({ error: "topic_name richiesto" }, { status: 400 })
  }

  const insert = {
    topic_name: body.topic_name.trim(),
    is_active: body.is_active ?? true,
    frequency_days: Math.max(1, Number(body.frequency_days) || 3),
    batch_size: Math.max(1, Math.min(Number(body.batch_size) || 1, 10)),
    start_date: body.start_date || new Date().toISOString().slice(0, 10),
    end_date: body.end_date || null,
    exclude_weekdays: Array.isArray(body.exclude_weekdays) ? body.exclude_weekdays : [],
    time_windows:
      Array.isArray(body.time_windows) && body.time_windows.length
        ? body.time_windows
        : [{ start: "09:30", end: "12:00" }],
    platforms: Array.isArray(body.platforms) && body.platforms.length ? body.platforms : ["facebook", "linkedin"],
    target_accounts: Array.isArray(body.target_accounts) ? body.target_accounts : [],
    tone: body.tone || "professional",
    include_hashtags: body.include_hashtags ?? true,
    default_hashtags: Array.isArray(body.default_hashtags) ? body.default_hashtags : [],
    link_url: body.link_url || null,
    image_style_prompt: body.image_style_prompt || null,
    auto_publish: body.auto_publish ?? true,
    notes: body.notes || null,
    min_queue_pending: Number(body.min_queue_pending) || 5,
  }

  const { data, error } = await supabase.from("social_topic_rules").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rule: data })
}
