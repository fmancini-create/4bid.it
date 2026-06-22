import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getQueryTrend, SearchConsoleSetupError } from "@/lib/google/search-console"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** GET /api/admin/seo/trend?query=...&days=90 — serie giornaliera posizione/clic per una query. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const query = request.nextUrl.searchParams.get("query")?.trim()
  if (!query) return NextResponse.json({ error: "Parametro 'query' richiesto" }, { status: 400 })
  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days")) || 90, 28), 365)

  try {
    const trend = await getQueryTrend(query, days)
    return NextResponse.json({ configured: true, query, trend })
  } catch (err) {
    if (err instanceof SearchConsoleSetupError) {
      return NextResponse.json({ configured: false, message: err.message })
    }
    console.log("[v0] seo trend error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Errore nel recupero del trend" }, { status: 500 })
  }
}
