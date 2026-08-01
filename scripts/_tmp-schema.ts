import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  for (const t of ["dem_recipients", "dem_campaigns"]) {
    const r = await c.query(`select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`, [t])
    console.log(`\n=== ${t} (${r.rows.length} colonne) ===`)
    console.log("  " + r.rows.map((x: any) => x.column_name).join(", "))
  }
  const s = await c.query(`select send_status, count(*) n from dem_recipients group by 1 order by n desc`)
  console.log(`\n=== valori reali di send_status ===`)
  for (const r of s.rows) console.log(`  ${String(r.send_status).padEnd(12)} ${r.n}`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
