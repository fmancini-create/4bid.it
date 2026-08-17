// Crea la campagna in BOZZA del comunicato stampa sull'ecosistema 4 BID e le
// aggancia la rubrica stampa esistente.
//
// PERCHE' PASSA DALLE ROUTE E NON SCRIVE NEL DATABASE: la route dei destinatari
// applica la deduplica e l'esclusione di chi si e' disiscritto o non e'
// raggiungibile. Sono gli stessi filtri che alimentano i conteggi in dashboard.
// Scrivendo a mano nella tabella si otterrebbe una logica parallela che col tempo
// divergerebbe, e soprattutto si rischierebbe di riscrivere a un indirizzo che ha
// chiesto di non essere piu' contattato.
//
// LA RUBRICA NON VIENE RICOSTRUITA: gli indirizzi vengono letti dalle campagne
// stampa precedenti, prendendone l'UNIONE. Non esiste un valore "stampa" per
// tipo_contatto (il vincolo della tabella ammette solo
// potenziale/cliente/collaboratore) e quei contatti hanno il campo vuoto: l'unico
// modo affidabile di ritrovarli e' seguire le campagne a cui sono agganciati.
//
// LO SCRIPT NON INVIA NULLA. Crea una bozza con auto_send spento. L'invio resta
// un gesto umano dalla dashboard.

// Rende il file un MODULO. Senza questa riga TypeScript lo tratta come script
// globale e i suoi nomi finiscono nello stesso spazio di
// scripts/create-press-release-dem.ts, che dichiara anch'esso `BASE`,
// `Destinatario` e `chiama`: misurato, 4 errori TS2451/TS2300/TS2393.
export {}

const BASE = process.env.DEM_BASE_URL || "http://localhost:3000"

type Destinatario = {
  email: string
  nome: string | null
  cognome: string | null
  nome_azienda: string | null
}

/**
 * Chiama una rotta DEM autenticandosi come chiamata automatica.
 *
 * PERCHE' SERVE L'INTESTAZIONE: dal 03/08/2026 ogni rotta sotto /api/dem/ passa
 * da `rifiutaSeNonAutorizzato`, che accetta due sole vie - `Bearer CRON_SECRET`
 * oppure la sessione del super admin. Uno script non ha cookie di sessione:
 * senza il segreto ogni chiamata torna 401 e nessuna campagna verrebbe creata.
 * Misurato: `GET /api/dem/campaigns` senza intestazione -> 401.
 */
async function chiama(percorso: string, opzioni: RequestInit = {}) {
  const segreto = process.env.CRON_SECRET
  if (!segreto) {
    throw new Error(
      "CRON_SECRET assente: le rotte DEM risponderebbero 401. " +
        "Esegui con: set -a && source /vercel/share/.env.project && set +a",
    )
  }
  const r = await fetch(`${BASE}${percorso}`, {
    ...opzioni,
    headers: { ...(opzioni.headers || {}), Authorization: `Bearer ${segreto}` },
  })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${percorso} -> ${r.status}: ${JSON.stringify(corpo).slice(0, 300)}`)
  return corpo
}

async function main() {
  const { createClient } = await import("@supabase/supabase-js")
  const {
    OGGETTO_COMUNICATO_ECOSISTEMA,
    NOME_CAMPAGNA_ECOSISTEMA,
    PERCORSO_PDF_ECOSISTEMA,
    htmlComunicatoEcosistema,
  } = await import("../lib/dem/press-release-ecosistema")

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const html = htmlComunicatoEcosistema()

  // 1. Ritrova la rubrica stampa seguendo la PRIMA campagna stampa in ordine di
  //    creazione: e' quella che contiene la rubrica originale delle redazioni.
  const { data: campagne, error: erroreCampagne } = await db
    .from("dem_campaigns")
    .select("id, name, created_at")
    .order("created_at", { ascending: true })
  if (erroreCampagne) throw new Error(erroreCampagne.message)

  // Si prende l'UNIONE di tutte le campagne stampa, non solo la prima: se un
  // indirizzo fosse stato aggiunto a mano in un comunicato successivo, leggendo
  // una sola campagna resterebbe fuori senza che nulla lo segnali. Misurato oggi
  // le due campagne stampa contengono gli stessi 54 indirizzi, quindi l'unione
  // non cambia il risultato: cambia il comportamento futuro.
  const campagneStampa = (campagne || []).filter((c) =>
    /comunicato|stampa|press/i.test(c.name || ""),
  )
  if (campagneStampa.length === 0) {
    throw new Error("Nessuna campagna stampa precedente: impossibile riusare la rubrica")
  }

  const perEmail = new Map<string, Destinatario>()
  for (const c of campagneStampa) {
    if (c.name === NOME_CAMPAGNA_ECOSISTEMA) continue // e' quella che stiamo creando
    let letti = 0
    for (let da = 0; ; da += 1000) {
      const { data, error } = await db
        .from("dem_recipients")
        .select("email, nome, cognome, nome_azienda")
        .eq("campaign_id", c.id)
        .range(da, da + 999)
      // Sempre leggere `error`: una query su una colonna inesistente non torna
      // "zero righe", va in errore, e ignorarlo stamperebbe "nessun destinatario"
      // mentre in realta' la rubrica non e' stata nemmeno interrogata.
      if (error) throw new Error(error.message)
      if (!data || data.length === 0) break
      for (const r of data as Destinatario[]) {
        const chiave = r.email.trim().toLowerCase()
        const gia = perEmail.get(chiave)
        // Il nome, dove esiste, non va perso: solo 5 dei 54 indirizzi hanno un
        // nome di persona, gli altri sono redazioni generiche.
        if (!gia) perEmail.set(chiave, r)
        else if (!gia.nome && r.nome) perEmail.set(chiave, r)
      }
      letti += data.length
      if (data.length < 1000) break
    }
    console.log(`  rubrica da "${c.name}": ${letti} righe`)
  }

  const rubrica: Destinatario[] = [...perEmail.values()]
  console.log(`  indirizzi distinti in rubrica stampa: ${rubrica.length}`)
  if (rubrica.length === 0) throw new Error("rubrica vuota: non si crea una campagna senza destinatari")

  // 2. Crea la campagna, se non esiste gia'. Rieseguire lo script non deve
  //    produrre una seconda bozza identica: la ricerca e' PER NOME, e il nome
  //    contiene la data, quindi cambiare la data del comunicato creerebbe una
  //    nuova bozza lasciando la prima orfana. Se un giorno la data cambia, il
  //    nome vecchio va aggiunto qui e la campagna viene RINOMINATA in luogo.
  const NOMI_PRECEDENTI: string[] = []
  const esistente = (campagne || []).find(
    (c) => c.name === NOME_CAMPAGNA_ECOSISTEMA || NOMI_PRECEDENTI.includes(c.name),
  )

  let campaignId: string
  if (esistente) {
    campaignId = esistente.id
    console.log(`  campagna gia' presente, la riuso: ${campaignId}`)
    if (esistente.name !== NOME_CAMPAGNA_ECOSISTEMA) {
      await db
        .from("dem_campaigns")
        .update({ name: NOME_CAMPAGNA_ECOSISTEMA })
        .eq("id", campaignId)
      console.log(`  rinominata: "${esistente.name}" -> "${NOME_CAMPAGNA_ECOSISTEMA}"`)
    }
    // Il testo puo' essere stato corretto dopo la prima creazione: si aggiorna
    // SOLO se e' ancora una bozza mai partita, altrimenti si cambierebbe sotto i
    // piedi un invio in corso o concluso.
    const { data: stato, error: erroreStato } = await db
      .from("dem_campaigns")
      .select("status, sent_count")
      .eq("id", campaignId)
      .single()
    if (erroreStato) throw new Error(erroreStato.message)
    if (stato?.status === "draft" && (stato?.sent_count ?? 0) === 0) {
      const { error: erroreUpdate } = await db
        .from("dem_campaigns")
        .update({ subject: OGGETTO_COMUNICATO_ECOSISTEMA, html_template: html })
        .eq("id", campaignId)
      if (erroreUpdate) throw new Error(erroreUpdate.message)
      console.log("  testo e oggetto aggiornati (bozza a 0 invii)")
    } else {
      console.log(`  NON aggiorno il testo: stato "${stato?.status}", ${stato?.sent_count} inviate`)
    }
  } else {
    const { campaign } = await chiama("/api/dem/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: NOME_CAMPAGNA_ECOSISTEMA,
        subject: OGGETTO_COMUNICATO_ECOSISTEMA,
        html_template: html,
        track_opens: true,
        track_clicks: true,
      }),
    })
    campaignId = campaign.id
    console.log(`  campagna creata: ${campaignId}`)
  }

  // 3. Aggancia la rubrica. La route scarta duplicati e disiscritti.
  const esito = await chiama("/api/dem/recipients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id: campaignId,
      recipients: rubrica.map((r) => ({
        email: r.email,
        nome: r.nome,
        cognome: r.cognome,
        nome_azienda: r.nome_azienda,
      })),
    }),
  }).catch((e) => {
    const messaggio = e instanceof Error ? e.message : String(e)
    // Rieseguendo lo script la rotta risponde 400 "Nessun destinatario da
    // aggiungere": e' l'esito NORMALE, sono tutti duplicati. Non va confuso con
    // un caricamento fallito, che invece deve fermare lo script. Il conteggio
    // finale dei destinatari resta comunque il giudice.
    if (/Nessun destinatario da aggiungere|Nessun nuovo destinatario/.test(messaggio)) {
      return { nulla_da_aggiungere: "rubrica gia' agganciata (riesecuzione)" }
    }
    throw new Error(`aggancio destinatari fallito: ${messaggio}`)
  })
  console.log(`  aggancio destinatari: ${JSON.stringify(esito).slice(0, 220)}`)

  // 4. Verifiche finali.
  console.log("")
  console.log("  === stato finale ===")
  const { data: finale, error: erroreFinale } = await db
    .from("dem_campaigns")
    .select("name, status, auto_send, sent_count, failed_count, subject, html_template")
    .eq("id", campaignId)
    .single()
  if (erroreFinale) throw new Error(erroreFinale.message)
  console.log(`    stato:      ${finale?.status}`)
  console.log(`    auto_send:  ${finale?.auto_send}`)
  console.log(`    inviate:    ${finale?.sent_count}`)
  console.log(`    fallite:    ${finale?.failed_count}`)
  console.log(`    oggetto:    ${finale?.subject} (${finale?.subject?.length} caratteri)`)

  const { count: destinatari, error: erroreConteggio } = await db
    .from("dem_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
  if (erroreConteggio) throw new Error(erroreConteggio.message)

  // Il numero atteso si CALCOLA, non si scrive a mano: rubrica meno chi non va
  // piu' contattato. Cosi' se domani un indirizzo rimbalza il controllo resta
  // valido, e se invece qualcuno spegnesse il filtro dei soppressi il confronto
  // andrebbe in rosso.
  const soppressi = new Set<string>()
  for (const tabella of ["dem_unsubscribes", "dem_recipients"] as const) {
    const q =
      tabella === "dem_unsubscribes"
        ? db.from(tabella).select("email")
        : db.from(tabella).select("email").in("send_status", ["bounced", "complained", "unsubscribed"])
    const { data, error } = await q
    if (error) throw new Error(error.message)
    for (const r of data || []) if (r.email) soppressi.add(String(r.email).trim().toLowerCase())
  }
  const attesi = rubrica.filter((r) => !soppressi.has(r.email.trim().toLowerCase())).length
  console.log(
    `    destinatari: ${destinatari} (attesi ${attesi} = ${rubrica.length} in rubrica ` +
      `- ${rubrica.length - attesi} fra disiscritti e non recapitabili) ` +
      `${destinatari === attesi ? "ok" : "DISCORDANTE"}`,
  )

  // La colonna e' `send_status`, NON `status`: quest'ultima non esiste su
  // dem_recipients e una query che la usa va in errore invece di tornare zero.
  const { count: nonInAttesa, error: erroreAttesa } = await db
    .from("dem_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .neq("send_status", "pending")
  if (erroreAttesa) throw new Error(erroreAttesa.message)
  console.log(`    non piu' in attesa (atteso 0): ${nonInAttesa}`)

  // Controlli POSITIVI sulla copia salvata: `dem_campaigns` conserva una COPIA
  // dell'html, quindi non basta che il template sia giusto nel codice.
  const htmlSalvato = finale?.html_template ?? ""
  const controlli: Array<[string, boolean]> = [
    ["marcatore dell'allegato PDF", htmlSalvato.includes(`ATTACH:${PERCORSO_PDF_ECOSISTEMA}`)],
    ["collegamento di disiscrizione", htmlSalvato.includes("{{unsubscribe}}")],
    ["titolo del comunicato", htmlSalvato.includes("quattro software italiani")],
    ["tutti e quattro i prodotti", ["Santaddeo", "Hotel Accelerator", "ManuBot", "Hotel Profit AI"].every((p) => htmlSalvato.includes(p))],
    ["nessun asterisco di enfasi rimasto", !htmlSalvato.includes("**")],
    // I segnaposto del nome NON devono comparire: verificato sui dati veri, solo
    // 5 dei 54 indirizzi stampa hanno un nome di persona. Sui restanti 49 la
    // sostituzione lascerebbe "Gentile ,".
    ["nessun segnaposto {{nome}}", !/\{\{\s*(nome|cognome|nome_azienda)\s*\}\}/i.test(htmlSalvato)],
  ]
  for (const [che, esito] of controlli) {
    console.log(`    ${esito ? "ok " : "NO "} ${che}`)
  }

  // Il PDF allegato deve esistere davvero: l'invio lo scarica dal sito, e un
  // marcatore che punta a un file assente manda l'email senza allegato.
  const { access } = await import("node:fs/promises")
  await access(`public${PERCORSO_PDF_ECOSISTEMA}`)
    .then(() => console.log(`    ok  PDF presente in public${PERCORSO_PDF_ECOSISTEMA}`))
    .catch(() => console.log(`    NO  PDF MANCANTE: public${PERCORSO_PDF_ECOSISTEMA}`))

  // === PRONTI PER L'INVIO? Si guarda la PRODUZIONE, non il disco locale. ===
  //
  // PERCHE' QUESTO CONTROLLO ESISTE: ne' l'allegato ne' il logo viaggiano dentro
  // l'email. `fetchAttachment` in /api/dem/send SCARICA il PDF da
  // NEXT_PUBLIC_SITE_URL e, se la risposta non e' 200, scrive una riga in console
  // e restituisce `null`: l'email parte comunque, SENZA allegato, e la campagna
  // risulta "inviata". Il logo lo scarica il client di posta del giornalista.
  // Avere i file in `public/` non basta: valgono solo dopo la pubblicazione del
  // sito, e qui la produzione resta indietro rispetto al codice.
  const sito = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it").replace(/\/$/, "")
  const daControllare = [
    { che: "PDF allegato", url: `${sito}${PERCORSO_PDF_ECOSISTEMA}` },
    ...[...htmlSalvato.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/gi)]
      .map((m) => m[1])
      .filter((u, i, a) => a.indexOf(u) === i)
      .map((url) => ({ che: "immagine nell'email", url })),
  ]

  console.log("")
  console.log(`  === raggiungibili sul sito pubblicato (${sito}) ===`)
  let mancanti = 0
  for (const { che, url } of daControllare) {
    const esito = await fetch(url, { method: "GET" })
      .then((r) => `${r.status} ${r.headers.get("content-type") || "?"}`)
      .catch((e) => `non raggiungibile (${e instanceof Error ? e.message : e})`)
    const ok = esito.startsWith("200")
    if (!ok) mancanti++
    console.log(`    ${ok ? "ok " : "NO "} ${che}: ${url} -> ${esito}`)
  }
  if (mancanti > 0) {
    console.log("")
    console.log(
      `    ATTENZIONE: ${mancanti} file non ancora pubblicati. Inviando ora, il PDF` +
        " arriverebbe come allegato MANCANTE (in silenzio) e il logo come immagine" +
        " rotta. Pubblicare il sito PRIMA di inviare.",
    )
  }

  // Le altre campagne non devono essere state toccate.
  console.log("")
  console.log("  === le altre campagne sono intatte ===")
  const { data: tutte } = await db
    .from("dem_campaigns")
    .select("id, name, status, sent_count")
    .order("created_at", { ascending: true })
  for (const c of tutte || []) {
    // Con `count: "exact"`: una select normale si fermerebbe a 1.000 righe e una
    // campagna da 28.772 destinatari sembrerebbe da 1.000.
    const { count } = await db
      .from("dem_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id as string)
    console.log(
      `    ${String(c.status).padEnd(9)} inviate ${String(c.sent_count).padStart(6)}` +
        `  destinatari ${String(count).padStart(6)}  ${c.name}`,
    )
  }
}

main().catch((e) => {
  console.error("  ERRORE:", e instanceof Error ? e.message : e)
  process.exit(1)
})
