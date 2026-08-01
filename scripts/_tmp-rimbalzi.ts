import { Client } from "pg"

/**
 * Temporaneo: misura la reputazione del mittente prima di decidere se e quanto
 * alzare il tetto giornaliero. Un tetto piu' alto su una lista che rimbalza
 * peggiora la reputazione invece di accelerare la campagna.
 */
async function main() {
  // Le tabelle DEM stanno su SUPABASE, non su Neon: avevo usato DATABASE_URL e
  // ottenuto "relation dem_recipients does not exist", che sembrava un dato
  // mancante ed era invece il database sbagliato.
  const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING
  if (!url) throw new Error("SUPABASE_POSTGRES_URL_NON_POOLING assente")
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await c.connect()

  const g = await c.query(`
    select date(sent_at) d,
           count(*) tot,
           count(*) filter (where send_status = 'bounced') rimb,
           count(*) filter (where send_status = 'failed') fall,
           count(*) filter (where first_open_at is not null) apr
    from dem_recipients
    where sent_at > now() - interval '16 days'
    group by 1 order by 1 desc
  `)
  console.log("=== per giorno: inviate / rimbalzi / fallite / aperte ===")
  for (const r of g.rows) {
    const pct = Number(r.tot) > 0 ? ((Number(r.rimb) / Number(r.tot)) * 100).toFixed(1) : "0.0"
    console.log(
      `  ${String(r.d).slice(0, 10)}  inviate:${String(r.tot).padStart(4)}  rimbalzi:${String(r.rimb).padStart(3)} (${pct}%)  fallite:${String(r.fall).padStart(3)}  aperte:${String(r.apr).padStart(4)}`,
    )
  }

  const t = (
    await c.query(`
    select count(*) t,
           count(*) filter (where send_status = 'bounced') b,
           count(*) filter (where first_open_at is not null) a
    from dem_recipients where sent_at is not null
  `)
  ).rows[0]
  const pctB = ((Number(t.b) / Number(t.t)) * 100).toFixed(2)
  const pctA = ((Number(t.a) / Number(t.t)) * 100).toFixed(1)
  console.log(`\n=== complessivo (tutto lo storico) ===`)
  console.log(`  inviate:${t.t}  rimbalzi:${t.b} (${pctB}%)  aperte:${t.a} (${pctA}%)`)
  console.log(`  soglia di guardia dei fornitori di posta: rimbalzi sotto il 2%, meglio sotto l'1%`)

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
