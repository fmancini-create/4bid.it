import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  decidiFornitori,
  estraiSegnali,
  hostDiPrenotazioneSconosciuti,
  riconosci,
  type Firma,
  type Riscontro,
} from "@/lib/hospitality/providers"

// Quante strutture per lotto e quante in parallelo.
//
// Il committente ha chiesto "il massimo che la piattaforma regge", non "il
// massimo pensabile": il tetto vero non e' la nostra voglia di andare veloce,
// e' `maxDuration = 180`. Se il lotto sfora, la funzione viene uccisa a metà e
// le righe restano in `processing` — per questo esiste anche il recupero delle
// appese, ma e' una rete, non una scusa per sforare.
//
// Conto: 40 in parallelo x 12s di timeout peggiore = ~12s per ondata. Con 400
// per lotto sono 10 ondate, ~120s nel caso pessimo, dentro i 180 con margine.
export const CENSIMENTO_LOTTO = 400
const PARALLELE = 40
const TIMEOUT_FETCH_MS = 12_000

// Ci si ferma da soli PRIMA del limite della piattaforma: chiudere ordinatamente
// e lasciare il resto in coda e' meglio che essere interrotti a metà scrittura.
const TEMPO_MASSIMO_MS = 140_000

// Un sito puo' servire megabyte di HTML. Le firme stanno nei primi kilobyte
// (link, iframe, script nell'head): leggere tutto costa memoria e tempo senza
// aggiungere informazione.
const MAX_HTML_BYTES = 600_000

type RigaLotto = {
  property_id: string
  website_url: string
  website_host: string
  attempts: number
}

type EsitoStruttura = {
  property_id: string
  ok: boolean
  errore: string | null
  riscontri: Riscontro[]
  hostSconosciuti: string[]
  irraggiungibile: boolean
  // La pagina effettivamente scaricata (dopo i rimandi). Serve per l'URL di
  // esempio degli host sconosciuti: prima lo prendevo da `riscontri[0]`, che
  // per un host sconosciuto e' vuoto quasi per definizione -- infatti in
  // produzione tutti e 14 gli esempi erano stringa vuota, cioe' l'elenco dei
  // fornitori da valutare non diceva DOVE guardare.
  urlPagina: string
}

/**
 * Scarica una pagina con un tetto di tempo e di dimensione.
 *
 * `redirect: "follow"` e' voluto: moltissime strutture hanno il sito su un
 * dominio che rimanda altrove, e seguire il rimando e' esattamente cio' che
 * serve per trovare il vero motore di prenotazione.
 */
async function scarica(url: string): Promise<{ html: string; urlFinale: string } | { errore: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_FETCH_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Ci si dichiara. Un censimento che si traveste da browser per non
        // essere riconosciuto e' esattamente cio' che un gestore del sito ha
        // diritto di bloccare; qui c'e' un contatto per chiedere di smettere.
        "user-agent": "4bidBot/1.0 (censimento gestionali; https://www.4bid.it; info@4bid.it)",
        // `*/*;q=0.8` in coda NON e' decorazione: senza di esso alcuni server
        // rispondono `406 Not Acceptable` invece della pagina. Misurato su
        // colibrihotel.it, che il censimento dava per irraggiungibile mentre
        // `curl` con le intestazioni complete lo leggeva con un 200.
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "it-IT,it;q=0.9,en;q=0.8",
        // Alcuni server rifiutano (403) chi non dichiara di accettare la
        // compressione, perche' e' un tratto tipico degli automi grezzi.
        "accept-encoding": "gzip, deflate, br",
      },
    })

    if (!res.ok) return { errore: `HTTP ${res.status}` }

    const tipo = res.headers.get("content-type") || ""
    if (tipo && !/text\/html|application\/xhtml/i.test(tipo)) {
      return { errore: `tipo non HTML: ${tipo.slice(0, 40)}` }
    }

    const buf = await res.arrayBuffer()
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, MAX_HTML_BYTES))
    return { html, urlFinale: res.url || url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // `AbortError` va detto con parole sue: "troppo lento" e "sito rotto" sono
    // due cose diverse quando poi si guarda perche' una struttura non e' stata
    // rilevata.
    return { errore: /abort/i.test(msg) ? `timeout oltre ${TIMEOUT_FETCH_MS / 1000}s` : msg.slice(0, 200) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Il sito ci ha RIFIUTATO adesso, o non esiste?
 *
 * Estratta dal ciclo di scrittura di proposito: dentro il ciclo questa regola
 * non era verificabile senza database, e una regola che decide se un albergo
 * verra' mai piu' ritentato deve essere provabile da sola.
 *
 * `true`  => il sito c'e' ma non ha voluto parlare con noi: si ritenta.
 * `false` => non c'e' nulla da raggiungere (DNS morto, 404, 410): si archivia.
 */
export function eUnRifiutoTemporaneo(errore: string | null | undefined): boolean {
  const err = errore || ""
  // 401/403/405/406/409/423/425/429: protezioni anti-automi e limiti di banda.
  // 408 e 5xx: il server c'e' ma adesso non ce la fa.
  if (/HTTP (401|403|405|406|408|409|423|425|429|5\d\d)\b/.test(err)) return true
  // Lentezza non e' assenza: un sito lento oggi risponde domani.
  if (/timeout/i.test(err)) return true
  return false
}

async function esaminaStruttura(riga: RigaLotto, firme: Firma[]): Promise<EsitoStruttura> {
  const base: EsitoStruttura = {
    property_id: riga.property_id,
    ok: false,
    errore: null,
    riscontri: [],
    hostSconosciuti: [],
    irraggiungibile: false,
    urlPagina: riga.website_url,
  }

  const esito = await scarica(riga.website_url)
  if ("errore" in esito) {
    return { ...base, errore: esito.errore, irraggiungibile: true }
  }

  const segnali = estraiSegnali(esito.html, esito.urlFinale)
  const riscontri = riconosci(firme, segnali, esito.html, esito.urlFinale)
  const sconosciuti = hostDiPrenotazioneSconosciuti(segnali, riscontri, riga.website_host)

  return { ...base, ok: true, riscontri, hostSconosciuti: sconosciuti, urlPagina: esito.urlFinale }
}

export type EsitoLotto = {
  presi: number
  esaminati: number
  rilevati: number
  irraggiungibili: number
  hostSconosciuti: number
  appeseRecuperate: number
  fermatoPerTempo: boolean
}

export async function processaLottoCensimento(limite = CENSIMENTO_LOTTO): Promise<EsitoLotto> {
  const partenza = Date.now()
  const db = createAdminClient()

  // 1) Le righe rimaste appese da un'esecuzione uccisa a metà tornano in coda.
  //    Senza questo, ogni interruzione lascerebbe righe bloccate per sempre e la
  //    copertura si fermerebbe silenziosamente sotto il 100%.
  const { data: recuperate, error: errRec } = await db.rpc("censimento_recupera_appese", { p_minuti: 10 })
  if (errRec) throw new Error(`recupero appese: ${errRec.message}`)

  // 2) Le firme stanno nel DATABASE, non nel codice: aggiungere un gestionale
  //    non deve richiedere un rilascio.
  const { data: firme, error: errFirme } = await db
    .from("hospitality_provider_signatures")
    .select("slug,provider_name,technology_types,host_patterns,url_patterns,html_patterns,priority,enabled")
    .eq("enabled", true)
    .order("priority", { ascending: true })
  if (errFirme) throw new Error(`firme: ${errFirme.message}`)
  if (!firme || firme.length === 0) {
    // Un censimento senza firme marcherebbe TUTTO come "non rilevato",
    // cancellando dati buoni con un giro a vuoto. Meglio fermarsi.
    throw new Error("nessuna firma attiva: il rilevamento e' fermo, non 'nessun risultato'")
  }

  // 3) Prelievo atomico: le righe passano a `processing` dentro la stessa
  //    transazione, quindi due esecuzioni sovrapposte non lavorano le stesse.
  const { data: lotto, error: errLotto } = await db.rpc("censimento_prendi_lotto", {
    p_limit: limite,
    p_max_tent: 3,
  })
  if (errLotto) throw new Error(`prelievo lotto: ${errLotto.message}`)

  const righe = (lotto || []) as RigaLotto[]
  if (righe.length === 0) {
    await db.rpc("censimento_aggiorna_contatori")
    return {
      presi: 0,
      esaminati: 0,
      rilevati: 0,
      irraggiungibili: 0,
      hostSconosciuti: 0,
      appeseRecuperate: Number(recuperate ?? 0),
      fermatoPerTempo: false,
    }
  }

  // 4) Esame in parallelo a ondate, con freno sul tempo.
  let fermatoPerTempo = false
  const esiti: EsitoStruttura[] = []
  for (let i = 0; i < righe.length; i += PARALLELE) {
    if (Date.now() - partenza > TEMPO_MASSIMO_MS) {
      fermatoPerTempo = true
      break
    }
    const ondata = righe.slice(i, i + PARALLELE)
    esiti.push(...(await Promise.all(ondata.map((r) => esaminaStruttura(r, firme as Firma[])))))
  }

  // Le righe non esaminate (fermata per tempo) tornano in coda: lasciarle in
  // `processing` significherebbe aspettare il recupero delle appese senza motivo.
  const esaminatiIds = new Set(esiti.map((e) => e.property_id))
  const nonEsaminate = righe.filter((r) => !esaminatiIds.has(r.property_id))
  if (nonEsaminate.length > 0) {
    await db
      .from("hospitality_crawl_queue")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .in(
        "property_id",
        nonEsaminate.map((r) => r.property_id)
      )
  }

  // 5) Scrittura degli esiti.
  const adesso = new Date().toISOString()
  let rilevati = 0
  let irraggiungibili = 0
  const sconosciutiVisti: { host: string; url: string }[] = []

  for (const e of esiti) {
    if (e.irraggiungibile) {
      irraggiungibili++

      // "Ci ha RIFIUTATO" e "NON ESISTE" sono due cose diverse, e confonderle
      // costa strutture vere.
      //
      // Un 403/406/429 e un timeout dicono che il sito c'e' e non ha voluto
      // parlare con noi adesso: quasi sempre e' una protezione anti-automi o un
      // momento di carico. Marcandoli `failed` come un dominio inesistente,
      // quell'albergo non verrebbe MAI piu' ritentato e uscirebbe dal censimento
      // per sempre -- e' esattamente il caso di `palazzettopisani.com` e
      // `colibrihotel.it`, che rispondono 200 a una richiesta fatta meglio.
      //
      // Quindi: rifiuto => torna in coda per un nuovo tentativo; sito
      // irraggiungibile davvero (DNS che non risolve, 404, 410) => `failed`.
      const rifiuto = eUnRifiutoTemporaneo(e.errore)

      await db
        .from("hospitality_properties")
        .update({
          // Chi ci ha solo rifiutato resta `unknown`: dire "unreachable" di un
          // albergo il cui sito funziona e' un'informazione falsa, e questa
          // colonna decide chi entra nelle liste commerciali.
          technology_status: rifiuto ? "unknown" : "unreachable",
          last_crawled_at: adesso,
          updated_at: adesso,
        })
        .eq("id", e.property_id)

      await db
        .from("hospitality_crawl_queue")
        .update({
          status: rifiuto ? "pending" : "failed",
          last_error: e.errore,
          last_attempt_at: adesso,
          // Un rifiuto si ritenta piu' tardi, non subito: ripresentarsi entro
          // pochi minuti a chi ci ha appena respinto significa insistere.
          next_attempt_at: rifiuto ? new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() : null,
          updated_at: adesso,
        })
        .eq("property_id", e.property_id)
      continue
    }

    const fornitori = decidiFornitori(e.riscontri)
    if (fornitori.technology_status === "detected") rilevati++

    // Le rilevazioni sono uno STORICO: `is_current` marca quella valida adesso.
    // Prima si spengono le vecchie, poi si scrivono le nuove, altrimenti una
    // struttura che cambia gestionale resterebbe con due fornitori entrambi
    // "attuali" e il filtro DEM la conterebbe due volte.
    await db
      .from("hospitality_technology_detections")
      .update({ is_current: false })
      .eq("property_id", e.property_id)

    if (e.riscontri.length > 0) {
      const righeDet = e.riscontri.flatMap((r) =>
        r.technology_types.map((t) => ({
          property_id: e.property_id,
          technology_type: t,
          provider_name: r.provider_name,
          confidence: r.confidence,
          evidence_kind: r.evidence_kind,
          // Due colonne, due significati: `evidence_url` e' l'host/URL DEL
          // FORNITORE trovato, `source_url` la pagina della struttura dove
          // l'abbiamo trovato. Prima scrivevo la pagina in entrambe, quindi la
          // prova non era controllabile senza riscaricare l'HTML.
          evidence_url: r.evidence_url,
          source_url: r.source_url,
          evidence_excerpt: r.evidence_excerpt,
          raw_evidence: { slug: r.slug, kind: r.evidence_kind },
          is_current: true,
          first_detected_at: adesso,
          last_seen_at: adesso,
        }))
      )
      const { error: errDet } = await db
        .from("hospitality_technology_detections")
        .upsert(righeDet, { onConflict: "property_id,technology_type,provider_name,evidence_url" })
      if (errDet) console.log("[v0] censimento: scrittura rilevazioni fallita:", errDet.message)
    }

    await db
      .from("hospitality_properties")
      .update({
        booking_engine_provider: fornitori.booking_engine_provider,
        booking_engine_confidence: fornitori.booking_engine_confidence,
        pms_provider: fornitori.pms_provider,
        pms_confidence: fornitori.pms_confidence,
        channel_manager_provider: fornitori.channel_manager_provider,
        channel_manager_confidence: fornitori.channel_manager_confidence,
        technology_status: fornitori.technology_status,
        last_crawled_at: adesso,
        updated_at: adesso,
      })
      .eq("id", e.property_id)

    await db
      .from("hospitality_crawl_queue")
      .update({
        status: "completed",
        last_error: null,
        pages_checked: 1,
        technologies_found: e.riscontri.length,
        last_attempt_at: adesso,
        updated_at: adesso,
      })
      .eq("property_id", e.property_id)

    // La pagina dove l'host e' stato visto, NON `riscontri[0]`: per un host
    // sconosciuto i riscontri sono vuoti quasi per definizione, quindi l'esempio
    // era sempre stringa vuota e non si poteva andare a controllare.
    for (const h of e.hostSconosciuti) sconosciutiVisti.push({ host: h, url: e.urlPagina })
  }

  // 6) Host di prenotazione non riconosciuti: e' cosi' che l'elenco dei
  //    gestionali cresce invece di restare fermo a cio' che sapevamo oggi.
  for (const s of sconosciutiVisti) {
    const { error } = await db.rpc("censimento_registra_host_sconosciuto", { p_host: s.host, p_url: s.url })
    if (error) console.log("[v0] censimento: host sconosciuto non registrato:", error.message)
  }

  await db.rpc("censimento_aggiorna_contatori")

  return {
    presi: righe.length,
    esaminati: esiti.length,
    rilevati,
    irraggiungibili,
    hostSconosciuti: sconosciutiVisti.length,
    appeseRecuperate: Number(recuperate ?? 0),
    fermatoPerTempo,
  }
}
