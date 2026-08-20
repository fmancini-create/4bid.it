// Semina hospitality_properties dalle candidate ricavate dai destinatari DEM.
// Idempotente: si puo' rieseguire, l'upsert su identity_key non crea doppioni.
import pg from "pg"

const raw = process.env.SUPABASE_POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL_NON_POOLING || ""
if (!raw) {
  console.log("  ASSENTE: nessuna stringa di connessione. Non concludo nulla.")
  process.exit(1)
}
// `sslmode=require` viene letto da pg>=8.16 come verify-full e sovrascrive
// l'opzione ssl passata a mano: va tolto dalla stringa.
const conn = raw.replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : "")).replace(/\?$/, "")

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })

async function main() {
  await client.connect()

  const prima = (await client.query("SELECT count(*)::int n FROM hospitality_properties")).rows[0].n
  const codaPrima = (await client.query("SELECT count(*)::int n FROM hospitality_crawl_queue")).rows[0].n
  console.log(`  righe PRIMA:  properties=${prima}  coda=${codaPrima}`)
  console.log()

  let giro = 0
  let toccateTot = 0
  let codaTot = 0
  const MAX_GIRI = 60

  while (giro < MAX_GIRI) {
    giro++
    const r = (await client.query("SELECT * FROM censimento_semina_lotto($1)", [2000])).rows[0]
    toccateTot += Number(r.toccate)
    codaTot += Number(r.in_coda)
    console.log(
      `  lotto ${String(giro).padStart(2)}: toccate=${String(r.toccate).padStart(5)} ` +
        `in_coda=${String(r.in_coda).padStart(5)} offset=${r.nuovo_offset}/${r.totale}` +
        (r.esaurito ? "  ESAURITO" : ""),
    )
    if (r.esaurito) break
  }

  const dopo = (await client.query("SELECT count(*)::int n FROM hospitality_properties")).rows[0].n
  const codaDopo = (await client.query("SELECT count(*)::int n FROM hospitality_crawl_queue")).rows[0].n

  console.log()
  console.log(`  righe DOPO:   properties=${dopo}  coda=${codaDopo}`)
  console.log(`  differenza properties: ${dopo - prima}`)
  console.log(`  differenza coda:       ${codaDopo - codaPrima}`)
  console.log()

  // Il numero che conta: la composizione per stato. Se "unknown" e' 0 la semina
  // non ha prodotto nulla di censibile, anche se le righe sono aumentate.
  const comp = await client.query(
    `SELECT technology_status, count(*)::int n FROM hospitality_properties GROUP BY 1 ORDER BY 2 DESC`,
  )
  console.log("  === composizione per stato ===")
  comp.rows.forEach((r) => console.log(`    ${String(r.technology_status).padEnd(12)} ${r.n}`))

  const conSito = (
    await client.query("SELECT count(*)::int n FROM hospitality_properties WHERE website_host IS NOT NULL")
  ).rows[0].n
  console.log()
  console.log(`  con sito (censibili): ${conSito}`)
  console.log(`  in coda di scansione: ${codaDopo}`)

  // Controllo di coerenza dichiarato: la coda deve contenere solo chi ha un sito.
  const codaSenzaSito = (
    await client.query(
      `SELECT count(*)::int n FROM hospitality_crawl_queue q
       JOIN hospitality_properties p ON p.id = q.property_id
       WHERE p.website_host IS NULL`,
    )
  ).rows[0].n
  console.log(`  in coda SENZA sito:   ${codaSenzaSito}  (atteso 0)`)

  await client.end()
}

main().catch(async (e) => {
  console.log("  ERRORE: " + e.message)
  try {
    await client.end()
  } catch {}
  process.exit(1)
})
