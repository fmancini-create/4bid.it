import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import SharedBusinessPlanView from "./shared-view"

export default async function SharedBusinessPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  // Trova la condivisione tramite token
  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("*, business_plans(*)")
    .eq("token", token) // fixed from access_token to token
    .single()

  if (shareError || !share) {
    notFound()
  }

  // Verifica scadenza
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Link Scaduto</h1>
          <p className="text-muted-foreground">Questo business plan non è più accessibile.</p>
        </div>
      </div>
    )
  }

  return <SharedBusinessPlanView share={share} token={token} />
}
