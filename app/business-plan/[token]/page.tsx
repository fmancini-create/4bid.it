import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import SecureSharedBusinessPlanView from "./secure-shared-view"
import CorporateSharedBusinessPlanView from "./corporate-shared-view"
import DossierAvatarGate from "./dossier-avatar-gate"

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function SharedBusinessPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("id, email, can_edit, can_download, expires_at, business_plans(name, client_name, project_type)")
    .eq("token", token)
    .single()

  if (shareError || !share) notFound()

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Link Scaduto</h1>
          <p className="text-muted-foreground">Questo dossier non è più accessibile.</p>
        </div>
      </div>
    )
  }

  const planMeta = Array.isArray(share.business_plans) ? share.business_plans[0] : share.business_plans
  const normalizedShare = {
    id: share.id,
    email: share.email || undefined,
    can_edit: share.can_edit || false,
    can_download: share.can_download || false,
    business_plans: planMeta
      ? {
          name: planMeta.name || undefined,
          client_name: planMeta.client_name || undefined,
          project_type: planMeta.project_type || undefined,
        }
      : null,
  }

  if (planMeta?.project_type === "corporate_saas") {
    return (
      <>
        <DossierAvatarGate token={token} />
        <CorporateSharedBusinessPlanView share={normalizedShare} token={token} />
      </>
    )
  }

  return <SecureSharedBusinessPlanView share={normalizedShare} token={token} />
}
