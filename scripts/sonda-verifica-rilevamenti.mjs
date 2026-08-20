// Sonda: i rilevamenti scritti sono CORRETTI, non solo presenti?
// Un conteggio "5 rilevati" non dice nulla sulla qualita': va guardato il
// contenuto, e per ogni rilevamento va confrontata la prova (l'host trovato)
// col fornitore dedotto. Se l'host non contiene il nome del fornitore, il
// rilevamento e' sospetto e va guardato a mano.
import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const q = async (sql, params = []) => (await c.query(sql, params)).rows

console.log("=== stato della coda dopo il lotto ===")
for (const r of await q(
  `SELECT status, count(*)::int n FROM hospitality_crawl_queue GROUP BY status ORDER BY n DESC`,
)) {
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
  `SELECT d.provider_slug, d.technology_type, d.evidence_kind, d.evidence_value, d.confidence,
          p.website_host, p.name
     FROM hospitality_technology_detections d
     JOIN hospitality_properties p ON p.id = d.property_id
    ORDER BY d.provider_slug, p.website_host`,
)
if (!det.length) console.log("  NESSUN rilevamento scritto")
for (const r of det) {
  // La prova regge? L'host trovato deve contenere il nome del fornitore.
  const radice = String(r.provider_slug).split("_")[0]
  const prova = String(r.evidence_value || "").toLowerCase()
  const coerente = prova.includes(radice)
  console.log(`  ${coerente ? "COERENTE " : "DA GUARDARE"} ${String(r.provider_slug).padEnd(16)} ${String(r.technology_type).padEnd(16)} conf=${r.confidence}`)
  console.log(`      struttura: ${String(r.name).slice(0, 42).padEnd(42)} (${r.website_host})`)
  console.log(`      prova:     ${r.evidence_kind} = ${String(r.evidence_value).slice(0, 70)}`)
}

console.log()
console.log("=== quanti rilevamenti sono coerenti? ===")
let coe = 0
for (const r of det) {
  if (String(r.evidence_value || "").toLowerCase().includes(String(r.provider_slug).split("_")[0])) coe++
}
console.log(`  coerenti: ${coe} / ${det.length}`)

console.log()
console.log("=== host sconosciuti raccolti (i fornitori da aggiungere) ===")
for (const r of await q(
  `SELECT host, occurrences, sample_urls FROM hospitality_unknown_booking_hosts ORDER BY occurrences DESC, host LIMIT 15`,
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
