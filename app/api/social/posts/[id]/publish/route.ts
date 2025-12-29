import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { publishToFacebook } from "@/lib/social/facebook"
import { publishToLinkedIn } from "@/lib/social/linkedin"

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
      let platformAccounts = accounts?.filter((a) => a.platform === platform) || []

      if (platform === "facebook" && post.target_accounts && post.target_accounts.length > 0) {
        platformAccounts = platformAccounts.filter((a) => post.target_accounts.includes(a.id))
      }

      if (platformAccounts.length === 0) {
        errors.push(`Account ${platform} non configurato`)
        continue
      }

      for (const account of platformAccounts) {
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
              platformPostIds[`facebook_${account.account_name}`] = result.postId
            } else {
              errors.push(`Facebook (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
            }
          } else if (platform === "instagram") {
            if (!post.image_url) {
              errors.push("Instagram richiede un'immagine per pubblicare")
            } else {
              errors.push("Instagram: pubblicazione in sviluppo")
            }
          } else if (platform === "linkedin") {
            const result = await publishToLinkedIn(
              account.access_token,
              account.account_id, // This is the person URN (sub from userinfo)
              post.content,
              post.image_url,
            )

            if (result.success && result.postId) {
              platformPostIds[`linkedin_${account.account_name}`] = result.postId
            } else {
              errors.push(`LinkedIn (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
            }
          }
        } catch (err) {
          errors.push(`Errore pubblicazione ${platform} (${account.account_name}): ${err}`)
        }
      }
    }

    // Aggiorna lo stato del post
    const hasPublished = Object.keys(platformPostIds).length > 0
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: hasPublished ? "published" : "failed",
        published_at: new Date().toISOString(),
        platform_post_ids: platformPostIds,
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: hasPublished,
      post: data,
      published: Object.keys(platformPostIds),
      errors,
    })
  } catch (error) {
    console.error("[v0] Error publishing post:", error)
    return NextResponse.json({ error: "Errore nella pubblicazione" }, { status: 500 })
  }
}
