import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { rifiutaSeNonAutorizzato } from "@/lib/dem/autorizzazione"

export const dynamic = "force-dynamic"

type DemAlertSeverity = "critical" | "advisory"

interface DemAlert {
  id: string
  kind: "campaign" | "followup"
  severity: DemAlertSeverity
  title: string
  message: string
  affectedRecipients: number
  href: string
}

/**
 * Avvisi persistenti derivati dallo stato reale delle code.
 *
 * Un problema e' CRITICO soltanto quando appartiene a un flusso che risulta
 * attualmente abilitato all'invio. Le pause di campagne/follow-up storici
 * restano visibili come avvisi, ma non devono far apparire "DEM ferma".
 */
export async function GET(request: NextRequest) {
  const rifiuto = await rifiutaSeNonAutorizzato(request)
  if (rifiuto) return rifiuto

  const supabase = createAdminClient()
  const [campaignsResult, followupsResult] = await Promise.all([
    supabase
      .from("dem_campaigns")
      .select("id, name, status, auto_send, auto_paused_reason, updated_at")
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

  const followups = followupsResult.data || []
  const originalCampaignIds = [...new Set(followups.map((followup) => followup.original_campaign_id).filter(Boolean))]
  const activeOriginalCampaignIds = new Set<string>()

  if (originalCampaignIds.length > 0) {
    const { data: originalCampaigns, error } = await supabase
      .from("dem_campaigns")
      .select("id, auto_send")
      .in("id", originalCampaignIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    for (const campaign of originalCampaigns || []) {
      if (campaign.auto_send === true) activeOriginalCampaignIds.add(campaign.id)
    }
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
        severity: campaign.auto_send === true ? "critical" : "advisory",
        title: campaign.name,
        message: campaign.auto_paused_reason,
        affectedRecipients: count,
        href: "/admin/dem",
      }
    }),
  )

  const followupAlerts = await Promise.all(
    followups.map(async (followup): Promise<DemAlert | null> => {
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
        severity: activeOriginalCampaignIds.has(followup.original_campaign_id) ? "critical" : "advisory",
        title: followup.name,
        message: followup.paused_reason,
        affectedRecipients: count,
        href: `/admin/dem/${followup.original_campaign_id}`,
      }
    }),
  )

  const alerts = [...campaignAlerts, ...followupAlerts].filter((alert): alert is DemAlert => alert !== null)
  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical")
  const advisoryAlerts = alerts.filter((alert) => alert.severity === "advisory")
  const affectedRecipients = criticalAlerts.reduce((total, alert) => total + alert.affectedRecipients, 0)
  const advisoryRecipients = advisoryAlerts.reduce((total, alert) => total + alert.affectedRecipients, 0)

  return NextResponse.json(
    {
      alerts,
      criticalCount: criticalAlerts.length,
      advisoryCount: advisoryAlerts.length,
      affectedRecipients,
      advisoryRecipients,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  )
}
