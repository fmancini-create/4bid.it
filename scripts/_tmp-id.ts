import { Client } from "pg"

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()
  const r = await c.query(`
    select ca.id, ca.name, ca.auto_send,
           (ca.auto_paused_reason is not null) as sospesa,
           count(*) filter (where re.send_status = 'pending') as attesa
    from dem_campaigns ca left join dem_recipients re on re.campaign_id = ca.id
    group by ca.id, ca.name, ca.auto_send, ca.auto_paused_reason
    having count(*) filter (where re.send_status = 'pending') > 0
    order by attesa desc`)
  console.log("=== campagne con destinatari in attesa (le uniche su cui 'Invia' fa qualcosa) ===")
  for (const x of r.rows) {
    console.log(`  ${x.id}  sospesa:${x.sospesa ? "SI " : "no "} attesa:${String(x.attesa).padStart(6)}  ${x.name}`)
  }
  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
