import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const camp = (await c.query(`select id, name from dem_campaigns where auto_paused_reason is not null limit 1`)).rows[0]

  // LA DOMANDA CHE CONTA: sulle email GIA' inviate (esito noto), quale sarebbe
  // stato il tasso spedendo solo alla fascia sicura? Il filtro va giudicato su
  // dati con esito verificato, non sulla coda che ancora non ha risposto.
  console.log("=== TASSO ATTESO, misurato sugli invii GIA' FATTI ===")
  const r = await c.query(
    `with inv as (
       select r.send_status,
         (select count(*) from dem_recipients x where x.campaign_id=r.campaign_id
            and lower(split_part(x.email,'@',2))=lower(split_part(r.email,'@',2))) f
       from dem_recipients r where r.campaign_id=$1 and r.sent_at is not null and r.email is not null)
     select case when f >= 6 then 'fascia sicura' else 'rischio alto' end fascia,
            count(*) inviate, count(*) filter (where send_status='bounced') rimb
     from inv group by 1 order by 1`, [camp.id])
  let ti = 0, tr = 0
  for (const x of r.rows) {
    ti += Number(x.inviate); tr += Number(x.rimb)
    console.log(`  ${String(x.fascia).padEnd(14)} inviate:${String(x.inviate).padStart(5)}  rimbalzi:${String(x.rimb).padStart(4)}  ${((Number(x.rimb)/Number(x.inviate))*100).toFixed(1)}%`)
  }
  console.log(`  ${"TOTALE senza filtro".padEnd(14)} inviate:${String(ti).padStart(5)}  rimbalzi:${String(tr).padStart(4)}  ${((tr/ti)*100).toFixed(1)}%`)

  console.log("\n=== COSA RESTA DA SPEDIRE, dopo i filtri ===")
  const q = await c.query(
    `select validation_status v, count(*) n from dem_recipients
     where campaign_id=$1 and send_status='pending' group by 1 order by 2 desc`, [camp.id])
  let tot = 0
  for (const x of q.rows) tot += Number(x.n)
  for (const x of q.rows) console.log(`  ${String(x.v ?? "(non valutato)").padEnd(16)} ${String(x.n).padStart(6)}  ${((Number(x.n)/tot)*100).toFixed(1)}%`)
  const s = q.rows.find((x:any)=>x.v==='sicuro')
  const m = q.rows.find((x:any)=>x.v==='dominio-morto')
  console.log(`\n  Con filtro attivo partirebbero: ${Number(s?.n||0).toLocaleString("it-IT")} email`)
  console.log(`  Escluse comunque (dominio morto): ${Number(m?.n||0).toLocaleString("it-IT")}`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
