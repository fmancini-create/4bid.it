import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  getKeywordIdeas,
  isDataForSeoConfigured,
  DataForSeoSetupError,
  DEFAULT_LOCATION_CODE,
  DEFAULT_LANGUAGE_CODE,
} from "@/lib/seo/dataforseo"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** GET — keyword di settore già raccolte (ordinate per volume). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("seo_keyword_research")
    .select("*")
    .order("search_volume", { ascending: false, nullsFirst: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ configured: isDataForSeoConfigured(), keywords: data || [] })
}

/** POST { seeds: string[] } — scopre nuove keyword via DataForSEO e le salva. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const seeds: string[] = Array.isArray(body?.seeds) ? body.seeds : []
  if (seeds.length === 0) {
    return NextResponse.json({ error: "Fornisci almeno una keyword seed" }, { status: 400 })
  }

  try {
    const ideas = await getKeywordIdeas(seeds, {
      locationCode: DEFAULT_LOCATION_CODE,
      languageCode: DEFAULT_LANGUAGE_CODE,
      limit: 200,
    })

    const admin = createAdminClient()
    const seedLabel = seeds.join(", ").slice(0, 200)
    const rows = ideas
      .filter((k) => k.keyword)
      .map((k) => ({
        keyword: k.keyword,
        search_volume: k.searchVolume,
        competition: k.competition,
        competition_level: k.competitionLevel,
        cpc: k.cpc,
        seed_keyword: seedLabel,
        location_code: DEFAULT_LOCATION_CODE,
        language_code: DEFAULT_LANGUAGE_CODE,
        source: "dataforseo",
        captured_at: new Date().toISOString(),
      }))

    if (rows.length > 0) {
      await admin.from("seo_keyword_research").upsert(rows, { onConflict: "keyword,location_code,language_code" })
    }

    return NextResponse.json({ configured: true, inserted: rows.length, keywords: ideas })
  } catch (err) {
    if (err instanceof DataForSeoSetupError) {
      return NextResponse.json({ configured: false, message: err.message })
    }
    console.log("[v0] seo keywords error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Errore nella ricerca keyword" }, { status: 500 })
  }
}
