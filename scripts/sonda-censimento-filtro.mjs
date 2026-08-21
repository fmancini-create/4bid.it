/**
 * Il filtro per gestionale conta su TUTTO il censimento, o solo sulla pagina?
 *
 * La rotta usa un innesto interno (`!inner`) piu' `.eq(...)` per far entrare il
 * filtro nella query. Se quella sintassi non funzionasse come credo, il totale
 * mostrato sarebbe quello di una pagina spacciato per totale del censimento --
 * ed e' esattamente il difetto che il pannello deve evitare, perche' un
 * conteggio parziale letto come quota di mercato porta a decisioni commerciali
 * sbagliate.
 *
 * Si confronta il conteggio della query della rotta con quello calcolato in SQL
 * puro: due strade indipendenti che devono dire lo stesso numero.
 */
import { createClient } from "@supabase/supabase-js"
import pg from "pg"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const db = createClient(url, key, { auth: { persistSession: false } })

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

let problemi = 0

const fornitori = (
  await db.from("hospitality_technology_detections").select("provider_name").limit(2000)
).data
const nomi = [...new Set((fornitori || []).map((r) => r.provider_name))].sort()

const sql = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await sql.connect()

console.log("=== il filtro per gestionale conta su tutto il censimento? ===")
console.log("  fornitore              rotta   SQL puro")

for (const nome of nomi) {
  // La query ESATTA della rotta, innesto interno compreso.
  const { count, error } = await db
    .from("hospitality_properties")
    .select(
      "id,name,city,region,website_url,technology_status,last_crawled_at,hospitality_technology_detections!inner(provider_name)",
      { count: "exact" },
    )
    .not("last_crawled_at", "is", null)
    .eq("hospitality_technology_detections.provider_name", nome)

  // La stessa domanda per una strada indipendente.
  const atteso = Number(
    (
      await sql.query(
        `SELECT count(DISTINCT p.id)::int n
           FROM hospitality_properties p
           JOIN hospitality_technology_detections d ON d.property_id = p.id
          WHERE p.last_crawled_at IS NOT NULL AND d.provider_name = $1`,
        [nome],
      )
    ).rows[0].n,
  )

  const ok = !error && count === atteso
  if (!ok) problemi++
  console.log(
    `  ${ok ? "OK  " : "NO  "}${nome.padEnd(22)}${String(error ? "errore" : count).padEnd(8)}${atteso}` +
      (error ? `   ${error.message}` : ""),
  )
}

// CONTROLLO POSITIVO: senza filtro il conteggio deve essere tutte le esaminate.
// Senza questo, un filtro che restituisse sempre 0 passerebbe i confronti sopra
// solo perche' anche l'SQL direbbe 0.
const { count: senzaFiltro } = await db
  .from("hospitality_properties")
  .select("id", { count: "exact" })
  .not("last_crawled_at", "is", null)
const esaminate = Number(
  (await sql.query("SELECT count(*)::int n FROM hospitality_properties WHERE last_crawled_at IS NOT NULL")).rows[0].n,
)
console.log()
console.log("=== controllo positivo: senza filtro ===")
console.log(`  ${senzaFiltro === esaminate ? "OK" : "NO"}  rotta ${senzaFiltro}  SQL ${esaminate}`)
if (senzaFiltro !== esaminate) problemi++
if (esaminate === 0) {
  console.log("  ATTENZIONE: zero strutture esaminate, questa prova non dimostra nulla")
  problemi++
}

await sql.end()
console.log()
console.log(problemi === 0 ? "  nessun problema" : `  ${problemi} problemi`)
process.exit(problemi === 0 ? 0 : 1)
