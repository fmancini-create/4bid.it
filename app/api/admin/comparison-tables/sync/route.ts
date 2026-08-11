import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  COMPARISON_PRODUCTS,
  normalizeMasterTable,
  type ComparisonProduct,
} from "@/lib/quotes/comparison"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

/**
 * POST { product, source_url? }
 * Importa la tabella comparativa dall'endpoint del progetto prodotto e la
 * salva come master. Gancio "ibrido": finche' l'endpoint non esiste si continua
 * a usare la master gestita in admin; quando esistera', questa la sincronizza.
 *
 * L'endpoint del prodotto deve restituire un JSON con:
 * { title, headers: [{key,label,highlight?}], rows: [{label, cells:{...}}], footer_note }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const product = String(body?.product ?? "") as ComparisonProduct
  if (!COMPARISON_PRODUCTS.includes(product)) {
    return NextResponse.json({ error: "Prodotto non valido" }, { status: 400 })
  }

  const admin = createAdminClient()

  // URL: da body, altrimenti quello salvato sulla master.
  let sourceUrl = String(body?.source_url ?? "").trim()
  if (!sourceUrl) {
    const { data: existing } = await admin
      .from("product_comparison_tables")
      .select("source_url")
      .eq("product", product)
      .maybeSingle()
    sourceUrl = String(existing?.source_url ?? "").trim()
  }
  if (!sourceUrl) {
    return NextResponse.json(
      { error: "Nessun URL endpoint configurato per questo prodotto." },
      { status: 400 },
    )
  }

  // Scarica dall'endpoint prodotto (best-effort, con timeout).
  let payload: any
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(sourceUrl, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(t)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    payload = await res.json()
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: "Sincronizzazione non riuscita: endpoint non raggiungibile o risposta non valida.", detail },
      { status: 502 },
    )
  }

  const table = normalizeMasterTable(product, payload?.table ?? payload)
  if (!table.headers.length || !table.rows.length) {
    return NextResponse.json(
      { error: "L'endpoint non ha restituito una tabella valida (headers/rows mancanti)." },
      { status: 422 },
    )
  }

  const { error } = await admin.from("product_comparison_tables").upsert(
    {
      product,
      title: table.title,
      headers: table.headers,
      rows: table.rows,
      footer_note: table.footer_note,
      source_url: sourceUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product" },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, table })
}
