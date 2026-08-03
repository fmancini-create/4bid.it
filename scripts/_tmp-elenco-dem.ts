/**
 * TEMPORANEO - elenca le campagne DEM con oggetto, stato e date, per capire
 * quale sia "l'ultima DEM delle funzionalita' di Santaddeo".
 *
 * Le tabelle DEM stanno su SUPABASE (non su Neon): usare
 * SUPABASE_POSTGRES_URL_NON_POOLING.
 */
import { Client } from "pg"

async function main() {
  const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING
  if (!url) throw new Error("SUPABASE_POSTGRES_URL_NON_POOLING assente")
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await c.connect()

  const r = await c.query(`
    select ca.id, ca.name, ca.subject, ca.status, ca.auto_send, ca.auto_paused_reason,
           ca.created_at,
           count(r.id) tot,
           count(*) filter (where r.send_status in ('sent','bounced','opened')) inviate,
           count(*) filter (where r.send_status = 'pending') attesa,
           max(r.sent_at) ultimo_invio
    from dem_campaigns ca
    left join dem_recipients r on r.campaign_id = ca.id
    group by ca.id, ca.name, ca.subject, ca.status, ca.auto_send, ca.auto_paused_reason, ca.created_at
    order by ca.created_at desc
  `)

  console.log(`=== ${r.rows.length} campagne DEM (dalla piu' recente) ===`)
  for (const x of r.rows) {
    console.log(`\n  nome:     ${x.name}`)
    console.log(`  oggetto:  ${x.subject ?? "(nessuno)"}`)
    console.log(`  creata:   ${String(x.created_at).slice(0, 16)}   stato: ${x.status}   auto: ${x.auto_send}`)
    console.log(
      `  righe:    ${x.tot}   inviate: ${x.inviate}   in attesa: ${x.attesa}   ultimo invio: ${x.ultimo_invio ? String(x.ultimo_invio).slice(0, 16) : "mai"}`,
    )
    if (x.auto_paused_reason) console.log(`  SOSPESA:  ${String(x.auto_paused_reason).slice(0, 110)}`)
    console.log(`  id:       ${x.id}`)
  }

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
