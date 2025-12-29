import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Recupera il post
    const { data: post, error: fetchError } = await supabase.from("social_posts").select("*").eq("id", id).single()

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
    }

    // Recupera gli account attivi
    const { data: accounts } = await supabase.from("social_accounts").select("*").eq("is_active", true)

    const platformPostIds: Record<string, string> = {}
    const errors: string[] = []

    // Pubblica su ogni piattaforma
    for (const platform of post.platforms) {
      const account = accounts?.find((a) => a.platform === platform)

      if (!account) {
        errors.push(`Account ${platform} non configurato`)
        continue
      }

      try {
        // Qui andrà la logica di pubblicazione per ogni piattaforma
        // Per ora simuliamo il successo
        platformPostIds[platform] = `simulated_${platform}_${Date.now()}`

        // TODO: Implementare le API reali
        // - Facebook: Graph API
        // - Instagram: Graph API (via Facebook)
        // - LinkedIn: Marketing API
      } catch (err) {
        errors.push(`Errore pubblicazione ${platform}: ${err}`)
      }
    }

    // Aggiorna lo stato del post
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: errors.length === post.platforms.length ? "failed" : "published",
        published_at: new Date().toISOString(),
        platform_post_ids: platformPostIds,
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      post: data,
      published: Object.keys(platformPostIds),
      errors,
    })
  } catch (error) {
    console.error("[v0] Error publishing post:", error)
    return NextResponse.json({ error: "Errore nella pubblicazione" }, { status: 500 })
  }
}
