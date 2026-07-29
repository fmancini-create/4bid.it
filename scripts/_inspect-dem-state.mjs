// Ispezione sola lettura dello stato DEM su SUPABASE (non Neon).
import pg from "pg"

const raw = process.env.SUPABASE_POSTGRES_URL_NON_POOLING
if (!raw) {
  console.error("MANCA SUPABASE_POSTGRES_URL_NON_POOLING")
  process.exit(1)
}
const url = raw.replace(/[?&]sslmode=[^&]*/, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

const q = async (label, sql, params = []) => {
  try {
    const r = await client.query(sql, params)
    console.log(`\n=== ${label} ===`)
    console.table(r.rows)
    return r.rows
  } catch (e) {
    console.log(`\n=== ${label} ===\n  ERRORE: ${e.message}`)
    return null
  }
}

await client.connect()
console.log("connesso a Supabase")

await q(
  "campagne esistenti",
  `select id, name, status, campaign_kind, sent_at::date as inviata,
          (select count(*) from dem_recipients r where r.campaign_id = c.id) as destinatari
     from dem_campaigns c order by created_at desc limit 20`
)

await q("totale disiscritti (suppression list)", `select count(*)::int as disiscritti from dem_unsubscribes`)

await q(
  "disiscritti per motivo",
  `select coalesce(reason,'(nessuno)') as motivo, count(*)::int as quanti
     from dem_unsubscribes group by 1 order by 2 desc`
)

await q(
  "indirizzi morti: bounce/complaint (da escludere anche loro)",
  `select send_status, count(distinct lower(email))::int as email_distinte
     from dem_recipients where send_status in ('bounced','complained')
     group by 1`
)

await q(
  "quante email distinte hanno gia' ricevuto qualcosa",
  `select count(distinct lower(email))::int as email_contattate
     from dem_recipients where send_status = 'sent'`
)

await q(
  "colonne di dem_campaigns (per costruire l'insert corretto)",
  `select column_name, data_type, column_default, is_nullable
     from information_schema.columns
    where table_schema='public' and table_name='dem_campaigns'
    order by ordinal_position`
)

await q(
  "vincolo su tipo_contatto",
  `select pg_get_constraintdef(oid) as definizione
     from pg_constraint
    where conrelid = 'dem_recipients'::regclass and contype = 'c'`
)

await client.end()
console.log("\nfine ispezione (nessuna scrittura effettuata)")
