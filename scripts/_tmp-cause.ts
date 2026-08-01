import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const r = await c.query(`
    select coalesce(nullif(trim(error_message),''),'(nessun motivo registrato)') motivo, count(*) n
    from dem_recipients where send_status='bounced' and sent_at > now() - interval '5 days'
    group by 1 order by n desc limit 10`)
  console.log("=== motivi dei rimbalzi negli ultimi 5 giorni ===")
  for (const x of r.rows) console.log(`  ${String(x.n).padStart(3)}  ${String(x.motivo).slice(0,96)}`)
  const q = await c.query(`
    select name, daily_quota_total, daily_quota_cold, daily_quota_warm, auto_send, auto_started_on, status
    from dem_campaigns where auto_send = true order by created_at desc`)
  console.log("\n=== campagne in invio automatico: quote configurate ===")
  for (const x of q.rows) console.log(`  ${String(x.name).slice(0,42).padEnd(44)} tot:${x.daily_quota_total ?? '-'} freddi:${x.daily_quota_cold ?? '-'} caldi:${x.daily_quota_warm ?? '-'} dal:${x.auto_started_on ?? '-'} (${x.status})`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
