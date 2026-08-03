/**
 * TEMPORANEO - la campagna a freddo e' stata SOSPESA il 01/08 dal nuovo freno,
 * ma l'ultimo invio risulta oggi 03/08 e le inviate sono passate da 827 a 981.
 * Verifico se sono partite email DOPO la sospensione e da quale percorso.
 */
import { Client } from "pg"

const CAMPAGNA_FREDDA = "ba265e88-1d30-4377-b28d-d00010e276f8"

async function main() {
  const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING
  if (!url) throw new Error("SUPABASE_POSTGRES_URL_NON_POOLING assente")
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await c.connect()

  const stato = await c.query(
    `select name, auto_send, auto_paused_reason, sent_count, updated_at from dem_campaigns where id = $1`,
    [CAMPAGNA_FREDDA],
  )
  const s = stato.rows[0]
  console.log("=== stato attuale della campagna a freddo ===")
  console.log(`  auto_send: ${s.auto_send}   (false = automazione spenta)`)
  console.log(`  sospesa:   ${s.auto_paused_reason ? "SI" : "no"}`)
  console.log(`  aggiornata: ${String(s.updated_at).slice(0, 19)}`)

  const perGiorno = await c.query(
    `select date(sent_at) d,
            count(*) filter (where send_status in ('sent','bounced','opened')) inv,
            count(*) filter (where send_status = 'bounced') rim
     from dem_recipients where campaign_id = $1 and sent_at > now() - interval '6 days'
     group by 1 order by 1 desc`,
    [CAMPAGNA_FREDDA],
  )
  console.log("\n=== invii per giorno (la sospensione e' del 01/08) ===")
  for (const x of perGiorno.rows) {
    const inv = Number(x.inv)
    const rim = Number(x.rim)
    console.log(
      `  ${String(x.d).slice(0, 10)}  inviate:${String(inv).padStart(4)}  rimbalzi:${String(rim).padStart(3)}  ${inv > 0 ? ((rim / inv) * 100).toFixed(1) + "%" : "-"}`,
    )
  }

  const oggi = await c.query(
    `select email, send_status, sent_at from dem_recipients
     where campaign_id = $1 and sent_at >= current_date order by sent_at asc limit 6`,
    [CAMPAGNA_FREDDA],
  )
  console.log(`\n=== prime email partite OGGI (${oggi.rows.length > 0 ? "ce ne sono" : "nessuna"}) ===`)
  for (const x of oggi.rows) console.log(`  ${String(x.sent_at).slice(11, 19)}  ${x.email}  ${x.send_status}`)

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
