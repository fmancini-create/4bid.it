// Quanti dei domini dei destinatari DEM sono caselle personali (gmail, libero...)?
//
// Conta perche' il censimento raggruppa per dominio: se `gmail.com` entrasse come
// una struttura, diventerebbe UNA riga con migliaia di indirizzi di strutture
// diverse fra loro. Non e' un dettaglio estetico: falserebbe ogni conteggio e
// mescolerebbe destinatari che non hanno niente in comune.
import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

if (!conn) {
  console.log("  NESSUNA stringa di connessione: non misuro nulla e lo dico.")
  process.exit(1)
}

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const q = async (etichetta, sql) => {
  try {
    const { rows } = await c.query(sql)
    console.log(`\n  ${etichetta}`)
    rows.forEach((r) => console.log("    " + JSON.stringify(r)))
  } catch (e) {
    console.log(`\n  ${etichetta}: ERRORE ${e.message}`)
  }
}

// I 25 domini piu' frequenti: le caselle personali salteranno all'occhio.
await q(
  "domini piu' frequenti fra i destinatari DEM",
  `SELECT lower(split_part(email,'@',2)) dominio, count(DISTINCT lower(email))::int indirizzi
   FROM dem_recipients WHERE email LIKE '%@%'
   GROUP BY 1 ORDER BY 2 DESC LIMIT 25`
)

await q(
  "quanti indirizzi stanno su domini con PIU' di 5 indirizzi distinti",
  `WITH d AS (
     SELECT lower(split_part(email,'@',2)) dominio, count(DISTINCT lower(email))::int n
     FROM dem_recipients WHERE email LIKE '%@%' GROUP BY 1
   )
   SELECT count(*)::int domini_grandi, sum(n)::int indirizzi_coinvolti FROM d WHERE n > 5`
)

await q(
  "totale domini e indirizzi",
  `SELECT count(DISTINCT lower(split_part(email,'@',2)))::int domini,
          count(DISTINCT lower(email))::int indirizzi
   FROM dem_recipients WHERE email LIKE '%@%'`
)

await c.end()
