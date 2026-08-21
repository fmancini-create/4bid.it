// Quante strutture DAVVERO possiamo censire, e con quale sito.
// Il censimento serve a filtrare le DEM per gestionale: la fonte deve essere
// la stessa da cui escono i destinatari, altrimenti i due numeri divergono.

import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || process.env.SUPABASE_POSTGRES_URL || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const uno = async (etichetta, sql) => {
  try {
    const { rows } = await c.query(sql)
    console.log(`  ${etichetta}: ${JSON.stringify(rows[0])}`)
  } catch (e) {
    console.log(`  ${etichetta}: ERRORE ${e.message}`)
  }
}

console.log("=== dem_recipients: da qui escono i destinatari ===")
await uno("righe / email distinte / domini distinti", `
  SELECT count(*)::int AS righe,
         count(DISTINCT lower(email))::int AS email_distinte,
         count(DISTINCT lower(split_part(email,'@',2)))::int AS domini_distinti
    FROM dem_recipients WHERE email IS NOT NULL`)

console.log("\n=== dem_domain_checks: 16.865 domini gia' verificati ===")
const { rows: cols } = await c.query(
  `SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dem_domain_checks' ORDER BY ordinal_position`,
)
console.log(`  colonne: ${cols.map((r) => r.column_name).join(", ")}`)

console.log("\n=== scidoo_properties: la directory che ho costruito ===")
await uno("attive / con sito / host distinti", `
  SELECT count(*)::int AS attive,
         count(website_url)::int AS con_sito,
         count(DISTINCT lower(regexp_replace(website_url,'^https?://(www\\.)?','')))::int AS host_distinti
    FROM scidoo_properties WHERE is_active`)

console.log("\n=== sovrapposizione: le Scidoo sono fra i destinatari DEM? ===")
await uno("host Scidoo presenti fra i domini DEM", `
  WITH s AS (
    SELECT DISTINCT lower(split_part(regexp_replace(website_url,'^https?://(www\\.)?',''),'/',1)) AS host
      FROM scidoo_properties WHERE is_active AND website_url IS NOT NULL
  ), d AS (
    SELECT DISTINCT lower(split_part(email,'@',2)) AS dom FROM dem_recipients WHERE email IS NOT NULL
  )
  SELECT (SELECT count(*)::int FROM s) AS host_scidoo,
         (SELECT count(*)::int FROM s JOIN d ON d.dom = s.host) AS in_comune`)

await c.end()
