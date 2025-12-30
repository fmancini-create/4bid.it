import { createClient } from "@/lib/supabase/server"
import { publishToFacebook } from "@/lib/social/facebook"
import { publishToLinkedIn, publishToLinkedInOrganization } from "@/lib/social/linkedin"

export async function GET() {
  // Solo per test - rimuovere in produzione
  const supabase = await createClient()

  const now = new Date().toISOString()
  console.log("[v0] Test cron - checking scheduled posts at:", now)

  // Trova post programmati che devono essere pubblicati
  const { data: posts, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)

  if (error) {
    console.log("[v0] Error fetching posts:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] Found scheduled posts:", posts?.length || 0)

  if (!posts || posts.length === 0) {
    return Response.json({
      message: "No scheduled posts to publish",
      checkedAt: now,
    })
  }

  const results = []

  for (const post of posts) {
    console.log("[v0] Publishing post:", post.id)

    try {
      // Recupera account social attivi
      const { data: accounts } = await supabase.from("social_accounts").select("*").eq("is_active", true)

      const platformPostIds: Record<string, string> = {}
      const errors: string[] = []

      // Pubblica su Facebook
      const facebookAccounts = accounts?.filter((a) => a.platform === "facebook") || []
      for (const account of facebookAccounts) {
        try {
          const result = await publishToFacebook(
            account.page_id,
            account.access_token,
            post.content,
            null,
            post.image_url,
          )
          if (result.success && result.postId) {
            platformPostIds[`facebook_${account.page_id}`] = result.postId
          } else if (result.error) {
            errors.push(`Facebook ${account.account_name}: ${result.error}`)
          }
        } catch (err: any) {
          errors.push(`Facebook ${account.account_name}: ${err.message}`)
        }
      }

      // Pubblica su LinkedIn
      const linkedinAccount = accounts?.find((a) => a.platform === "linkedin")
      if (linkedinAccount) {
        try {
          // Prova prima con organization
          const organizationId = "110665381"
          try {
            const result = await publishToLinkedInOrganization(
              linkedinAccount.access_token,
              organizationId,
              post.content,
            )
            platformPostIds["linkedin"] = result.id
          } catch (orgError: any) {
            // Fallback a profilo personale
            if (linkedinAccount.page_id) {
              const result = await publishToLinkedIn(
                linkedinAccount.access_token,
                linkedinAccount.page_id,
                post.content,
              )
              platformPostIds["linkedin_personal"] = result.id
            }
          }
        } catch (err: any) {
          errors.push(`LinkedIn: ${err.message}`)
        }
      }

      // Aggiorna stato post
      const hasSuccess = Object.keys(platformPostIds).length > 0
      await supabase
        .from("social_posts")
        .update({
          status: hasSuccess ? "published" : "failed",
          published_at: hasSuccess ? new Date().toISOString() : null,
          platform_post_ids: platformPostIds,
          error_message: errors.length > 0 ? errors.join("; ") : null,
        })
        .eq("id", post.id)

      results.push({
        postId: post.id,
        status: hasSuccess ? "published" : "failed",
        platformPostIds,
        errors,
      })
    } catch (err: any) {
      results.push({
        postId: post.id,
        status: "error",
        error: err.message,
      })
    }
  }

  return Response.json({
    message: "Cron test completed",
    checkedAt: now,
    postsProcessed: posts.length,
    results,
  })
}
