// Runner della migration DEM "Solleciti caldi".
// Usa POSTGRES_URL_NON_POOLING (DDL su 4BID/Supabase), NO RPC exec_sql.
// Esecuzione:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/run-dem-warm-migration.mjs
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import pg from "pg"

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

// IMPORTANTE: nel progetto coesistono Neon (POSTGRES_*) e Supabase (SUPABASE_POSTGRES_*).
// Le tabelle dem_* vivono su Supabase: usare SEMPRE la connessione Supabase per il DDL.
const connectionString =
  process.env.SUPABASE_POSTGRES_URL_NON_POOLING ||
  process.env.SUPABASE_POSTGRES_URL

if (!connectionString) {
  console.error("[migration] SUPABASE_POSTGRES_URL_NON_POOLING mancante")
  process.exit(1)
}

const sql = readFileSync(join(__dirname, "2026-06-13-dem-warm-followups.sql"), "utf8")

const client = new Client({
  connectionString: connectionString.replace(/[?&]sslmode=require/g, ""),
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log("[migration] connesso, eseguo lo script...")
  await client.query(sql)
  console.log("[migration] OK — tabelle/colonne 'solleciti caldi' pronte.")
} catch (err) {
  console.error("[migration] ERRORE:", err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
