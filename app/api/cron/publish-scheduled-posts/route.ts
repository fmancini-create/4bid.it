import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { publishToFacebook } from "@/lib/social/facebook"
import { publishToLinkedInWithFallback } from "@/lib/social/linkedin"

// Cron job per pubblicare i post programmati
// Esegue ogni 5 minuti e pubblica i post con scheduled_for <= now

export async function GET(request: NextRequest) {
  try {
    // Verifica autorizzazione cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Usa service role per bypassare RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const now = new Date().toISOString()
    console.log(`[v0] Cron running at ${now}`)

    // Trova i post programmati che devono essere pubblicati
    const { data: posts, error: fetchError } = await supabase
      .from("social_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error("[v0] Error fetching scheduled posts:", fetchError)
      return NextResponse.json({ error: "Errore nel recupero dei post" }, { status: 500 })
    }

    const { data: allScheduled } = await supabase
      .from("social_posts")
      .select("id, status, scheduled_for, content")
      .eq("status", "scheduled")

    console.log(
      `[v0] All scheduled posts:`,
      allScheduled?.map((p) => ({
        id: p.id,
        status: p.status,
        scheduled_for: p.scheduled_for,
        content: p.content?.substring(0, 30) + "...",
      })),
    )
    console.log(`[v0] Posts to publish (scheduled_for <= ${now}):`, posts?.length || 0)

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: "Nessun post da pubblicare",
        count: 0,
        debug: {
          now,
          allScheduledCount: allScheduled?.length || 0,
          allScheduled: allScheduled?.map((p) => ({
            id: p.id,
            scheduled_for: p.scheduled_for,
          })),
        },
      })
    }

    console.log(`[v0] Found ${posts.length} scheduled posts to publish`)

    // Recupera gli account attivi
    const { data: accounts } = await supabase.from("social_accounts").select("*").eq("is_active", true)

    const results: { postId: string; success: boolean; errors?: string[] }[] = []

    // Pubblica ogni post
    for (const post of posts) {
      const platformPostIds: Record<string, string> = {}
      const errors: string[] = []

      let platformsToPublish = post.platforms || []
      if (!platformsToPublish || platformsToPublish.length === 0) {
        const uniquePlatforms = [...new Set(accounts?.map((a) => a.platform) || [])]
        platformsToPublish = uniquePlatforms
      }

      if (platformsToPublish.length === 0) {
        errors.push("Nessuna piattaforma configurata")
      } else {
        // Pubblica su ogni piattaforma
        for (const platform of platformsToPublish) {
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
                  console.log(`[v0] Published to Facebook ${account.account_name}: ${result.postId}`)
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
                  account.account_id,
                  account.page_id,
                  post.content,
                  post.image_url,
                )

                if (result.success && result.postId) {
                  const suffix = result.publishedAs === "personal" ? " (profilo personale)" : ""
                  platformPostIds[`linkedin_${account.account_name}${suffix}`] = result.postId
                  console.log(`[v0] Published to LinkedIn ${account.account_name}: ${result.postId}`)
                } else {
                  errors.push(`LinkedIn (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
                }
              }
            } catch (err) {
              errors.push(`Errore pubblicazione ${platform} (${account.account_name}): ${err}`)
            }
          }
        }
      }

      // Aggiorna lo stato del post
      const hasPublished = Object.keys(platformPostIds).length > 0
      await supabase
        .from("social_posts")
        .update({
          status: hasPublished ? "published" : "failed",
          published_at: new Date().toISOString(),
          platform_post_ids: platformPostIds,
          error_message: errors.length > 0 ? errors.join("; ") : null,
        })
        .eq("id", post.id)

      results.push({
        postId: post.id,
        success: hasPublished,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    return NextResponse.json({
      message: `Pubblicati ${results.filter((r) => r.success).length}/${posts.length} post`,
      results,
    })
  } catch (error) {
    console.error("[v0] Error in publish-scheduled-posts cron:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
