import { Client } from "pg"

/**
 * La rotta ha risposto `sent: 14` ma i destinatari in attesa erano 2.
 * Prima di qualsiasi conclusione: chi ha ricevuto un'email negli ultimi minuti?
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const recenti = await c.query(`
    select r.email, r.send_status, r.sent_at, ca.name as campagna
    from dem_recipients r
    join dem_campaigns ca on ca.id = r.campaign_id
    where r.sent_at > now() - interval '20 minutes'
    order by r.sent_at desc
  `)
  console.log(`=== email inviate negli ultimi 20 minuti: ${recenti.rows.length} ===`)
  for (const r of recenti.rows) {
    console.log(
      `  ${String(r.sent_at).slice(11, 19)}  ${String(r.email).padEnd(38)} ${String(r.send_status).padEnd(8)} ${String(r.campagna).slice(0, 34)}`,
    )
  }

  const camp = await c.query(
    `select ca.name, ca.status,
            count(*) filter (where r.send_status='pending') attesa,
            count(*) filter (where r.send_status='sent') inviate,
            count(*) as tot
     from dem_campaigns ca left join dem_recipients r on r.campaign_id = ca.id
     where ca.id = 'b9d32eb8-c4af-4487-9701-450fdb58e515'
     group by ca.name, ca.status`,
  )
  console.log(`\n=== stato della campagna clienti ===`)
  for (const r of camp.rows) {
    console.log(`  ${r.name}  stato:${r.status}  totale:${r.tot}  inviate:${r.inviate}  in attesa:${r.attesa}`)
  }

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
