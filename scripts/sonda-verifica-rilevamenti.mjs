// Sonda: i rilevamenti scritti sono CORRETTI, non solo presenti?
//
// Un conteggio "3 rilevati" non dice nulla sulla qualita': va guardato il
// CONTENUTO. Per ogni rilevamento si confronta la prova (l'host dove il
// fornitore e' stato trovato) col fornitore dedotto: se l'host non contiene
// nessuna parola del nome del fornitore, il rilevamento e' sospetto.
//
// E' esattamente cosi' che ho trovato i due falsi positivi Beds24: il
// conteggio diceva 5, il contenuto diceva che 2 erano sbagliati.
//
// NOTA sui nomi delle colonne: qui vanno `provider_name` e `evidence_url`.
// Nella prima versione avevo scritto `provider_slug` e `evidence_value`,
// dedotti dal significato invece di letti dallo schema, e la sonda crollava.
import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const q = async (sql, params = []) => (await c.query(sql, params)).rows

// Il nome del fornitore ("Vertical Booking") non compare mai identico
// nell'host ("book.verticalbooking.com"): va confrontato a parole, togliendo
// spazi e punteggiatura. Le parole generiche vanno scartate, altrimenti
// "booking" da sola renderebbe COERENTE qualunque host contenente "booking"
// -- che e' precisamente il difetto che stiamo cercando.
const GENERICHE = new Set(["booking", "hotel", "hotels", "system", "software", "group", "web", "online"])
const coerenza = (nomeFornitore, urlProva) => {
  const prova = String(urlProva || "").toLowerCase().replace(/[^a-z0-9]/g, "")
  const parole = String(nomeFornitore || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 4 && !GENERICHE.has(p))
  // Nome compatto intero ("verticalbooking") oppure una parola specifica.
  const compatto = String(nomeFornitore || "").toLowerCase().replace(/[^a-z0-9]/g, "")
  if (compatto && prova.includes(compatto)) return true
  return parole.some((p) => prova.includes(p))
}

console.log("=== stato della coda dopo il lotto ===")
for (const r of await q(`SELECT status, count(*)::int n FROM hospitality_crawl_queue GROUP BY status ORDER BY n DESC`)) {
  console.log(`  ${String(r.status).padEnd(12)} ${r.n}`)
}

console.log()
console.log("=== strutture per stato tecnologico ===")
for (const r of await q(
  `SELECT technology_status, count(*)::int n FROM hospitality_properties GROUP BY 1 ORDER BY n DESC`,
)) {
  console.log(`  ${String(r.technology_status).padEnd(14)} ${r.n}`)
}

console.log()
console.log("=== i rilevamenti scritti: fornitore, prova, e il CONFRONTO ===")
const det = await q(
  `SELECT d.provider_name, d.technology_type, d.evidence_kind, d.evidence_url, d.confidence,
          p.website_host, p.name
     FROM hospitality_technology_detections d
     JOIN hospitality_properties p ON p.id = d.property_id
    ORDER BY d.provider_name, p.website_host`,
)
if (!det.length) console.log("  NESSUN rilevamento scritto")
let coe = 0
for (const r of det) {
  const ok = coerenza(r.provider_name, r.evidence_url)
  if (ok) coe++
  console.log(
    `  ${ok ? "COERENTE   " : "DA GUARDARE"} ${String(r.provider_name).padEnd(18)} ${String(r.technology_type).padEnd(16)} conf=${r.confidence}`,
  )
  console.log(`      struttura: ${String(r.name).slice(0, 40).padEnd(40)} (${r.website_host})`)
  console.log(`      prova:     ${r.evidence_kind} = ${String(r.evidence_url).slice(0, 72)}`)
}
console.log()
console.log(`  coerenti: ${coe} / ${det.length}${det.length && coe < det.length ? "  <== GUARDARE I SOSPETTI" : ""}`)

console.log()
console.log("=== host sconosciuti raccolti (i fornitori da valutare) ===")
for (const r of await q(
  `SELECT host, occurrences FROM hospitality_unknown_booking_hosts ORDER BY occurrences DESC, host LIMIT 20`,
)) {
  console.log(`  ${String(r.occurrences).padStart(3)}x ${r.host}`)
}
const tot = await q(`SELECT count(*)::int n FROM hospitality_unknown_booking_hosts`)
console.log(`  host distinti in totale: ${tot[0].n}`)

console.log()
console.log("=== i campi del gestionale su hospitality_properties sono valorizzati? ===")
for (const r of await q(
  `SELECT count(*)::int tot,
          count(booking_engine_provider)::int con_be,
          count(pms_provider)::int con_pms,
          count(channel_manager_provider)::int con_cm
     FROM hospitality_properties`,
)) {
  console.log(`  strutture: ${r.tot} | booking engine: ${r.con_be} | pms: ${r.con_pms} | channel manager: ${r.con_cm}`)
}

await c.end()
