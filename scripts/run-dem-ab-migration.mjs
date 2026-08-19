// Runner della migrazione "prova A/B sull'oggetto".
//
// Esecuzione:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/run-dem-ab-migration.mjs
//
// Come il runner dei solleciti caldi: DDL diretto, nessuna RPC exec_sql.
// IMPORTANTE: nel progetto coesistono Neon (POSTGRES_*) e Supabase
// (SUPABASE_POSTGRES_*). Le tabelle dem_* vivono su Supabase: usare SEMPRE la
// connessione Supabase per il DDL, altrimenti la migrazione "riesce" sul
// database sbagliato e le colonne non compaiono dove servono.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import pg from "pg"

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const connectionString =
  process.env.SUPABASE_POSTGRES_URL_NON_POOLING || process.env.SUPABASE_POSTGRES_URL

if (!connectionString) {
  console.error("[migrazione] SUPABASE_POSTGRES_URL_NON_POOLING mancante")
  process.exit(1)
}

// Le due migrazioni della prova A/B, in ordine. Entrambe sono additive e
// idempotenti (`add column if not exists`), quindi rieseguire e' innocuo.
const FILE_SQL = ["2026-08-19-dem-ab-oggetto.sql", "2026-08-19-dem-oggetto-storico.sql"]
const sql = FILE_SQL.map((f) => readFileSync(join(__dirname, f), "utf8")).join("\n;\n")

const client = new Client({
  connectionString: connectionString.replace(/[?&]sslmode=require/g, ""),
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log("[migrazione] connesso, eseguo lo script...")
  await client.query(sql)

  // Verifica che le colonne esistano DAVVERO dopo l'esecuzione.
  // Un runner che stampa "OK" solo perche' la query non ha lanciato eccezioni
  // dichiara un esito che non ha controllato: con `IF NOT EXISTS` ovunque, uno
  // script eseguito sul database sbagliato non fallisce, non crea nulla e
  // sembra riuscito.
  const { rows } = await client.query(
    `select table_name, column_name from information_schema.columns
      where (table_name = 'dem_campaigns' and column_name in ('subject_b', 'subject_legacy'))
         or (table_name = 'dem_recipients' and column_name = 'subject_variant')
      order by table_name, column_name`,
  )
  const trovate = rows.map((r) => `${r.table_name}.${r.column_name}`)
  const attese = [
    "dem_campaigns.subject_b",
    "dem_campaigns.subject_legacy",
    "dem_recipients.subject_variant",
  ]
  const mancanti = attese.filter((a) => !trovate.includes(a))

  if (mancanti.length > 0) {
    console.error("[migrazione] ERRORE: colonne mancanti dopo l'esecuzione:", mancanti.join(", "))
    process.exitCode = 1
  } else {
    console.log("[migrazione] OK - colonne presenti:", trovate.join(", "))
  }
} catch (err) {
  console.error("[migrazione] ERRORE:", err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
