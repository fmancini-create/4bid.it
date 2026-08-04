import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const d = await c.query(`select count(*) n, count(*) filter (where has_mx) ok from dem_domain_checks`)
  console.log(`  domini controllati e MEMORIZZATI: ${d.rows[0].n} su 16865   (con MX: ${d.rows[0].ok})`)
  const s = await c.query(`select validation_status v, count(*) n from dem_recipients where validation_status is not null group by 1 order by 2 desc`)
  console.log(`  destinatari con giudizio scritto:`)
  if (s.rows.length === 0) console.log(`    nessuno (la scrittura avviene in blocco alla fine)`)
  for (const x of s.rows) console.log(`    ${String(x.v).padEnd(16)} ${x.n}`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
