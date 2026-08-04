import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const camp = (await c.query(`select id from dem_campaigns where auto_paused_reason is not null limit 1`)).rows[0]

  // Il mio 2,4% contava la frequenza sulle SOLE EMAIL INVIATE (981), il filtro
  // la conta su TUTTA la lista (28.773). Sono due misure diverse: verifico.
  console.log("=== Frequenza contata sulle SOLE INVIATE (come nella mia stima) ===")
  const a = await c.query(
    `with inv as (
       select r.send_status, (select count(*) from dem_recipients x
          where x.campaign_id=r.campaign_id and x.sent_at is not null
            and lower(split_part(x.email,'@',2))=lower(split_part(r.email,'@',2))) f
       from dem_recipients r where r.campaign_id=$1 and r.sent_at is not null)
     select case when f>=6 then '6+' when f>=2 then '2-5' else '1' end fascia,
       count(*) inviate, count(*) filter (where send_status='bounced') rimb
     from inv group by 1 order by 1`, [camp.id])
  for (const x of a.rows) console.log(`  ${String(x.fascia).padEnd(4)} inviate:${String(x.inviate).padStart(5)} rimbalzi:${String(x.rimb).padStart(4)}  ${((Number(x.rimb)/Number(x.inviate))*100).toFixed(1)}%`)

  console.log("\n=== Frequenza contata su TUTTA la lista (come fa il filtro) ===")
  const b = await c.query(
    `with inv as (
       select r.send_status, (select count(*) from dem_recipients x
          where x.campaign_id=r.campaign_id
            and lower(split_part(x.email,'@',2))=lower(split_part(r.email,'@',2))) f
       from dem_recipients r where r.campaign_id=$1 and r.sent_at is not null)
     select case when f>=6 then '6+' when f>=2 then '2-5' else '1' end fascia,
       count(*) inviate, count(*) filter (where send_status='bounced') rimb
     from inv group by 1 order by 1`, [camp.id])
  for (const x of b.rows) console.log(`  ${String(x.fascia).padEnd(4)} inviate:${String(x.inviate).padStart(5)} rimbalzi:${String(x.rimb).padStart(4)}  ${((Number(x.rimb)/Number(x.inviate))*100).toFixed(1)}%`)

  console.log("\n=== Serve una soglia piu' alta? (frequenza su tutta la lista) ===")
  const s = await c.query(
    `with inv as (
       select r.send_status, (select count(*) from dem_recipients x
          where x.campaign_id=r.campaign_id
            and lower(split_part(x.email,'@',2))=lower(split_part(r.email,'@',2))) f
       from dem_recipients r where r.campaign_id=$1 and r.sent_at is not null)
     select case when f>=20 then 'd) 20+' when f>=12 then 'c) 12-19'
                 when f>=6 then 'b) 6-11' else 'a) 1-5' end fascia,
       count(*) inviate, count(*) filter (where send_status='bounced') rimb
     from inv group by 1 order by 1`, [camp.id])
  for (const x of s.rows) console.log(`  ${String(x.fascia).padEnd(9)} inviate:${String(x.inviate).padStart(5)} rimbalzi:${String(x.rimb).padStart(4)}  ${((Number(x.rimb)/Number(x.inviate))*100).toFixed(1)}%`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
