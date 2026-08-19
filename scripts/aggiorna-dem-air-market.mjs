/**
 * Riallinea la campagna "Traffico aereo (Air Market)" GIA' IN VOLO al modello del
 * codice, e imposta l'oggetto B della prova A/B.
 *
 * PERCHE' SERVE UNO SCRIPT: la campagna in banca dati contiene una COPIA del
 * corpo dell'email (`html_template`), scattata quando la campagna e' stata
 * creata. Modificare `lib/dem/air-market-template.ts` cambia solo cio' che verra'
 * usato per le campagne FUTURE: la campagna in corso continuerebbe a spedire il
 * vecchio testo di 152 parole. Un modello corretto nel codice e ignorato
 * dall'invio e' peggio di nessuna correzione, perche' sembra fatta.
 *
 * COSA NON TOCCA:
 *   - `subject` (l'oggetto A): apre al 15,15%, meglio del riferimento; resta come
 *     termine di paragone della prova.
 *   - i destinatari GIA' spediti: le email partite non si richiamano indietro.
 *     Restano con `subject_variant = NULL`, cioe' "fuori dalla prova", ed e'
 *     giusto: sono state spedite in giorni diversi, con un testo diverso.
 *   - `auto_send`: la campagna continua o resta ferma come e' adesso.
 *
 * Uso:
 *   node --experimental-strip-types --import ./scripts/registra-hook-ts.mjs \
 *     --env-file-if-exists=/vercel/share/.env.project \
 *     scripts/aggiorna-dem-air-market.mjs
 *       -> PROVA A VUOTO: mostra cosa cambierebbe, non scrive niente
 *
 *   ...stesso comando... --commit --oggetto-b="Il volo è prenotato. La camera no."
 *       -> scrive davvero
 */
import pg from "pg"
import { AIR_MARKET_PRESET, PAGINA_AIR_MARKET, OGGETTI_ALTERNATIVI } from "../lib/dem/air-market-template.ts"

const COMMIT = process.argv.includes("--commit")
const argOggettoB = process.argv.find((a) => a.startsWith("--oggetto-b="))
const OGGETTO_B = argOggettoB ? argOggettoB.slice("--oggetto-b=".length).trim() : null

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
    `select id, name, subject, subject_b, html_template, auto_send,
       (select count(*) from dem_recipients r where r.campaign_id = c.id and r.send_status = 'sent') inviate,
       (select count(*) from dem_recipients r where r.campaign_id = c.id and r.send_status = 'pending') in_coda
     from dem_campaigns c where name = $1`,
    [NOME],
  )

  if (rows.length === 0) throw new Error(`Campagna "${NOME}" non trovata.`)
  if (rows.length > 1) throw new Error(`Trovate ${rows.length} campagne con lo stesso nome: fermo tutto.`)

  const c = rows[0]
  const nuovoHtml = AIR_MARKET_PRESET.html

  console.log(`\nCampagna: ${c.name}`)
  console.log(`  invio automatico: ${c.auto_send ? "ATTIVO" : "fermo"}`)
  console.log(`  già spedite: ${c.inviate}   in coda: ${c.in_coda}`)
  console.log(`\nCORPO EMAIL`)
  console.log(`  parole ora in volo: ${paroleVisibili(c.html_template)}`)
  console.log(`  parole nel nuovo:   ${paroleVisibili(nuovoHtml)}`)
  console.log(`  identico: ${c.html_template === nuovoHtml ? "SI (niente da fare)" : "NO"}`)

  const linkNuovi = [...nuovoHtml.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1])
  console.log(`  link nel nuovo corpo:`)
  for (const l of [...new Set(linkNuovi)]) console.log(`    - ${l}`)
  if (linkNuovi.some((l) => l === "https://www.santaddeo.com/features")) {
    console.log(
      `  NOTA: il pulsante punta ancora alla pagina generica /features.\n` +
        `        Quando arriva l'indirizzo della pagina dedicata, cambiare\n` +
        `        PAGINA_AIR_MARKET in lib/dem/air-market-template.ts e rieseguire.`,
    )
  }

  console.log(`\nOGGETTO`)
  console.log(`  A (non si tocca): ${c.subject}`)
  console.log(`  B ora:            ${c.subject_b || "(nessuno: prova spenta)"}`)
  if (OGGETTO_B) {
    console.log(`  B nuovo:          ${OGGETTO_B}`)
    if (OGGETTO_B === c.subject) {
      throw new Error("L'oggetto B è identico ad A: confronterebbe un oggetto con se stesso. Fermo tutto.")
    }
  } else {
    console.log(`  (nessun --oggetto-b=... passato: la prova resta come sta)`)
    console.log(`  proposte disponibili nel codice:`)
    OGGETTI_ALTERNATIVI.forEach((o, i) => console.log(`    ${i + 1}. ${o}`))
  }

  if (!COMMIT) {
    console.log(`\nPROVA A VUOTO: nessuna scrittura. Aggiungere --commit per applicare.\n`)
    process.exit(0)
  }

  const campi = ["html_template = $2", "updated_at = now()"]
  const valori = [c.id, nuovoHtml]
  if (OGGETTO_B) {
    campi.push(`subject_b = $${valori.length + 1}`)
    valori.push(OGGETTO_B)
  }

  await client.query(`update dem_campaigns set ${campi.join(", ")} where id = $1`, valori)

  // Rilettura: si conferma sulla banca dati, non sull'esito del comando.
  const { rows: dopo } = await client.query(
    `select subject, subject_b, html_template from dem_campaigns where id = $1`,
    [c.id],
  )
  const ok = dopo[0].html_template === nuovoHtml && (!OGGETTO_B || dopo[0].subject_b === OGGETTO_B)
  console.log(`\nSCRITTO. Verifica rileggendo: ${ok ? "OK" : "NON CORRISPONDE"}`)
  console.log(`  parole ora in volo: ${paroleVisibili(dopo[0].html_template)}`)
  console.log(`  oggetto A: ${dopo[0].subject}`)
  console.log(`  oggetto B: ${dopo[0].subject_b || "(nessuno)"}\n`)
  if (!ok) process.exit(1)
} finally {
  await client.end()
}
