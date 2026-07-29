// Crea la campagna in BOZZA del comunicato stampa e le aggancia la rubrica
// stampa esistente.
//
// PERCHE' PASSA DALLE ROUTE E NON SCRIVE NEL DATABASE: la route dei
// destinatari applica la deduplica e l'esclusione di chi si e' disiscritto o
// non e' raggiungibile. Sono gli stessi filtri che alimentano i conteggi in
// dashboard. Scrivendo a mano nella tabella si otterrebbe una logica parallela
// che col tempo divergerebbe, e soprattutto si rischierebbe di riscrivere a un
// indirizzo che ha chiesto di non essere piu' contattato.
//
// LA RUBRICA NON VIENE RICOSTRUITA: i 54 indirizzi vengono letti dalla campagna
// stampa del 31/05. Non esiste un valore "stampa" per tipo_contatto (il vincolo
// della tabella non lo prevede) e quei contatti hanno il campo vuoto: l'unico
// modo affidabile di ritrovarli e' seguire la campagna a cui sono agganciati.
// Ricompilare un elenco a mano significherebbe sbagliare qualche indirizzo.
//
// LO SCRIPT NON INVIA NULLA. Crea una bozza con auto_send spento. L'invio resta
// un gesto umano dalla dashboard, dopo aver completato il nome nella citazione.

const BASE = process.env.DEM_BASE_URL || "http://localhost:3000"

/** Indirizzo pubblico del PDF: vive nel `public/` di questo progetto (4bid.it). */
const URL_PDF = "https://www.4bid.it/comunicati/santaddeo-air-market-intelligence.pdf"

const NOME_CAMPAGNA = "Comunicato stampa - Air Market Intelligence (30/07/2026)"

/**
 * Nome con cui la campagna era stata creata la prima volta. La ricerca a riga 83
 * avviene PER NOME: senza questo elenco, cambiare la data avrebbe prodotto una
 * seconda bozza con altri 54 destinatari, lasciando la prima orfana in dashboard.
 */
const NOMI_PRECEDENTI = ["Comunicato stampa - Air Market Intelligence (29/07/2026)"]

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
  const { OGGETTO_COMUNICATO, htmlComunicatoStampa, NOME_FONDATORE } = await import(
    "../lib/dem/press-release-air-market"
  )

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // 1. Ritrova la rubrica stampa seguendo la campagna del 31/05.
  const { data: campagne } = await db
    .from("dem_campaigns")
    .select("id, name, created_at")
    .order("created_at", { ascending: true })

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
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rubrica.push(...(data as Destinatario[]))
    if (data.length < 1000) break
  }
  console.log(`  indirizzi in rubrica stampa: ${rubrica.length}`)

  // 2. Crea la campagna, se non esiste gia'. Rieseguire lo script non deve
  //    produrre una seconda bozza identica.
  const esistente = (campagne || []).find(
    (c) => c.name === NOME_CAMPAGNA || NOMI_PRECEDENTI.includes(c.name),
  )
  let campaignId: string
  if (esistente) {
    campaignId = esistente.id
    console.log(`  campagna gia' presente, la riuso: ${campaignId}`)
    if (esistente.name !== NOME_CAMPAGNA) {
      await db.from("dem_campaigns").update({ name: NOME_CAMPAGNA }).eq("id", campaignId)
      console.log(`  rinominata: "${esistente.name}" -> "${NOME_CAMPAGNA}"`)
    }
    // Il testo puo' essere stato corretto dopo la prima creazione: si aggiorna
    // SOLO se e' ancora una bozza mai partita, altrimenti si cambierebbe sotto
    // i piedi un invio in corso o concluso.
    const { data: stato } = await db
      .from("dem_campaigns")
      .select("status, sent_count")
      .eq("id", campaignId)
      .single()
    if (stato?.status === "draft" && (stato?.sent_count ?? 0) === 0) {
      await db
        .from("dem_campaigns")
        .update({ subject: OGGETTO_COMUNICATO, html_template: htmlComunicatoStampa(URL_PDF) })
        .eq("id", campaignId)
      console.log("  testo e oggetto aggiornati (bozza a 0 invii)")
    } else {
      console.log(`  NON aggiorno il testo: stato "${stato?.status}", ${stato?.sent_count} inviate`)
    }
  } else {
    const { campaign } = await chiama("/api/dem/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: NOME_CAMPAGNA,
        subject: OGGETTO_COMUNICATO,
        html_template: htmlComunicatoStampa(URL_PDF),
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
  const { data: finale } = await db
    .from("dem_campaigns")
    .select("name, status, auto_send, sent_count, failed_count, subject")
    .eq("id", campaignId)
    .single()
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

  const { count: inSospeso } = await db
    .from("dem_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .neq("send_status", "pending")
  // La colonna e' `send_status`, NON `status`: quest'ultima non esiste e una
  // query che la usa non torna "zero righe", va in errore. Il valore atteso qui
  // e' 1, non 0: l'utente ha inviato una prova a f.mancini@ibarronci.com il
  // 29/07. Un indirizzo gia' "sent" viene SALTATO dall'invio, quindi per rifare
  // la prova quella riga va riportata a "pending".
  console.log(`    non piu' in attesa (1 = prova dell'utente, atteso): ${inSospeso}`)

  // Controllo POSITIVO sulla firma: `dem_campaigns` conserva una COPIA dell'html,
  // quindi non basta che il nome sia giusto nel template, deve essere finito
  // dentro la riga salvata. Si verifica anche che non sia rimasto il vecchio
  // segnaposto, altrimenti una redazione riceverebbe "[[ DA COMPLETARE ]]".
  const htmlSalvato =
    (await db.from("dem_campaigns").select("html_template").eq("id", campaignId).single()).data
      ?.html_template ?? ""
  console.log(`    firma "${NOME_FONDATORE}" presente: ${htmlSalvato.includes(NOME_FONDATORE) ? "si" : "NO, DA CORREGGERE"}`)
  console.log(`    segnaposto residuo (deve essere no): ${htmlSalvato.includes("DA COMPLETARE") ? "SI, DA CORREGGERE" : "no"}`)

  // Le altre campagne non devono essere state toccate.
  console.log("")
  console.log("  === le altre campagne sono intatte ===")
  const { data: tutte } = await db
    .from("dem_campaigns")
    .select("id, name, status, sent_count")
    .order("created_at", { ascending: true })
  for (const c of tutte || []) {
    // Il conteggio va fatto con `count: "exact"`: una select normale si fermerebbe
    // a 1.000 righe e una campagna da 28.772 destinatari sembrerebbe da 1.000.
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
