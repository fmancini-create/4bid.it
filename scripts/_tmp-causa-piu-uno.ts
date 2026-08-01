import { Client } from "pg"

/**
 * Lo scarto e' +1 su TUTTE e 8 le campagne: costante, quindi un evento comune,
 * non una perdita casuale di conteggi. Il ciclo di invio incrementa e salva
 * correttamente, percio' la riga in piu' e' marcata 'sent' da un ALTRO percorso.
 * Cerco quale, invece di supporlo.
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  // Un indirizzo presente come 'sent' in TUTTE le campagne sarebbe un invio di prova.
  const comuni = await c.query(`
    select lower(r.email) as email, count(distinct r.campaign_id) as campagne
    from dem_recipients r
    where r.send_status in ('sent','bounced','opened')
    group by lower(r.email)
    having count(distinct r.campaign_id) >= 6
    order by campagne desc limit 8
  `)
  console.log(`=== indirizzi presenti in 6+ campagne (candidati "invio di prova") ===`)
  if (comuni.rows.length === 0) console.log("  nessuno")
  for (const x of comuni.rows) console.log(`  ${String(x.email).padEnd(40)} in ${x.campagne} campagne`)

  // Le righe 'sent' SENZA sent_at non sono passate dal ciclo di invio,
  // che scrive sempre sent_at insieme allo stato.
  const senzaData = await c.query(`
    select ca.name, count(*) n
    from dem_recipients r join dem_campaigns ca on ca.id = r.campaign_id
    where r.send_status in ('sent','bounced','opened') and r.sent_at is null
    group by ca.name order by ca.name
  `)
  console.log(`\n=== righe marcate inviate ma SENZA data di invio (non passate dal ciclo) ===`)
  if (senzaData.rows.length === 0) console.log("  nessuna")
  for (const x of senzaData.rows) console.log(`  ${String(x.name).slice(0, 46).padEnd(48)} ${x.n}`)

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
