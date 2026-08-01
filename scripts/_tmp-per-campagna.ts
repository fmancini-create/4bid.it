import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const r = await c.query(`
    select ca.name,
           count(*) filter (where r.sent_at > now() - interval '5 days') inv5,
           count(*) filter (where r.send_status='bounced' and r.sent_at > now() - interval '5 days') rimb5,
           count(*) filter (where r.send_status='pending') pend
    from dem_recipients r join dem_campaigns ca on ca.id = r.campaign_id
    group by ca.name order by rimb5 desc, inv5 desc`)
  console.log("=== ultimi 5 giorni, PER CAMPAGNA: inviate / rimbalzi / in attesa ===")
  for (const x of r.rows) {
    const p = Number(x.inv5) > 0 ? ((Number(x.rimb5)/Number(x.inv5))*100).toFixed(1)+"%" : "-"
    console.log(`  ${String(x.name).slice(0,44).padEnd(46)} inv:${String(x.inv5).padStart(4)} rimb:${String(x.rimb5).padStart(3)} (${String(p).padStart(6)}) attesa:${x.pend}`)
  }
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
