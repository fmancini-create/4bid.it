// Sonda: dove sono le identity_key duplicate nella vista delle candidate?
// L'errore "ON CONFLICT DO UPDATE command cannot affect row a second time" dice
// che nello STESSO lotto arrivano due righe con la stessa identity_key. Qui misuro
// in quale dei due rami della UNION stanno, invece di indovinare.
import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

if (!conn) {
  console.log("  NON MISURATO: manca SUPABASE_POSTGRES_URL_NON_POOLING")
  process.exit(1)
}

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const q = async (etichetta, sql) => {
  try {
    const { rows } = await c.query(sql)
    console.log(`  ${etichetta}:`)
    if (!rows.length) console.log("    (nessuna riga)")
    for (const r of rows.slice(0, 8)) console.log("    " + JSON.stringify(r))
  } catch (e) {
    console.log(`  ${etichetta}: ERRORE ${e.message}`)
  }
}

console.log("=== righe totali della vista vs identity_key distinte ===")
await q(
  "totali",
  `SELECT count(*)::int righe, count(DISTINCT identity_key)::int chiavi,
          (count(*) - count(DISTINCT identity_key))::int duplicate
   FROM hospitality_seed_candidates`,
)

console.log()
console.log("=== in quale ramo stanno le duplicate? ===")
await q(
  "per prefisso della chiave",
  `SELECT split_part(identity_key,':',1) ramo, count(*)::int righe,
          count(DISTINCT identity_key)::int chiavi,
          (count(*) - count(DISTINCT identity_key))::int duplicate
   FROM hospitality_seed_candidates GROUP BY 1`,
)

console.log()
console.log("=== esempi concreti di chiave duplicata ===")
await q(
  "prime 5",
  `SELECT identity_key, count(*)::int volte, array_agg(DISTINCT name) nomi
   FROM hospitality_seed_candidates GROUP BY 1 HAVING count(*) > 1
   ORDER BY 2 DESC LIMIT 5`,
)

console.log()
console.log("=== stato attuale della semina (2 lotti sono passati) ===")
await q("righe seminate", `SELECT count(*)::int seminate FROM hospitality_properties`)
await q("in coda", `SELECT count(*)::int in_coda FROM hospitality_crawl_queue`)
await q(
  "segnaposto",
  `SELECT seed_offset, seed_total, seeded_count, seed_status FROM hospitality_census_state WHERE id=1`,
)

await c.end()
