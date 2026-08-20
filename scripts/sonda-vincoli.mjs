// Legge i vincoli CHECK e i default reali delle tabelle del censimento.
// Indovinare un valore ammesso significa far fallire ogni inserimento.

import pg from "pg"

const conn =
  process.env.SUPABASE_POSTGRES_URL_NON_POOLING ||
  process.env.SUPABASE_POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING
if (!conn) {
  console.log("  IMPOSSIBILE: nessuna stringa di connessione Supabase Postgres")
  process.exit(2)
}

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await client.connect()

const tabelle = [
  "hospitality_properties",
  "hospitality_technology_detections",
  "hospitality_crawl_queue",
  "hospitality_census_state",
  "hospitality_unknown_booking_hosts",
  "hospitality_provider_summary",
]

const { rows: checks } = await client.query(
  `SELECT rel.relname AS tabella, con.conname AS nome, pg_get_constraintdef(con.oid) AS definizione
     FROM pg_constraint con
     JOIN pg_class rel ON rel.oid = con.conrelid
     JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public' AND rel.relname = ANY($1) AND con.contype = 'c'
    ORDER BY rel.relname, con.conname`,
  [tabelle],
)

console.log("=== vincoli CHECK ===")
let corrente = ""
for (const r of checks) {
  if (r.tabella !== corrente) {
    corrente = r.tabella
    console.log(`\n  ${corrente}`)
  }
  console.log(`    ${r.definizione}`)
}
if (!checks.length) console.log("  NESSUN vincolo CHECK trovato (sospetto: verificare la query)")

const { rows: def } = await client.query(
  `SELECT table_name, column_name, column_default, is_nullable
     FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ANY($1) AND column_default IS NOT NULL
    ORDER BY table_name, ordinal_position`,
  [tabelle],
)
console.log("\n=== default dichiarati ===")
for (const r of def) console.log(`  ${r.table_name}.${r.column_name} = ${r.column_default}`)

const { rows: uniq } = await client.query(
  `SELECT rel.relname AS tabella, con.conname AS nome, pg_get_constraintdef(con.oid) AS definizione
     FROM pg_constraint con
     JOIN pg_class rel ON rel.oid = con.conrelid
     JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public' AND rel.relname = ANY($1) AND con.contype IN ('u','p')
    ORDER BY rel.relname`,
  [tabelle],
)
console.log("\n=== chiavi e unicita' (servono per l'upsert) ===")
for (const r of uniq) console.log(`  ${r.tabella}: ${r.definizione}`)

await client.end()
