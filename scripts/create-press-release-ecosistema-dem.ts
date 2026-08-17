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
// LA RUBRICA NON VIENE RICOSTRUITA: gli indirizzi vengono letti dalla PRIMA
// campagna stampa (31/05, "Comunicato stampa - Lancio Santaddeo"). Non esiste un
// valore "stampa" per tipo_contatto (il vincolo della tabella ammette solo
// potenziale/cliente/collaboratore) e quei contatti hanno il campo vuoto: l'unico
// modo affidabile di ritrovarli e' seguire la campagna a cui sono agganciati.
//
// LO SCRIPT NON INVIA NULLA. Crea una bozza con auto_send spento. L'invio resta
// un gesto umano dalla dashboard.

const BASE = process.env.DEM_BASE_URL || "http://localhost:3000"

type Destinatario = {
  email: string
  nome: string | null
  cognome: string | null
  nome_azienda: string | null
}

async function chiama(percorso: string, opzioni?: RequestInit) {
  const r = await fetch(`${BASE}${percorso}`, opzioni)
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

  const stampaPrecedente = (campagne || []).find((c) =>
    /comunicato|stampa|press/i.test(c.name || ""),
  )
  if (!stampaPrecedente) {
    throw new Error("Campagna stampa precedente non trovata: impossibile riusare la rubrica")
  }
  console.log(`  rubrica letta da: "${stampaPrecedente.name}"`)

  const rubrica: Destinatario[] = []
  for (let da = 0; ; da += 1000) {
    const { data, error } = await db
      .from("dem_recipients")
      .select("email, nome, cognome, nome_azienda")
      .eq("campaign_id", stampaPrecedente.id)
      .range(da, da + 999)
    // Sempre leggere `error`: una query su una colonna inesistente non torna
    // "zero righe", va in errore, e ignorarlo stamperebbe "nessun destinatario"
    // mentre in realta' la rubrica non e' stata nemmeno interrogata.
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rubrica.push(...(data as Destinatario[]))
    if (data.length < 1000) break
  }
  console.log(`  indirizzi in rubrica stampa: ${rubrica.length}`)
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
  }).catch((e) => ({ errore: e instanceof Error ? e.message : String(e) }))
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

  const { count: destinatari } = await db
    .from("dem_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
  console.log(`    destinatari: ${destinatari}`)

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
    // I segnaposto del nome NON devono comparire: 30 dei 54 indirizzi sono
    // redazioni generiche senza nome di persona e la sostituzione lascerebbe
    // "Gentile ,".
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
