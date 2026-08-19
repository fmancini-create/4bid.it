/**
 * Riallinea la campagna "Traffico aereo (Air Market)" GIA' IN VOLO al modello del
 * codice: nuovo corpo breve e i due oggetti della prova A/B (la 1 contro la 3).
 *
 * PERCHE' SERVE UNO SCRIPT: la campagna in banca dati contiene una COPIA del
 * corpo dell'email (`html_template`), scattata quando la campagna e' stata
 * creata. Modificare `lib/dem/air-market-template.ts` cambia solo cio' che verra'
 * usato per le campagne FUTURE: la campagna in corso continuerebbe a spedire il
 * vecchio testo di 152 parole. Un modello corretto nel codice e ignorato
 * dall'invio e' peggio di nessuna correzione, perche' sembra fatta.
 *
 * COSA SCRIVE:
 *   - `html_template`  -> il corpo nuovo (tre righe)
 *   - `subject`        -> OGGETTO_A (la proposta 1)
 *   - `subject_b`      -> OGGETTO_B (la proposta 3)
 *   - `subject_legacy` -> l'oggetto precedente, UNA SOLA VOLTA (vedi sotto)
 *
 * COSA NON TOCCA:
 *   - i destinatari GIA' spediti: le email partite non si richiamano indietro.
 *     Restano con `subject_variant = NULL`, cioe' "fuori dalla prova", ed e'
 *     giusto: sono state spedite in giorni diversi, con un corpo diverso.
 *   - `auto_send`: la campagna continua o resta ferma come e' adesso.
 *
 * Uso:
 *   npm run dem:air-market            -> PROVA A VUOTO, non scrive niente
 *   npm run dem:air-market -- --commit -> scrive davvero
 */
import pg from "pg"
import {
  AIR_MARKET_PRESET,
  OGGETTO_A,
  OGGETTO_B,
  OGGETTO_STORICO,
  PAGINA_AIR_MARKET,
} from "../lib/dem/air-market-template.ts"

const COMMIT = process.argv.includes("--commit")

// La campagna si individua per NOME, non per identificativo scritto a mano: un
// identificativo copiato a mano in uno script e' il modo classico per aggiornare
// la campagna sbagliata.
const NOME = "Santaddeo - Traffico aereo (Air Market)"

function paroleVisibili(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length
}

const client = new pg.Client({
  connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  const { rows } = await client.query(
    `select id, name, subject, subject_b, subject_legacy, html_template, auto_send,
       (select count(*) from dem_recipients r where r.campaign_id = c.id and r.send_status = 'sent') inviate,
       (select count(*) from dem_recipients r where r.campaign_id = c.id and r.send_status = 'pending') in_coda
     from dem_campaigns c where name = $1`,
    [NOME],
  )

  if (rows.length === 0) throw new Error(`Campagna "${NOME}" non trovata.`)
  if (rows.length > 1) throw new Error(`Trovate ${rows.length} campagne con lo stesso nome: fermo tutto.`)

  const c = rows[0]
  const nuovoHtml = AIR_MARKET_PRESET.html

  if (OGGETTO_A === OGGETTO_B) {
    throw new Error("OGGETTO_A e OGGETTO_B sono identici: confronterebbero un oggetto con se stesso.")
  }

  // L'oggetto storico si scrive UNA VOLTA SOLA.
  //
  // Rieseguendo lo script, `c.subject` vale gia' OGGETTO_A: copiarlo di nuovo in
  // `subject_legacy` cancellerebbe l'unica traccia dell'oggetto con cui sono
  // partite le prime 4.119 email, e il 15,15% misurato resterebbe senza etichetta.
  // Percio' si scrive solo se la colonna e' ancora vuota E l'oggetto attuale non
  // e' gia' una delle due varianti.
  const storicoDaScrivere =
    c.subject_legacy === null && c.subject !== OGGETTO_A && c.subject !== OGGETTO_B ? c.subject : null

  console.log(`\nCampagna: ${c.name}`)
  console.log(`  invio automatico: ${c.auto_send ? "ATTIVO" : "fermo"}`)
  console.log(`  già spedite: ${c.inviate}   in coda: ${c.in_coda}`)

  console.log(`\nCORPO EMAIL`)
  console.log(`  parole ora in volo: ${paroleVisibili(c.html_template)}`)
  console.log(`  parole nel nuovo:   ${paroleVisibili(nuovoHtml)}`)
  console.log(`  identico: ${c.html_template === nuovoHtml ? "SI (niente da fare)" : "NO"}`)

  const linkNuovi = [...new Set([...nuovoHtml.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]))]
  console.log(`  link nel nuovo corpo:`)
  for (const l of linkNuovi) console.log(`    - ${l}`)
  if (linkNuovi.includes("https://www.santaddeo.com/features")) {
    console.log(
      `  ATTENZIONE: il pulsante punta ancora alla pagina generica /features.\n` +
        `        Quando arriva l'indirizzo della pagina dedicata, cambiare\n` +
        `        PAGINA_AIR_MARKET in lib/dem/air-market-template.ts e rieseguire.`,
    )
  }

  console.log(`\nOGGETTI DELLA PROVA`)
  console.log(`  A ora:   ${c.subject}`)
  console.log(`  A nuovo: ${OGGETTO_A}`)
  console.log(`  B ora:   ${c.subject_b || "(nessuno: prova spenta)"}`)
  console.log(`  B nuovo: ${OGGETTO_B}`)
  console.log(`\nOGGETTO STORICO (sola lettura, per non perdere il 15,15% misurato)`)
  console.log(`  in banca dati: ${c.subject_legacy || "(vuoto)"}`)
  console.log(
    storicoDaScrivere
      ? `  da scrivere:   ${storicoDaScrivere}`
      : `  da scrivere:   niente (${c.subject_legacy ? "già presente" : "l'oggetto attuale è già una variante"})`,
  )
  if (storicoDaScrivere && storicoDaScrivere !== OGGETTO_STORICO) {
    console.log(
      `  NOTA: l'oggetto in volo non è quello che il codice si aspettava\n` +
        `        ("${OGGETTO_STORICO}"): si conserva quello VERO trovato in banca dati.`,
    )
  }

  if (!COMMIT) {
    console.log(`\nPROVA A VUOTO: nessuna scrittura. Aggiungere --commit per applicare.\n`)
    process.exit(0)
  }

  const campi = ["html_template = $2", "subject = $3", "subject_b = $4", "updated_at = now()"]
  const valori = [c.id, nuovoHtml, OGGETTO_A, OGGETTO_B]
  if (storicoDaScrivere) {
    campi.push(`subject_legacy = $${valori.length + 1}`)
    valori.push(storicoDaScrivere)
  }

  await client.query(`update dem_campaigns set ${campi.join(", ")} where id = $1`, valori)

  // Rilettura: si conferma sulla banca dati, non sull'esito del comando.
  const { rows: dopo } = await client.query(
    `select subject, subject_b, subject_legacy, html_template from dem_campaigns where id = $1`,
    [c.id],
  )
  const d = dopo[0]
  const ok =
    d.html_template === nuovoHtml &&
    d.subject === OGGETTO_A &&
    d.subject_b === OGGETTO_B &&
    (!storicoDaScrivere || d.subject_legacy === storicoDaScrivere)

  console.log(`\nSCRITTO. Verifica rileggendo: ${ok ? "OK" : "NON CORRISPONDE"}`)
  console.log(`  parole ora in volo: ${paroleVisibili(d.html_template)}`)
  console.log(`  oggetto A: ${d.subject}`)
  console.log(`  oggetto B: ${d.subject_b}`)
  console.log(`  storico:   ${d.subject_legacy || "(vuoto)"}\n`)
  if (!ok) process.exit(1)
} finally {
  await client.end()
}
