import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { fetchWarmAudience } from "@/lib/dem/warm"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

// Conteggio in tempo reale del pubblico "caldo" dato min_clicks + recency_days.
// Usato dal wizard per mostrare quanti contatti riceveranno i solleciti.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("c")
  if (!campaignId) {
    return NextResponse.json({ error: "Campagna mancante" }, { status: 400 })
  }

  const minClicks = Math.max(1, Number(searchParams.get("min_clicks") || "1"))
  const recencyRaw = searchParams.get("recency_days")
  const recencyDays = recencyRaw && recencyRaw !== "0" ? Number(recencyRaw) : null

  try {
    const admin = createAdminClient()
    const audience = await fetchWarmAudience(admin, campaignId, {
      min_clicks: minClicks,
      recency_days: recencyDays,
    })
    return NextResponse.json({ count: audience.length, min_clicks: minClicks, recency_days: recencyDays })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}
