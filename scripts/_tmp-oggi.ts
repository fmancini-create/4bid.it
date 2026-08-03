import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const r = await c.query(`
    select date(sent_at) d,
           count(*) filter (where send_status in ('sent','bounced','opened')) inv,
           count(*) filter (where send_status='bounced') rim
    from dem_recipients where sent_at > now() - interval '8 days' group by 1 order by 1 desc`)
  console.log("=== ultimi 8 giorni: il difetto e' ancora attivo? ===")
  for (const x of r.rows) {
    const inv = Number(x.inv), rim = Number(x.rim)
    console.log(`  ${String(x.d).slice(0,10)}  inviate:${String(inv).padStart(4)}  rimbalzi:${String(rim).padStart(3)}  ${inv>0?((rim/inv)*100).toFixed(1)+"%":"-"}`)
  }
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
