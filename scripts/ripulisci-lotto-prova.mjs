// Rimette in coda le strutture del primo lotto di prova e cancella i
// rilevamenti che ne erano usciti.
//
// Serve perche' quel lotto e' girato col difetto dei falsi positivi: due delle
// cinque righe attribuivano Beds24 a strutture che non lo usano. Lasciarle
// significherebbe tenere dati sbagliati in una tabella che alimenta le DEM.
//
// Cancella SOLO le righe di quel lotto (quelle gia' esaminate), non tutto.
import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const uno = async (sql, p = []) => Object.values((await c.query(sql, p)).rows[0] ?? {})[0]

console.log("=== PRIMA ===")
console.log(`  rilevamenti:        ${await uno("SELECT count(*)::int FROM hospitality_technology_detections")}`)
console.log(`  strutture detected: ${await uno("SELECT count(*)::int FROM hospitality_properties WHERE technology_status='detected'")}`)
console.log(`  coda completed:     ${await uno("SELECT count(*)::int FROM hospitality_crawl_queue WHERE status='completed'")}`)
console.log(`  coda failed:        ${await uno("SELECT count(*)::int FROM hospitality_crawl_queue WHERE status='failed'")}`)
console.log(`  host sconosciuti:   ${await uno("SELECT count(*)::int FROM hospitality_unknown_booking_hosts")}`)

await c.query("BEGIN")
try {
  // 1) via i rilevamenti: sono tutti del lotto di prova.
  const det = await c.query("DELETE FROM hospitality_technology_detections")
  // 2) le strutture toccate tornano allo stato di partenza.
  const pro = await c.query(`
    UPDATE hospitality_properties
       SET technology_status = 'unknown',
           booking_engine_provider = NULL, booking_engine_confidence = NULL,
           pms_provider = NULL, pms_confidence = NULL,
           channel_manager_provider = NULL, channel_manager_confidence = NULL,
           -- Solo last_crawled_at: last_crawl_status e last_crawl_error NON
           -- esistono in questa tabella, li avevo dedotti dal nome invece di
           -- leggerli dallo schema. Lo stato del tentativo vive nella coda
           -- (hospitality_crawl_queue.last_error), non qui.
           last_crawled_at = NULL
     WHERE technology_status IN ('detected', 'unreachable', 'needs_review')`)
  // 3) la coda torna in attesa, contatore azzerato.
  const cod = await c.query(`
    UPDATE hospitality_crawl_queue
       SET status = 'pending', attempts = 0, locked_until = NULL, last_error = NULL
     WHERE status IN ('completed', 'failed', 'running')`)
  // 4) via gli host sconosciuti raccolti col difetto: alcuni erano il dominio
  //    della struttura stessa, e ripartendo si raccolgono di nuovo quelli buoni.
  const hos = await c.query("DELETE FROM hospitality_unknown_booking_hosts")
  await c.query("COMMIT")
  console.log()
  console.log("=== rimosso ===")
  console.log(`  rilevamenti cancellati: ${det.rowCount}`)
  console.log(`  strutture riportate a 'unknown': ${pro.rowCount}`)
  console.log(`  righe di coda rimesse in attesa: ${cod.rowCount}`)
  console.log(`  host sconosciuti cancellati: ${hos.rowCount}`)
} catch (e) {
  await c.query("ROLLBACK")
  console.log(`  FALLITO, nulla e' stato cambiato: ${e.message}`)
  await c.end()
  process.exit(1)
}

console.log()
console.log("=== DOPO (attesi tutti 0 tranne la coda in attesa) ===")
const d = await uno("SELECT count(*)::int FROM hospitality_technology_detections")
const s = await uno("SELECT count(*)::int FROM hospitality_properties WHERE technology_status='detected'")
const h = await uno("SELECT count(*)::int FROM hospitality_unknown_booking_hosts")
const p = await uno("SELECT count(*)::int FROM hospitality_crawl_queue WHERE status='pending'")
console.log(`  rilevamenti:        ${d}`)
console.log(`  strutture detected: ${s}`)
console.log(`  host sconosciuti:   ${h}`)
console.log(`  coda in attesa:     ${p}`)
console.log()
console.log(d === 0 && s === 0 && h === 0 ? "  PULITO" : "  ATTENZIONE: resta qualcosa")

await c.end()
