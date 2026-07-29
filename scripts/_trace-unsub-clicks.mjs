// Sola lettura: provo a identificare le 10 disiscrizioni corrotte incrociando
// gli eventi di tracciamento vicini nel tempo (chi ha cliccato in quel momento).
import pg from "pg"

const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

const q = async (label, sql, params = []) => {
  try {
    const r = await client.query(sql, params)
    console.log(`\n=== ${label} ===`)
    if (!r.rows.length) console.log("  (nessuna riga)")
    else console.table(r.rows)
    return r.rows
  } catch (e) {
    console.log(`\n=== ${label} ===\n  ERRORE: ${e.message}`)
    return []
  }
}

await q(
  "schema di dem_tracking_events",
  `select column_name, data_type from information_schema.columns
    where table_schema='public' and table_name='dem_tracking_events' order by ordinal_position`
)

// le 10 righe corrotte con timestamp preciso
const { rows: rotte } = await client.query(
  `select email, campaign_id, created_at from dem_unsubscribes
    where email ~ '[^\\x20-\\x7E]' order by created_at`
)
console.log("\n=== righe corrotte con orario ===")
for (const r of rotte) console.log(`  ${new Date(r.created_at).toISOString()}  campagna_grezza=${r.campaign_id}`)

// esistono davvero quelle campagne?
await q(
  "i campaign_id corrotti esistono in dem_campaigns?",
  `select u.campaign_id, (c.id is not null) as esiste
     from (select distinct campaign_id from dem_unsubscribes where email ~ '[^\\x20-\\x7E]') u
     left join dem_campaigns c on c.id = u.campaign_id`
)

// eventi di tracciamento nella stessa finestra temporale
for (const r of rotte.slice(0, 4)) {
  await q(
    `eventi entro 3 minuti da ${new Date(r.created_at).toISOString().slice(0, 16)}`,
    `select e.event_type, e.created_at,
            left(coalesce(r.email,'?'), 2) || '***@' || split_part(coalesce(r.email,'?'),'@',2) as destinatario
       from dem_tracking_events e
       left join dem_recipients r on r.id = e.recipient_id
      where e.created_at between $1::timestamptz - interval '3 minutes'
                             and $1::timestamptz + interval '3 minutes'
      order by e.created_at limit 8`,
    [r.created_at]
  )
}

await client.end()
