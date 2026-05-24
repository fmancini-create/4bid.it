import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { runCampaign, shouldRunCampaign, type CampaignRule } from "@/lib/social/campaign-runner"

export const maxDuration = 300

/**
 * Cron giornaliero: scorre tutte le campagne attive in social_topic_rules,
 * decide quali sono "due" (cadenza, weekday, range date) e per ognuna genera
 * batch_size post (testo + immagine + scheduling) inserendoli in social_posts.
 *
 * NB: usa il client service-role per bypassare RLS, come tutti i cron del progetto.
 */
export async function GET(request: NextRequest) {
  const startedAt = new Date()
  try {
    const authHeader = request.headers.get("authorization")
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") ||
      request.headers.get("user-agent")?.includes("vercel-cron")
    const isManuallyAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isDev = process.env.NODE_ENV === "development"

    console.log("[v0] generate-social-posts cron called", {
      isVercelCron,
      isManuallyAuthorized,
      isDev,
    })

    if (!isDev && !isVercelCron && !isManuallyAuthorized) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase env missing", details: { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey } },
        { status: 500 },
      )
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Carica tutte le campagne attive
    const { data: rules, error: rulesErr } = await supabase
      .from("social_topic_rules")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (rulesErr) {
      return NextResponse.json({ error: "Errore lettura campagne", details: rulesErr.message }, { status: 500 })
    }

    const summary = {
      started_at: startedAt.toISOString(),
      total_rules: rules?.length || 0,
      executed: 0,
      skipped: 0,
      total_posts_created: 0,
      details: [] as Array<{
        id: string
        topic: string
        action: "executed" | "skipped"
        reason?: string
        created?: number
        errors?: string[]
      }>,
    }

    for (const rule of (rules || []) as CampaignRule[]) {
      const decision = shouldRunCampaign(rule, new Date())
      if (!decision.run) {
        summary.skipped++
        summary.details.push({ id: rule.id, topic: rule.topic_name, action: "skipped", reason: decision.reason })
        continue
      }
      try {
        const r = await runCampaign(supabase, rule)
        summary.executed++
        summary.total_posts_created += r.created
        summary.details.push({
          id: rule.id,
          topic: rule.topic_name,
          action: "executed",
          created: r.created,
          errors: r.errors.length ? r.errors : undefined,
        })
      } catch (e) {
        summary.details.push({
          id: rule.id,
          topic: rule.topic_name,
          action: "executed",
          created: 0,
          errors: [e instanceof Error ? e.message : "unknown error"],
        })
      }
    }

    console.log("[v0] generate-social-posts done", {
      total: summary.total_rules,
      executed: summary.executed,
      created: summary.total_posts_created,
    })

    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    console.error("[v0] Error in cron generate-social-posts:", error)
    return NextResponse.json(
      { error: "Errore nella generazione", details: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    )
  }
}
