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
        target_accounts: body.target_accounts && body.target_accounts.length > 0 ? body.target_accounts : null,
        image_url: body.image_url || null,
        link_url: body.link_url || null, // Added link_url to insert
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
    const { id, content, platforms, scheduled_for, image_url, target_accounts, status, link_url, isRepost } = body

    if (!id) {
      return NextResponse.json({ error: "ID post mancante" }, { status: 400 })
    }

    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
    }

    if (isRepost) {
      const { data: newPost, error: insertError } = await supabase
        .from("social_posts")
        .insert({
          content,
          platforms,
          status: "draft",
          scheduled_for: scheduled_for || null,
          auto_publish: false,
          requires_approval: false,
          is_ai_generated: existingPost.is_ai_generated || false,
          ai_topic: existingPost.ai_topic || null,
          hashtags: content.match(/#\w+/g) || [],
          target_accounts: target_accounts && target_accounts.length > 0 ? target_accounts : null,
          image_url: image_url || null,
          link_url: link_url || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json(newPost)
    }

    if (!["draft", "scheduled", "pending_approval", "approved"].includes(existingPost.status)) {
      return NextResponse.json(
        { error: "Post non modificabile. Usa 'Modifica e Ripubblica' per creare una nuova bozza." },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        content,
        platforms,
        scheduled_for: scheduled_for || null,
        image_url: image_url || null,
        link_url: link_url || null,
        target_accounts: target_accounts && target_accounts.length > 0 ? target_accounts : null,
        status: status || existingPost.status,
        hashtags: content.match(/#\w+/g) || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating post:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 })
  }
}
