import { Client } from "pg"

/**
 * La campagna clienti ha 15 righe: abbastanza poche da guardarle tutte invece
 * di formulare ipotesi sul +1.
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const r = await c.query(`
    select email, send_status, sent_at, created_at, tipo_contatto
    from dem_recipients
    where campaign_id = 'b9d32eb8-c4af-4487-9701-450fdb58e515'
    order by sent_at nulls first
  `)
  console.log(`=== tutte le ${r.rows.length} righe della campagna clienti ===`)
  r.rows.forEach((x: any, i: number) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. ${String(x.email).padEnd(40)} ${String(x.send_status).padEnd(8)} inviata:${x.sent_at ? String(x.sent_at).slice(0, 19) : "MAI"}`,
    )
  })

  const ca = await c.query(
    `select sent_count, failed_count, status, created_at, updated_at from dem_campaigns where id='b9d32eb8-c4af-4487-9701-450fdb58e515'`,
  )
  const x = ca.rows[0]
  console.log(
    `\n=== contatori della campagna ===\n  sent_count:${x.sent_count}  failed_count:${x.failed_count}  stato:${x.status}`,
  )

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
