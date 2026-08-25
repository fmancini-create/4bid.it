import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"
import WarmFollowupClient from "./warm-followup-client"

export const metadata: Metadata = {
  title: "Solleciti caldi | Admin 4BID.IT",
  description: "Sequenza di solleciti per i contatti caldi di una campagna DEM",
}

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function DemCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-destructive">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p>
        </div>
      </div>
    )
  }

  const { data: campaign } = await supabase
    .from("dem_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single()

  if (!campaign) {
    notFound()
  }

  // I solleciti si amministrano dalla campagna madre. Impedisce di creare
  // sequenze ricorsive "Sollecito di un sollecito".
  if (campaign.campaign_kind === "warm_followup" && campaign.original_campaign_id) {
    redirect(`/admin/dem/${campaign.original_campaign_id}`)
  }

  return <WarmFollowupClient campaignId={campaignId} initialCampaign={campaign} />
}
