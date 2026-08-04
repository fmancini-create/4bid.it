import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import {
  classifica,
  dominioDi,
  dominioRiceveposta,
  SOGLIA_DOMINIO_SICURO,
  type StatoValidazione,
} from "@/lib/dem/validazione"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

// Giorni dopo i quali un controllo MX viene rifatto: un dominio puo' morire o
// tornare in vita, quindi la cache non e' eterna.
const VALIDITA_CACHE_GIORNI = 30

// Domini controllati in parallelo. Tenuto basso di proposito: una raffica di
// query DNS da un solo IP viene limitata dai resolver, e un rifiuto per
// eccesso di richieste sarebbe indistinguibile da "dominio morto".
const PARALLELISMO = 20

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) return null
  return user
}

/**
 * POST: valida gli indirizzi ancora da inviare di una campagna.
 *
 * NON invia nulla e NON rimuove nessuno: scrive solo un giudizio su ogni
 * destinatario, cosi' la decisione resta all'utente.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const campaignId = typeof body.campaignId === "string" ? body.campaignId : null
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId mancante" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1) La frequenza del dominio si calcola sull'INTERA lista della campagna,
  // inclusi gli indirizzi gia' inviati: e' una proprieta' della lista, non del
  // lotto. Paginato perche' PostgREST tronca a 1.000 righe per richiesta e un
  // troncamento silenzioso falserebbe tutte le frequenze verso il basso.
  const frequenza = new Map<string, number>()
  const PAGINA = 1000
  for (let da = 0; ; da += PAGINA) {
    const { data, error } = await supabase
      .from("dem_recipients")
      .select("email")
      .eq("campaign_id", campaignId)
      .order("id", { ascending: true })
      .range(da, da + PAGINA - 1)
    if (error) {
      return NextResponse.json({ error: `Lettura lista fallita: ${error.message}` }, { status: 500 })
    }
    for (const r of data || []) {
      const d = dominioDi(r.email || "")
      if (d) frequenza.set(d, (frequenza.get(d) || 0) + 1)
    }
    if (!data || data.length < PAGINA) break
  }

  if (frequenza.size === 0) {
    return NextResponse.json({ error: "Campagna senza destinatari" }, { status: 400 })
  }

  // 2) Destinatari ancora da inviare: sono i soli su cui la validazione cambia
  // qualcosa. Rivalutare i gia' inviati sarebbe lavoro senza effetto.
  const daValutare: { id: string; email: string }[] = []
  for (let da = 0; ; da += PAGINA) {
    const { data, error } = await supabase
      .from("dem_recipients")
      .select("id, email")
      .eq("campaign_id", campaignId)
      .eq("send_status", "pending")
      .order("id", { ascending: true })
      .range(da, da + PAGINA - 1)
    if (error) {
      return NextResponse.json({ error: `Lettura coda fallita: ${error.message}` }, { status: 500 })
    }
    for (const r of data || []) if (r.email) daValutare.push({ id: r.id, email: r.email })
    if (!data || data.length < PAGINA) break
  }

  // 3) Domini da controllare, con cache. Il controllo DNS e' la parte lenta:
  // 27.000 indirizzi stanno su poche migliaia di domini distinti.
  const dominiInCoda = new Set<string>()
  for (const r of daValutare) {
    const d = dominioDi(r.email)
    if (d) dominiInCoda.add(d)
  }

  const esitoMx = new Map<string, boolean | null>()
  const limite = new Date(Date.now() - VALIDITA_CACHE_GIORNI * 86400_000).toISOString()
  const elenco = Array.from(dominiInCoda)

  for (let i = 0; i < elenco.length; i += PAGINA) {
    const { data } = await supabase
      .from("dem_domain_checks")
      .select("domain, has_mx, checked_at")
      .in("domain", elenco.slice(i, i + PAGINA))
      .gte("checked_at", limite)
    for (const c of data || []) {
      if (c.has_mx !== null) esitoMx.set(c.domain, c.has_mx)
    }
  }

  const daControllare = elenco.filter((d) => !esitoMx.has(d))
  let erroriRete = 0

  for (let i = 0; i < daControllare.length; i += PARALLELISMO) {
    const lotto = daControllare.slice(i, i + PARALLELISMO)
    const esiti = await Promise.all(
      lotto.map(async (d) => ({ dominio: d, ...(await dominioRiceveposta(d)) })),
    )
    const daSalvare: { domain: string; has_mx: boolean | null; check_error: string | null; checked_at: string }[] = []
    for (const e of esiti) {
      esitoMx.set(e.dominio, e.haMx)
      if (e.haMx === null) erroriRete++
      daSalvare.push({
        domain: e.dominio,
        has_mx: e.haMx,
        check_error: e.errore,
        checked_at: new Date().toISOString(),
      })
    }
    const { error } = await supabase.from("dem_domain_checks").upsert(daSalvare, { onConflict: "domain" })
    if (error) console.error("[v0] dem/validate: salvataggio controlli dominio fallito:", error.message)
  }

  // 4) Classificazione e salvataggio.
  const conteggio: Record<StatoValidazione, number> = {
    "dominio-morto": 0,
    "rischio-alto": 0,
    sicuro: 0,
    "non-verificato": 0,
  }
  const adesso = new Date().toISOString()
  const perStato = new Map<StatoValidazione, { ids: string[]; freq: Map<string, number> }>()

  for (const r of daValutare) {
    const d = dominioDi(r.email)
    if (!d) {
      conteggio["dominio-morto"]++
      continue
    }
    const freq = frequenza.get(d) || 1
    const stato = classifica(r.email, freq, esitoMx.get(d) ?? null)
    conteggio[stato]++
    if (!perStato.has(stato)) perStato.set(stato, { ids: [], freq: new Map() })
    const g = perStato.get(stato)!
    g.ids.push(r.id)
    g.freq.set(r.id, freq)
  }

  // Scrittura a lotti: un aggiornamento per riga su 27.000 righe non finirebbe
  // entro il tempo massimo della funzione.
  for (const [stato, gruppo] of perStato) {
    for (let i = 0; i < gruppo.ids.length; i += 500) {
      const fetta = gruppo.ids.slice(i, i + 500)
      const { error } = await supabase
        .from("dem_recipients")
        .update({ validation_status: stato, validation_checked_at: adesso })
        .in("id", fetta)
      if (error) console.error(`[v0] dem/validate: aggiornamento ${stato} fallito:`, error.message)
    }
  }

  // `domain_addresses` serve a spiegare in pagina PERCHE' un indirizzo e'
  // classificato cosi', senza ricalcolare le frequenze a ogni lettura.
  for (const [, gruppo] of perStato) {
    const perFrequenza = new Map<number, string[]>()
    for (const [id, freq] of gruppo.freq) {
      if (!perFrequenza.has(freq)) perFrequenza.set(freq, [])
      perFrequenza.get(freq)!.push(id)
    }
    for (const [freq, ids] of perFrequenza) {
      for (let i = 0; i < ids.length; i += 500) {
        await supabase
          .from("dem_recipients")
          .update({ domain_addresses: freq })
          .in("id", ids.slice(i, i + 500))
      }
    }
  }

  const totale = daValutare.length
  const pct = (n: number) => (totale > 0 ? Number(((n / totale) * 100).toFixed(1)) : 0)

  return NextResponse.json({
    ok: true,
    sogliaDominioSicuro: SOGLIA_DOMINIO_SICURO,
    inCoda: totale,
    dominiDistinti: dominiInCoda.size,
    dominiControllatiAdesso: daControllare.length,
    dominiDaCache: dominiInCoda.size - daControllare.length,
    erroriRete,
    esiti: {
      sicuro: conteggio.sicuro,
      rischioAlto: conteggio["rischio-alto"],
      dominioMorto: conteggio["dominio-morto"],
      nonVerificato: conteggio["non-verificato"],
    },
    percentuali: {
      sicuro: pct(conteggio.sicuro),
      rischioAlto: pct(conteggio["rischio-alto"]),
      dominioMorto: pct(conteggio["dominio-morto"]),
      nonVerificato: pct(conteggio["non-verificato"]),
    },
  })
}
