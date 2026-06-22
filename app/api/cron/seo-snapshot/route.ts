import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getQueryPagePairs, SearchConsoleSetupError } from "@/lib/google/search-console"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Cron giornaliero: salva uno snapshot delle query reali (query→pagina) da
 * Google Search Console in seo_query_snapshots, per costruire lo storico delle
 * posizioni nel tempo. Idempotente (upsert sulla data di chiusura, -2gg).
 */
export async function GET(request: NextRequest) {
  // Check opzionale: se CRON_SECRET è impostato, richiedi l'header corrispondente.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }
  }

  try {
    const pairs = await getQueryPagePairs(28, 1000)
    const snapshotDate = new Date()
    snapshotDate.setUTCDate(snapshotDate.getUTCDate() - 2)
    const date = snapshotDate.toISOString().slice(0, 10)

    const rows = pairs.slice(0, 1000).map((r) => ({
      snapshot_date: date,
      query: r.query,
      page: r.page || "",
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: r.ctr,
      position: r.position,
    }))

    let saved = 0
    if (rows.length > 0) {
      const admin = createAdminClient()
      const { error } = await admin
        .from("seo_query_snapshots")
        .upsert(rows, { onConflict: "snapshot_date,query,page" })
      if (error) throw new Error(error.message)
      saved = rows.length
    }

    return NextResponse.json({ ok: true, date, saved })
  } catch (err) {
    if (err instanceof SearchConsoleSetupError) {
      // Setup non ancora completato: non è un errore fatale del cron.
      return NextResponse.json({ ok: false, configured: false, message: err.message })
    }
    console.log("[v0] seo-snapshot cron error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Errore snapshot SEO" }, { status: 500 })
  }
}
