import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { publishToFacebook } from "@/lib/social/facebook"
import { publishToLinkedInWithFallback } from "@/lib/social/linkedin"

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
      console.error("[v0] Post not found:", fetchError)
      return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
    }

    console.log("[v0] Publishing post:", { id, content: post.content?.substring(0, 50), platforms: post.platforms })

    // Recupera gli account attivi
    const { data: accounts, error: accountsError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("is_active", true)

    if (accountsError) {
      console.error("[v0] Error fetching accounts:", accountsError)
    }

    console.log(
      "[v0] Active accounts:",
      accounts?.map((a) => ({ platform: a.platform, name: a.account_name, page_id: a.page_id })),
    )

    let platformsToPublish = post.platforms || []
    if (!platformsToPublish || platformsToPublish.length === 0) {
      const uniquePlatforms = [...new Set(accounts?.map((a) => a.platform) || [])]
      platformsToPublish = uniquePlatforms
    }

    console.log("[v0] Platforms to publish:", platformsToPublish)

    if (platformsToPublish.length === 0) {
      return NextResponse.json({ error: "Nessuna piattaforma configurata" }, { status: 400 })
    }

    const platformPostIds: Record<string, string> = {}
    const errors: string[] = []

    // Pubblica su ogni piattaforma
    for (const platform of platformsToPublish) {
      let platformAccounts = accounts?.filter((a) => a.platform === platform) || []

      if (platform === "facebook" && post.target_accounts && post.target_accounts.length > 0) {
        platformAccounts = platformAccounts.filter((a) => post.target_accounts.includes(a.id))
      }

      console.log(`[v0] Publishing to ${platform}, accounts:`, platformAccounts.length)

      if (platformAccounts.length === 0) {
        errors.push(`Account ${platform} non configurato`)
        continue
      }

      for (const account of platformAccounts) {
        try {
          console.log(`[v0] Publishing to ${platform} account:`, account.account_name)

          if (platform === "facebook") {
            const result = await publishToFacebook(
              account.page_id,
              account.access_token,
              post.content,
              post.link_url,
              post.image_url,
            )

            console.log(`[v0] Facebook result:`, result)

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
            const result = await publishToLinkedInWithFallback(
              account.access_token,
              account.account_id, // Organization ID (110665381)
              account.page_id, // Person URN (salvato come page_id per LinkedIn)
              post.content,
              post.image_url,
            )

            console.log(`[v0] LinkedIn result:`, result)

            if (result.success && result.postId) {
              const suffix = result.publishedAs === "personal" ? " (profilo personale)" : ""
              platformPostIds[`linkedin_${account.account_name}${suffix}`] = result.postId
            } else {
              errors.push(`LinkedIn (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
            }
          }
        } catch (err) {
          console.error(`[v0] Error publishing to ${platform}:`, err)
          errors.push(`Errore pubblicazione ${platform} (${account.account_name}): ${err}`)
        }
      }
    }

    // Aggiorna lo stato del post
    const hasPublished = Object.keys(platformPostIds).length > 0
    console.log("[v0] Publish result:", { hasPublished, platformPostIds, errors })

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
