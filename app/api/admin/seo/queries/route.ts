import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  getTopQueries,
  getQueryPagePairs,
  SearchConsoleSetupError,
  getConfiguredServiceAccountEmail,
} from "@/lib/google/search-console"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * GET /api/admin/seo/queries?days=28
 * Ritorna le query reali da Google Search Console (dati certi), le coppie
 * query→pagina e le "opportunità" (posizione 8-20 = a un passo dalla prima pagina).
 * Persiste anche uno snapshot del giorno per costruire lo storico.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days")) || 28, 7), 365)

  try {
    const [topQueries, pairs] = await Promise.all([getTopQueries(days, 250), getQueryPagePairs(days, 1000)])

    // Opportunità: posizione media tra 8 e 20, ordinate per impression (potenziale traffico).
    const opportunities = pairs
      .filter((r) => r.position >= 8 && r.position <= 20 && r.impressions > 0)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 50)

    // Snapshot del giorno (idempotente): aiuta a tracciare l'andamento nel tempo.
    try {
      const admin = createAdminClient()
      const snapshotDate = new Date()
      snapshotDate.setUTCDate(snapshotDate.getUTCDate() - 2)
      const date = snapshotDate.toISOString().slice(0, 10)
      const rows = pairs.slice(0, 500).map((r) => ({
        snapshot_date: date,
        query: r.query,
        page: r.page || "",
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr: r.ctr,
        position: r.position,
      }))
      if (rows.length > 0) {
        await admin.from("seo_query_snapshots").upsert(rows, { onConflict: "snapshot_date,query,page" })
      }
    } catch (persistErr) {
      console.log("[v0] seo snapshot persist warning:", persistErr instanceof Error ? persistErr.message : persistErr)
    }

    return NextResponse.json({ configured: true, days, topQueries, opportunities })
  } catch (err) {
    if (err instanceof SearchConsoleSetupError) {
      return NextResponse.json({
        configured: false,
        message: err.message,
        serviceAccountEmail: err.serviceAccountEmail || getConfiguredServiceAccountEmail(),
      })
    }
    console.log("[v0] seo queries error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Errore nel recupero dati da Search Console" }, { status: 500 })
  }
}
