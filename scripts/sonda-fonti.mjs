// Cerca da dove possono venire le strutture del censimento: tabelle con un sito
// e tabelle popolose. Serve a NON inventare una fonte che non esiste.

import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || process.env.SUPABASE_POSTGRES_URL || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

if (!conn) {
  console.log("  IMPOSSIBILE: nessuna stringa di connessione")
  process.exit(2)
}

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const { rows: siti } = await c.query(
  `SELECT table_name, column_name
     FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name ~* '(website|sito|url|domain)'
    ORDER BY table_name, column_name`,
)
console.log("=== colonne di sito/dominio (candidate per il rilevamento) ===")
let t = ""
for (const r of siti) {
  if (r.table_name !== t) {
    t = r.table_name
    console.log(`  ${t}`)
  }
  console.log(`    ${r.column_name}`)
}

const { rows: big } = await c.query(
  `SELECT relname, n_live_tup::int AS righe
     FROM pg_stat_user_tables
    WHERE schemaname = 'public' AND n_live_tup > 300
    ORDER BY n_live_tup DESC
    LIMIT 15`,
)
console.log("\n=== tabelle piu' popolose (dove possono stare 29.923) ===")
for (const r of big) console.log(`  ${String(r.righe).padStart(7)}  ${r.relname}`)

await c.end()
