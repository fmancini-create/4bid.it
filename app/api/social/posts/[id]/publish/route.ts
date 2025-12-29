import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { publishToFacebook } from "@/lib/social/facebook"

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
        if (platform === "facebook") {
          const result = await publishToFacebook(
            account.page_id,
            account.access_token,
            post.content,
            post.link_url,
            post.image_url,
          )

          if (result.success && result.postId) {
            platformPostIds[platform] = result.postId
          } else {
            errors.push(`Facebook: ${result.error || "Errore sconosciuto"}`)
          }
        } else if (platform === "instagram") {
          // Instagram richiede prima il caricamento del media, poi la pubblicazione
          // Per ora segniamo come non supportato se non c'è immagine
          if (!post.image_url) {
            errors.push("Instagram richiede un'immagine per pubblicare")
          } else {
            // TODO: Implementare Instagram publish via Facebook Graph API
            errors.push("Instagram: pubblicazione in sviluppo")
          }
        } else if (platform === "linkedin") {
          // TODO: Implementare LinkedIn Marketing API
          errors.push("LinkedIn: pubblicazione in sviluppo")
        }
      } catch (err) {
        errors.push(`Errore pubblicazione ${platform}: ${err}`)
      }
    }

    // Aggiorna lo stato del post
    const allFailed = errors.length === post.platforms.length
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: allFailed ? "failed" : "published",
        published_at: new Date().toISOString(),
        platform_post_ids: platformPostIds,
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: !allFailed,
      post: data,
      published: Object.keys(platformPostIds),
      errors,
    })
  } catch (error) {
    console.error("[v0] Error publishing post:", error)
    return NextResponse.json({ error: "Errore nella pubblicazione" }, { status: 500 })
  }
}
