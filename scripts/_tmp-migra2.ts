import { readFileSync } from "node:fs"
import { Client } from "pg"
async function main() {
  const sql = readFileSync("scripts/2026-08-03-dem-warm-freno-rimbalzi.sql", "utf8")
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  await c.query(sql)
  const r = await c.query(`select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='dem_followups' and column_name='paused_reason'`)
  console.log("=== CONTROPROVA: la colonna esiste? ===")
  console.log(r.rows.length === 1 ? `  si: ${r.rows[0].column_name} (${r.rows[0].data_type}, null:${r.rows[0].is_nullable})` : "  NO")
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
