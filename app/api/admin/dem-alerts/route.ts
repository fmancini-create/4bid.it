import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { rifiutaSeNonAutorizzato } from "@/lib/dem/autorizzazione"

export const dynamic = "force-dynamic"

interface DemAlert {
  id: string
  kind: "campaign" | "followup"
  title: string
  message: string
  affectedRecipients: number
  href: string
}

/**
 * Avvisi persistenti derivati dallo stato reale delle code: nessuna tabella di
 * notifica separata che possa divergere dalla causa o essere persa.
 */
export async function GET(request: NextRequest) {
  const rifiuto = await rifiutaSeNonAutorizzato(request)
  if (rifiuto) return rifiuto

  const supabase = createAdminClient()
  const [campaignsResult, followupsResult] = await Promise.all([
    supabase
      .from("dem_campaigns")
      .select("id, name, auto_paused_reason, updated_at")
      .not("auto_paused_reason", "is", null)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("dem_followups")
      .select("id, name, original_campaign_id, paused_reason, updated_at")
      .eq("status", "paused")
      .not("paused_reason", "is", null)
      .order("updated_at", { ascending: false })
      .limit(50),
  ])

  if (campaignsResult.error || followupsResult.error) {
    return NextResponse.json(
      { error: campaignsResult.error?.message || followupsResult.error?.message },
      { status: 500 },
    )
  }

  const campaignAlerts = await Promise.all(
    (campaignsResult.data || []).map(async (campaign): Promise<DemAlert | null> => {
      const { count, error } = await supabase
        .from("dem_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("send_status", "pending")
      if (error || !count) return null
      return {
        id: `campaign:${campaign.id}`,
        kind: "campaign",
        title: campaign.name,
        message: campaign.auto_paused_reason,
        affectedRecipients: count,
        href: "/admin/dem",
      }
    }),
  )

  const followupAlerts = await Promise.all(
    (followupsResult.data || []).map(async (followup): Promise<DemAlert | null> => {
      const { count, error } = await supabase
        .from("dem_followup_recipients")
        .select("id", { count: "exact", head: true })
        .eq("followup_id", followup.id)
        .eq("excluded", false)
        .eq("responded", false)
        .lt("followups_sent", 3)
      if (error || !count) return null
      return {
        id: `followup:${followup.id}`,
        kind: "followup",
        title: followup.name,
        message: followup.paused_reason,
        affectedRecipients: count,
        href: `/admin/dem/${followup.original_campaign_id}`,
      }
    }),
  )

  const alerts = [...campaignAlerts, ...followupAlerts].filter((alert): alert is DemAlert => alert !== null)
  const affectedRecipients = alerts.reduce((total, alert) => total + alert.affectedRecipients, 0)

  return NextResponse.json(
    { alerts, criticalCount: alerts.length, affectedRecipients },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  )
}
