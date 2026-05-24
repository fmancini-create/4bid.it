import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { runCampaign, type CampaignRule } from "@/lib/social/campaign-runner"

export const maxDuration = 300

/**
 * "Esegui ora" su una singola campagna: genera batch_size post (testo + immagine
 * + scheduling) e li inserisce in social_posts, indipendentemente dalla cadenza.
 * Aggiorna comunque last_generated_at, cosi' il cron giornaliero salta il prossimo
 * giro per questa campagna se il cooldown non e' ancora trascorso.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  // Service-role client per gli insert (bypassa eventuali RLS sulla scrittura)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase env missing" }, { status: 500 })
  }
  const svc = createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: rule, error } = await svc.from("social_topic_rules").select("*").eq("id", id).single()
  if (error || !rule) return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })

  try {
    const result = await runCampaign(svc, rule as CampaignRule)
    return NextResponse.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      post_ids: result.postIds,
      errors: result.errors,
    })
  } catch (e) {
    console.error("[v0] run-now campaign error:", e)
    return NextResponse.json(
      { error: "Errore esecuzione campagna", details: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    )
  }
}
