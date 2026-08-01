import { Client } from "pg"

/**
 * `sent_count` e' un contatore MEMORIZZATO sulla campagna, incrementato a ogni
 * invio. Il numero VERO e' quante righe hanno send_status='sent'.
 * Se i due divergono, la pagina di controllo mostra un numero falso.
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const r = await c.query(`
    select ca.name,
           ca.sent_count as contatore_memorizzato,
           count(*) filter (where r.send_status in ('sent','bounced','opened')) as inviate_vere,
           count(*) filter (where r.send_status = 'bounced') as rimbalzate
    from dem_campaigns ca
    left join dem_recipients r on r.campaign_id = ca.id
    group by ca.id, ca.name, ca.sent_count
    having ca.sent_count is distinct from count(*) filter (where r.send_status in ('sent','bounced','opened'))
    order by ca.name
  `)

  console.log(`=== campagne dove il contatore NON corrisponde al numero vero: ${r.rows.length} ===`)
  for (const x of r.rows) {
    const d = Number(x.inviate_vere) - Number(x.contatore_memorizzato)
    console.log(
      `  ${String(x.name).slice(0, 44).padEnd(46)} memorizzato:${String(x.contatore_memorizzato).padStart(6)}  vero:${String(x.inviate_vere).padStart(6)}  scarto:${d > 0 ? "+" : ""}${d}  (di cui rimbalzate:${x.rimbalzate})`,
    )
  }
  if (r.rows.length === 0) console.log("  nessuna: i contatori sono allineati")

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
