import { Client } from "pg"

/**
 * Riallinea `dem_campaigns.sent_count` al numero VERO di email partite.
 * Non invia nulla: corregge solo un numero mostrato nella pagina di controllo.
 * Da eseguire una volta; da qui in avanti la rotta di invio si autocorregge.
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const prima = await c.query(`
    select ca.id, ca.name, ca.sent_count as memorizzato,
           count(*) filter (where r.send_status in ('sent','bounced','opened')) as vero
    from dem_campaigns ca
    left join dem_recipients r on r.campaign_id = ca.id
    group by ca.id, ca.name, ca.sent_count
    having ca.sent_count is distinct from count(*) filter (where r.send_status in ('sent','bounced','opened'))
  `)
  console.log(`=== campagne da riallineare: ${prima.rows.length} ===`)
  for (const x of prima.rows) {
    console.log(`  ${String(x.name).slice(0, 44).padEnd(46)} ${x.memorizzato} -> ${x.vero}`)
  }

  if (prima.rows.length === 0) {
    console.log("  nulla da fare")
    await c.end()
    return
  }

  const r = await c.query(`
    update dem_campaigns ca
    set sent_count = v.vero, updated_at = now()
    from (
      select campaign_id, count(*) filter (where send_status in ('sent','bounced','opened')) as vero
      from dem_recipients group by campaign_id
    ) v
    where v.campaign_id = ca.id and ca.sent_count is distinct from v.vero
    returning ca.name
  `)
  console.log(`\n=== righe aggiornate: ${r.rows.length} ===`)

  // Controprova: dopo l'aggiornamento non deve restare alcuna divergenza.
  const dopo = await c.query(`
    select count(*) n from (
      select ca.id
      from dem_campaigns ca
      left join dem_recipients r on r.campaign_id = ca.id
      group by ca.id, ca.sent_count
      having ca.sent_count is distinct from count(*) filter (where r.send_status in ('sent','bounced','opened'))
    ) q
  `)
  console.log(`=== CONTROPROVA divergenze residue: ${dopo.rows[0].n}  (0 = allineati)`)

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
