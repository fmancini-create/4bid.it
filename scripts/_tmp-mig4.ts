import { readFileSync } from "node:fs"
import { Client } from "pg"
async function main() {
  const sql = readFileSync("scripts/2026-08-03-dem-validazione-indirizzi.sql", "utf8")
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  await c.query(sql)
  const r = await c.query(`
    select table_name||'.'||column_name x from information_schema.columns
    where table_schema='public' and (
      (table_name='dem_recipients' and column_name in ('validation_status','validation_checked_at','domain_addresses'))
      or (table_name='dem_campaigns' and column_name='send_only_safe')
      or (table_name='dem_domain_checks'))
    order by 1`)
  console.log("=== CONTROPROVA: creato ===")
  if (r.rows.length === 0) console.log("  NULLA")
  for (const y of r.rows) console.log(`  ${y.x}`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
