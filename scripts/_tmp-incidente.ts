import { Client } from "pg"

/**
 * A giugno: 15.297 email con lo 0,2% di rimbalzi. Il 29/06: 31,2% su 3.291.
 * Se la lista fosse di cattiva qualita' i rimbalzi sarebbero stati alti anche
 * prima, percio' cerco l'evento. Discriminante: rimbalzi CONCENTRATI su pochi
 * domini = blocco tecnico; SPARSI su molti = indirizzi realmente inesistenti.
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const conc = await c.query(`
    select lower(split_part(email,'@',2)) dominio, count(*) n
    from dem_recipients
    where send_status='bounced' and sent_at >= '2026-06-29' and sent_at < '2026-07-06'
    group by 1 order by n desc limit 10
  `)
  const tot = await c.query(`
    select count(*) n, count(distinct lower(split_part(email,'@',2))) domini
    from dem_recipients
    where send_status='bounced' and sent_at >= '2026-06-29' and sent_at < '2026-07-06'
  `)
  console.log(`=== rimbalzi 29/06-05/07: ${tot.rows[0].n} su ${tot.rows[0].domini} domini distinti ===`)
  for (const x of conc.rows) console.log(`  ${String(x.dominio).padEnd(34)} ${x.n}`)

  const motivi = await c.query(`
    select coalesce(nullif(trim(error_message),''),'(nessun motivo registrato)') motivo, count(*) n
    from dem_recipients
    where send_status='bounced' and sent_at >= '2026-06-29' and sent_at < '2026-07-06'
    group by 1 order by n desc limit 6
  `)
  console.log(`\n=== motivi registrati ===`)
  for (const x of motivi.rows) console.log(`  ${String(x.n).padStart(5)}  ${String(x.motivo).slice(0, 88)}`)

  // Da quale lista venivano? Se e' una lista caricata a giugno, il problema e' la fonte.
  const camp = await c.query(`
    select ca.name, count(*) n
    from dem_recipients r join dem_campaigns ca on ca.id=r.campaign_id
    where r.send_status='bounced' and r.sent_at >= '2026-06-29' and r.sent_at < '2026-07-06'
    group by 1 order by n desc
  `)
  console.log(`\n=== campagne coinvolte ===`)
  for (const x of camp.rows) console.log(`  ${String(x.name).slice(0, 46).padEnd(48)} ${x.n}`)

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
