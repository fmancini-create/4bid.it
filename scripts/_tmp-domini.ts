import { Client } from "pg"

/**
 * Tasso di rimbalzo MISURATO per dominio, e quanti indirizzi di quel dominio
 * restano in coda. Serve a decidere cosa togliere sulla base dei fatti, non
 * dell'impressione che "libero.it sia vecchio".
 */
async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const r = await c.query(`
    with per_dominio as (
      select lower(split_part(email,'@',2)) d,
             count(*) filter (where send_status in ('sent','bounced','opened')) provate,
             count(*) filter (where send_status='bounced') rimbalzate,
             count(*) filter (where send_status='pending') in_coda
      from dem_recipients
      group by 1
    )
    select d, provate, rimbalzate, in_coda,
           round(rimbalzate * 100.0 / nullif(provate,0), 1) as tasso
    from per_dominio
    where provate >= 40
    order by tasso desc nulls last
    limit 14
  `)
  console.log(`=== domini con almeno 40 invii provati, per tasso di rimbalzo ===`)
  console.log(`  ${"dominio".padEnd(26)} provate  rimbalzate   tasso   in coda`)
  for (const x of r.rows) {
    console.log(
      `  ${String(x.d).padEnd(26)} ${String(x.provate).padStart(7)} ${String(x.rimbalzate).padStart(11)} ${String(x.tasso ?? "-").padStart(6)}% ${String(x.in_coda).padStart(9)}`,
    )
  }

  // Quanto pesa in coda l'insieme dei domini con tasso alto (>= 10%)?
  const agg = await c.query(`
    with per_dominio as (
      select lower(split_part(email,'@',2)) d,
             count(*) filter (where send_status in ('sent','bounced','opened')) provate,
             count(*) filter (where send_status='bounced') rimbalzate
      from dem_recipients group by 1
    ),
    cattivi as (
      select d from per_dominio where provate >= 20 and rimbalzate * 100.0 / nullif(provate,0) >= 10
    )
    select count(*) n from dem_recipients r
    join cattivi b on b.d = lower(split_part(r.email,'@',2))
    where r.send_status = 'pending'
  `)
  const coda = await c.query(`select count(*) n from dem_recipients where send_status='pending'`)
  console.log(
    `\n=== in coda su domini con tasso misurato >= 10%: ${agg.rows[0].n} su ${coda.rows[0].n} totali ===`,
  )

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
