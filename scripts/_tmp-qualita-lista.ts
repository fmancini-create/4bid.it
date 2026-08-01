import { Client } from "pg"

/**
 * Alzare il tetto giornaliero moltiplica anche i RIMBALZI, che sono la causa
 * del danno alla reputazione del mittente. Prima di alzare, misuro quanto e'
 * sana la lista che resta da contattare.
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const tot = await c.query(`select count(*) n from dem_recipients where send_status='pending'`)
  console.log(`=== indirizzi ancora da contattare: ${tot.rows[0].n} ===`)

  // Un dominio che ha GIA' prodotto rimbalzi e' un indizio concreto di indirizzi
  // morti: e' un fatto misurato, non una supposizione sul formato dell'indirizzo.
  const perDominio = await c.query(`
    with domini_marci as (
      select lower(split_part(email,'@',2)) d, count(*) rimb
      from dem_recipients where send_status='bounced'
      group by 1
    )
    select count(*) n
    from dem_recipients r
    join domini_marci m on m.d = lower(split_part(r.email,'@',2))
    where r.send_status='pending'
  `)
  console.log(`  di cui su domini che hanno GIA' rimbalzato: ${perDominio.rows[0].n}`)

  // Indirizzi palesemente non recapitabili o inutili da contattare.
  const sospetti = await c.query(`
    select
      count(*) filter (where email !~ '^[^@[:space:]]+@[^@[:space:]]+\\.[a-z]{2,}$') as malformati,
      count(*) filter (where email ~* '^(no-?reply|noreply|postmaster|abuse|mailer-daemon)@') as caselle_automatiche,
      count(*) filter (where email ~* '(example|test)\\.(com|it|org)$') as domini_di_prova
    from dem_recipients where send_status='pending'
  `)
  const s = sospetti.rows[0]
  console.log(`  malformati: ${s.malformati}   caselle automatiche: ${s.caselle_automatiche}   domini di prova: ${s.domini_di_prova}`)

  // Andamento del tasso di rimbalzo: sta migliorando o peggiorando?
  const trend = await c.query(`
    select date_trunc('week', sent_at)::date settimana,
           count(*) inviate,
           count(*) filter (where send_status='bounced') rimbalzate
    from dem_recipients where sent_at is not null
    group by 1 order by 1
  `)
  console.log(`\n=== tasso di rimbalzo per settimana ===`)
  for (const x of trend.rows) {
    const p = Number(x.inviate) > 0 ? ((Number(x.rimbalzate) / Number(x.inviate)) * 100).toFixed(1) : "0"
    console.log(`  ${String(x.settimana).slice(0, 10)}  inviate:${String(x.inviate).padStart(6)}  rimbalzate:${String(x.rimbalzate).padStart(5)}  ${String(p).padStart(5)}%`)
  }

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
