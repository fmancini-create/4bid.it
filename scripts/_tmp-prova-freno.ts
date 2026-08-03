// Prova del freno sui rimbalzi, SENZA inviare nulla: replica esattamente il
// calcolo del cron sui dati reali e dice per ogni campagna se scatterebbe.
import { Client } from "pg"

const SOGLIA = 0.05
const MINIMO = 200

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const r = await c.query(`
    select ca.id, ca.name, ca.auto_send,
           count(*) filter (where r.send_status in ('sent','bounced','opened') and r.sent_at > now() - interval '3 days') inviate,
           count(*) filter (where r.send_status = 'bounced' and r.sent_at > now() - interval '3 days') rimbalzate,
           count(*) filter (where r.send_status = 'pending') attesa
    from dem_campaigns ca
    left join dem_recipients r on r.campaign_id = ca.id
    group by ca.id, ca.name, ca.auto_send
    order by inviate desc
  `)

  console.log("=== il freno scatterebbe? (soglia 5% su ultimi 3 giorni, min 200 email) ===\n")
  for (const x of r.rows) {
    const inv = Number(x.inviate)
    const rim = Number(x.rimbalzate)
    const tasso = inv > 0 ? rim / inv : 0
    let verdetto: string
    if (inv < MINIMO) verdetto = `non misurabile (solo ${inv} email negli ultimi 3gg) -> PROSEGUE`
    else if (tasso > SOGLIA) verdetto = `${(tasso * 100).toFixed(1)}% -> SOSPENDE`
    else verdetto = `${(tasso * 100).toFixed(1)}% -> prosegue`
    console.log(`  ${String(x.name).slice(0, 40).padEnd(42)} auto:${x.auto_send ? "si" : "no "} attesa:${String(x.attesa).padStart(5)}  ${verdetto}`)
  }

  console.log("\n=== controprova storica: il freno avrebbe fermato l'incidente del 29/06? ===")
  const g = await c.query(`
    select date(sent_at) d,
           count(*) filter (where send_status in ('sent','bounced','opened')) inv,
           count(*) filter (where send_status = 'bounced') rim
    from dem_recipients
    where sent_at between '2026-06-26' and '2026-07-03'
    group by 1 order by 1
  `)
  let cumInv = 0
  let cumRim = 0
  for (const x of g.rows) {
    // Approssimo la finestra di 3 giorni con il cumulato dei giorni precedenti.
    const tasso = cumInv >= MINIMO ? cumRim / cumInv : null
    const azione =
      tasso === null ? "(troppo poche per giudicare)" : tasso > SOGLIA ? "AVREBBE SOSPESO QUI" : `ok (${(tasso * 100).toFixed(1)}%)`
    console.log(`  ${String(x.d).slice(0, 10)}  inviate:${String(x.inv).padStart(5)} rimbalzi:${String(x.rim).padStart(4)}   prima di partire: ${azione}`)
    cumInv += Number(x.inv)
    cumRim += Number(x.rim)
  }

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
