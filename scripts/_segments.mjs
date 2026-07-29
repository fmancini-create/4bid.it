// Sola lettura: segmenti disponibili al netto di disiscritti e indirizzi morti.
import pg from "pg"
const u = process.env.SUPABASE_POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const c = new pg.Client({ connectionString: u, ssl: { rejectUnauthorized: false } })
await c.connect()

const sql = `
with esclusi as (
  select lower(email) as email from dem_unsubscribes
  union
  select distinct lower(email) from dem_recipients where send_status in ('bounced','complained')
),
puliti as (
  select distinct lower(email) as email from dem_recipients
   where email is not null and lower(email) not in (select email from esclusi)
)
select
  (select count(*) from puliti)::int as gia_in_lista_puliti,
  (select count(distinct lower(r.email)) from dem_recipients r
    where r.open_count > 0 and lower(r.email) in (select email from puliti))::int as hanno_aperto,
  (select count(distinct lower(r.email)) from dem_recipients r
    where r.click_count > 0 and lower(r.email) in (select email from puliti))::int as hanno_cliccato,
  (select count(distinct lower(r.email)) from dem_recipients r
    where r.send_status = 'sent' and coalesce(r.open_count,0) = 0
      and lower(r.email) in (select email from puliti))::int as mai_aperto
`
const r = await c.query(sql)
console.log("=== segmenti (esclusi disiscritti e indirizzi morti) ===")
console.table(r.rows)
await c.end()
