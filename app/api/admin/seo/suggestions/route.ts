import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** GET — elenco suggerimenti (più recenti prima), filtrabili per status. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const status = request.nextUrl.searchParams.get("status")
  const admin = createAdminClient()
  let q = admin.from("seo_suggestions").select("*").order("created_at", { ascending: false }).limit(200)
  if (status) q = q.eq("status", status)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ suggestions: data || [] })
}

/**
 * POST { pagePath, targetQuery, currentTitle?, impressions?, position? }
 * Genera una proposta di ottimizzazione SEO con l'AI, basata su una query REALE.
 * Regola ferrea: nessun dato/numero/claim inventato; ottimizza solo testo e struttura.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const pagePath: string = (body?.pagePath || "").trim()
  const targetQuery: string = (body?.targetQuery || "").trim()
  const currentTitle: string = (body?.currentTitle || "").trim()
  const impressions = Number(body?.impressions) || null
  const position = Number(body?.position) || null

  if (!pagePath || !targetQuery) {
    return NextResponse.json({ error: "pagePath e targetQuery sono richiesti" }, { status: 400 })
  }

  const prompt = `Sei un esperto SEO per 4BID, azienda italiana di revenue management e soluzioni tech per hotel.
Devi ottimizzare una pagina del sito per una query di ricerca REALE su cui sta già ricevendo impression.

Pagina: ${pagePath}
${currentTitle ? `Titolo attuale: "${currentTitle}"` : ""}
Query target (reale, da Google Search Console): "${targetQuery}"
${position ? `Posizione media attuale: ${position.toFixed(1)}` : ""}
${impressions ? `Impression nel periodo: ${impressions}` : ""}

Genera proposte in ITALIANO per migliorare il posizionamento su quella query.
REGOLE FERREE:
- NON inventare dati, numeri, percentuali, nomi di clienti, premi o statistiche. Ottimizza solo testo e struttura.
- Il title deve stare entro ~60 caratteri, la meta description entro ~155 caratteri.
- Tono professionale, orientato alla conversione, coerente con un'azienda B2B di revenue management.
- Il paragrafo aggiuntivo deve essere informativo e includere naturalmente la query, senza keyword stuffing.

Rispondi SOLO con un oggetto JSON valido (nessun testo extra, nessun markdown), con queste chiavi:
{
  "suggested_title": string,
  "suggested_description": string,
  "suggested_h1": string,
  "suggested_paragraph": string,
  "rationale": string
}`

  let parsed: Record<string, string> = {}
  try {
    const { text } = await generateText({ model: "openai/gpt-4o", prompt, temperature: 0.4 })
    const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
    parsed = JSON.parse(jsonStr)
  } catch (err) {
    console.log("[v0] seo suggestion AI error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Generazione del suggerimento non riuscita. Riprova." }, { status: 502 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("seo_suggestions")
    .insert({
      page_path: pagePath,
      target_query: targetQuery,
      current_title: currentTitle || null,
      suggested_title: parsed.suggested_title || null,
      suggested_description: parsed.suggested_description || null,
      suggested_h1: parsed.suggested_h1 || null,
      suggested_paragraph: parsed.suggested_paragraph || null,
      rationale: parsed.rationale || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ suggestion: data })
}
