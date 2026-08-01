/**
 * A che ritmo sta uscendo la campagna grande, e quando finirebbe. Solo LETTURA.
 */
import { Client } from "pg"

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  // NON filtro per nome: "Air Market" corrisponde a DUE campagne (il comunicato
  // stampa e quella grande) e avevo preso quella sbagliata. Scelgo per fatto
  // misurabile: quella con piu' destinatari ancora in attesa.
  const ca = await c.query(`
    select ca.id, ca.name, ca.status, ca.auto_send, ca.auto_started_on, ca.created_at,
           count(*) filter (where r.send_status = 'pending') as pend
    from dem_campaigns ca join dem_recipients r on r.campaign_id = ca.id
    group by ca.id, ca.name, ca.status, ca.auto_send, ca.auto_started_on, ca.created_at
    order by pend desc limit 1
  `)
  const camp = ca.rows[0]
  console.log(`=== ${camp.name} ===`)
  console.log(`  stato:${camp.status}  auto_send:${camp.auto_send}  avviato il:${camp.auto_started_on ?? "MAI"}`)

  const tot = await c.query(
    `select count(*) filter (where send_status='sent') as inviate,
            count(*) filter (where send_status='pending') as in_attesa,
            max(sent_at) as ultimo_invio
     from dem_recipients where campaign_id = $1`,
    [camp.id],
  )
  const t = tot.rows[0]
  console.log(`  inviate:${t.inviate}  in attesa:${t.in_attesa}`)
  console.log(`  ULTIMO INVIO: ${t.ultimo_invio ?? "mai"}`)
  console.log(`  adesso:        ${new Date().toISOString()}`)

  console.log("")
  console.log("=== invii per giorno (questa campagna) ===")
  const perGiorno = await c.query(
    `select date(sent_at) as g, count(*) as n from dem_recipients
     where campaign_id = $1 and sent_at is not null group by 1 order by 1 desc limit 12`,
    [camp.id],
  )
  for (const r of perGiorno.rows) console.log(`  ${String(r.g).slice(0, 10)}  ${r.n}`)

  const gg = perGiorno.rows.length
  const media = gg > 0 ? perGiorno.rows.reduce((s: number, r: any) => s + Number(r.n), 0) / gg : 0
  console.log("")
  console.log(`  media al giorno: ${media.toFixed(0)}`)
  if (media > 0) console.log(`  giorni per finire i ${t.in_attesa} in attesa: ~${Math.ceil(Number(t.in_attesa) / media)}`)

  await c.end()
}
main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
