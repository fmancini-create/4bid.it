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

  // Catena di modelli con fallback: il primo (gpt-4o-mini) e' piu' economico e
  // meno soggetto al rate-limit del free tier; se un modello e' saturo si passa
  // al successivo. Un 429 sullo stesso modello viene ritentato una volta dopo
  // una breve attesa (i limiti free-tier sono a finestra breve e transitori).
  const MODELS = ["openai/gpt-4o-mini", "openai/gpt-4o", "google/gemini-2.5-flash"]
  const isRateLimit = (m: string) => /rate.?limit|429|quota|too many requests/i.test(m)
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  let parsed: Record<string, string> | null = null
  let lastError = ""
  let rateLimited = false

  outer: for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { text } = await generateText({ model, prompt, temperature: 0.4, maxOutputTokens: 900 })
        const start = text.indexOf("{")
        const end = text.lastIndexOf("}")
        if (start === -1 || end === -1) throw new Error("La risposta del modello non contiene JSON valido")
        parsed = JSON.parse(text.slice(start, end + 1))
        break outer
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        if (isRateLimit(lastError)) {
          rateLimited = true
          // Ritenta lo stesso modello una volta, poi passa al successivo.
          if (attempt === 0) {
            await sleep(1500)
            continue
          }
          break // prova il modello successivo
        }
        // Errore non da rate-limit (es. JSON invalido): prova il modello successivo.
        break
      }
    }
  }

  if (!parsed) {
    console.log("[v0] seo suggestion AI error:", lastError)
    return NextResponse.json(
      {
        error: rateLimited
          ? "I modelli AI sono momentaneamente saturi (limite free tier). Riprova tra qualche minuto."
          : "Generazione del suggerimento non riuscita.",
        detail: lastError,
      },
      { status: rateLimited ? 429 : 502 },
    )
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
