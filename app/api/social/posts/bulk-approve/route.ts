import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { type NextRequest, NextResponse } from "next/server"
import { findNextAvailableSlot } from "@/lib/social/scheduling"

// POST: Bulk approve multiple posts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { postIds } = await request.json()
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: "postIds obbligatorio (array)" }, { status: 400 })
    }

    const admin = createAdminClient()
    const results: { id: string; success: boolean; error?: string }[] = []

    // Get ALL existing scheduled_for dates for anti-collision
    const { data: allScheduled } = await admin
      .from("social_posts")
      .select("scheduled_for")
      .in("status", ["pending_approval", "scheduled"])
      .not("scheduled_for", "is", null)
      .gte("scheduled_for", new Date().toISOString())

    const existingSchedules = (allScheduled || []).map(p => new Date(p.scheduled_for))

    for (const postId of postIds) {
      try {
        // Fetch the post
        const { data: post, error: postError } = await admin
          .from("social_posts")
          .select("*")
          .eq("id", postId)
          .single()

        if (postError || !post) {
          results.push({ id: postId, success: false, error: "Post non trovato" })
          continue
        }

        if (post.status !== "pending_approval" && post.status !== "draft") {
          results.push({ id: postId, success: false, error: `Status non valido: ${post.status}` })
          continue
        }

        let scheduledFor = post.scheduled_for

        // If no scheduled_for, try to auto-assign from topic rule
        if (!scheduledFor && post.ai_topic) {
          const { data: rule } = await admin
            .from("social_topic_rules")
            .select("*")
            .eq("topic_name", post.ai_topic)
            .single()

          if (rule) {
            const { data: lastPost } = await admin
              .from("social_posts")
              .select("scheduled_for")
              .eq("ai_topic", post.ai_topic)
              .eq("status", "scheduled")
              .not("scheduled_for", "is", null)
              .order("scheduled_for", { ascending: false })
              .limit(1)
              .single()

            const lastScheduledFor = lastPost?.scheduled_for ? new Date(lastPost.scheduled_for) : null

            const slot = findNextAvailableSlot(
              {
                frequency_days: rule.frequency_days,
                time_windows: rule.time_windows || [{ start: "09:30", end: "11:30" }, { start: "15:00", end: "18:00" }],
                exclude_weekdays: rule.exclude_weekdays || [0],
              },
              lastScheduledFor,
              existingSchedules,
            )

            scheduledFor = slot.scheduledFor.toISOString()
            existingSchedules.push(slot.scheduledFor) // Add for next iteration
          }
        }

        // Approve the post
        const updateData: Record<string, unknown> = {
          requires_approval: false,
        }

        if (scheduledFor && new Date(scheduledFor) > new Date()) {
          updateData.status = "scheduled"
          updateData.auto_publish = true
          updateData.scheduled_for = scheduledFor
        } else {
          updateData.status = "approved"
        }

        const { error: updateError } = await admin
          .from("social_posts")
          .update(updateData)
          .eq("id", postId)

        if (updateError) {
          results.push({ id: postId, success: false, error: updateError.message })
        } else {
          results.push({ id: postId, success: true })
        }
      } catch (err) {
        results.push({ id: postId, success: false, error: String(err) })
      }
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({
      message: `${successCount}/${postIds.length} post approvati`,
      results,
    })
  } catch (error) {
    console.error("[v0] Error in bulk approve:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
