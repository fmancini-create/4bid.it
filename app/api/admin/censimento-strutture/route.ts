import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { isSuperAdminEmail } from "@/lib/admin-config"

export const dynamic = "force-dynamic"

const PER_PAGINA = 50

async function authorize() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  if (!isSuperAdminEmail(user.email)) return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  return null
}

function pulisciRicerca(value: string | null): string {
  return (value || "")
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
}

export async function GET(request: NextRequest) {
  const negato = await authorize()
  if (negato) return negato

  const db = createAdminClient()
  const params = request.nextUrl.searchParams

  const fornitore = (params.get("fornitore") || "").slice(0, 80)
  const ricerca = pulisciRicerca(params.get("ricerca"))
  const pagina = Math.max(1, Number.parseInt(params.get("pagina") || "1", 10) || 1)

  // Il riepilogo arriva da una sola funzione in banca dati: se i conteggi li
  // ricalcolasse la pagina, la percentuale mostrata e i numeri della tabella
  // potrebbero divergere fra loro senza che nessuno se ne accorga.
  const { data: riepilogo, error: erroreRiepilogo } = await db.rpc("censimento_riepilogo")
  if (erroreRiepilogo) {
    console.log("[v0] censimento riepilogo errore:", erroreRiepilogo.message)
    return NextResponse.json({ error: "Impossibile leggere il riepilogo" }, { status: 500 })
  }

  // Quando si chiede UN fornitore, il collegamento deve essere interno
  // (`!inner`): cosi' il filtro entra nella query e vale su tutto il censimento.
  // Applicarlo dopo l'impaginazione filtrerebbe solo le 50 righe della pagina,
  // e "Blastness: 2" sarebbe il conteggio di una pagina spacciato per totale.
  const perFornitore = Boolean(fornitore) && !fornitore.startsWith("__")
  const collegamento = perFornitore
    ? "hospitality_technology_detections!inner(provider_name,technology_type,confidence,evidence_url)"
    : "hospitality_technology_detections(provider_name,technology_type,confidence,evidence_url)"

  let query = db
    .from("hospitality_properties")
    .select(`id,name,city,region,website_url,technology_status,last_crawled_at,${collegamento}`, { count: "exact" })
    // Solo le strutture DAVVERO esaminate: mostrare qui le 17.812 ancora da
    // fare significherebbe presentare pagine di righe vuote come se fossero
    // un esito del censimento.
    .not("last_crawled_at", "is", null)

  if (ricerca) query = query.or(`name.ilike.%${ricerca}%,city.ilike.%${ricerca}%,website_url.ilike.%${ricerca}%`)

  if (fornitore === "__nessuno__") {
    query = query.eq("technology_status", "unknown")
  } else if (fornitore === "__irraggiungibili__") {
    query = query.eq("technology_status", "unreachable")
  } else if (perFornitore) {
    query = query.eq("hospitality_technology_detections.provider_name", fornitore)
  }

  const da = (pagina - 1) * PER_PAGINA
  const { data, count, error } = await query
    // Ordine UNIVOCO: `last_crawled_at` da solo non basta, piu' strutture
    // vengono esaminate nello stesso istante e le righe a pari merito
    // cambierebbero posto fra una pagina e l'altra, comparendo due volte o
    // sparendo del tutto. L'`id` in coda rompe la parita'.
    .order("last_crawled_at", { ascending: false })
    .order("id", { ascending: true })
    .range(da, da + PER_PAGINA - 1)

  if (error) {
    console.log("[v0] censimento elenco errore:", error.message)
    return NextResponse.json({ error: "Impossibile leggere l'elenco" }, { status: 500 })
  }

  type Rilevamento = { provider_name: string; technology_type: string; confidence: number | null; evidence_url: string | null }

  const righe = (data || []).map((r) => {
    const rilevamenti = (r.hospitality_technology_detections || []) as Rilevamento[]
    return {
      id: r.id,
      nome: r.name,
      citta: r.city,
      regione: r.region,
      sito: r.website_url,
      stato: r.technology_status,
      esaminata_il: r.last_crawled_at,
      fornitori: rilevamenti.map((d) => ({
        nome: d.provider_name,
        tipo: d.technology_type,
        affidabilita: d.confidence,
        prova: d.evidence_url,
      })),
    }
  })

  return NextResponse.json({
    riepilogo,
    righe,
    pagina,
    per_pagina: PER_PAGINA,
    // Ora e' il totale vero del filtro applicato, non quello di una pagina:
    // il filtro per fornitore vive dentro la query.
    totale: count ?? 0,
  })
}
