import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { type NextRequest, NextResponse } from "next/server"

// GET: List all topic rules
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("social_topic_rules")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching topic rules:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}

// POST: Create a new topic rule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from("social_topic_rules")
      .insert({
        topic_name: body.topic_name,
        batch_size: body.batch_size ?? 15,
        frequency_days: body.frequency_days ?? 3,
        time_windows: body.time_windows ?? [{ start: "09:30", end: "11:30" }, { start: "15:00", end: "18:00" }],
        exclude_weekdays: body.exclude_weekdays ?? [0],
        platforms: body.platforms ?? ["facebook", "linkedin"],
        target_accounts: body.target_accounts ?? [],
        tone: body.tone ?? "professional",
        include_hashtags: body.include_hashtags ?? true,
        default_hashtags: body.default_hashtags ?? [],
        link_url: body.link_url ?? null,
        image_style_prompt: body.image_style_prompt ?? null,
        min_queue_pending: body.min_queue_pending ?? 10,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating topic rule:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}

// PUT: Update an existing topic rule
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 })
    }

    const admin = createAdminClient()
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      "topic_name", "batch_size", "frequency_days", "time_windows",
      "exclude_weekdays", "platforms", "target_accounts", "tone",
      "include_hashtags", "default_hashtags", "link_url", "image_style_prompt",
      "min_queue_pending", "is_active",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await admin
      .from("social_topic_rules")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating topic rule:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
