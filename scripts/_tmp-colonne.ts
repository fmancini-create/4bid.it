import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const r = await c.query(`select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='dem_campaigns' order by ordinal_position`)
  console.log("=== dem_campaigns: colonne reali ===")
  for (const x of r.rows) console.log(`  ${String(x.column_name).padEnd(26)} ${String(x.data_type).padEnd(26)} null:${x.is_nullable}`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
