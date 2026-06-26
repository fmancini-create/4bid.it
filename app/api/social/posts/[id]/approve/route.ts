import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { type NextRequest, NextResponse } from "next/server"
import { findNextAvailableSlot } from "@/lib/social/scheduling"

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

    const admin = createAdminClient()

    const { data: existingPost, error: fetchError } = await admin
      .from("social_posts")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
    }

    let scheduledFor = existingPost.scheduled_for

    // If no scheduled_for, auto-assign from topic rule
    if (!scheduledFor && existingPost.ai_topic) {
      const { data: rule } = await admin
        .from("social_topic_rules")
        .select("*")
        .eq("topic_name", existingPost.ai_topic)
        .single()

      if (rule) {
        // Get last scheduled post for this topic
        const { data: lastPost } = await admin
          .from("social_posts")
          .select("scheduled_for")
          .eq("ai_topic", existingPost.ai_topic)
          .eq("status", "scheduled")
          .not("scheduled_for", "is", null)
          .order("scheduled_for", { ascending: false })
          .limit(1)
          .single()

        const lastScheduledFor = lastPost?.scheduled_for ? new Date(lastPost.scheduled_for) : null

        // Get all existing schedules for anti-collision
        const { data: allScheduled } = await admin
          .from("social_posts")
          .select("scheduled_for")
          .in("status", ["pending_approval", "scheduled"])
          .not("scheduled_for", "is", null)
          .neq("id", id) // Exclude self
          .gte("scheduled_for", new Date().toISOString())

        const existingSchedules = (allScheduled || []).map(p => new Date(p.scheduled_for))

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
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      approved_by: user.email,
      approved_at: new Date().toISOString(),
      requires_approval: false,
    }

    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      updateData.status = "scheduled"
      updateData.auto_publish = true
      updateData.scheduled_for = scheduledFor
    } else {
      updateData.status = "approved"
    }

    const { data, error } = await admin
      .from("social_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error approving post:", error)
    return NextResponse.json({ error: "Errore nell'approvazione" }, { status: 500 })
  }
}
