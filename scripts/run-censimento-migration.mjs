// Applica scripts/censimento-gestionali-20-08-2026.sql e VERIFICA il risultato
// interrogando il database, invece di fidarsi del fatto che il comando non abbia
// dato errore. Un "applicata" dichiarato e non misurato e' peggio di un errore.
import fs from "node:fs"
import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

if (!conn) {
  console.error("  NESSUNA stringa di connessione: non applico niente.")
  process.exit(1)
}

const file = "scripts/censimento-gestionali-20-08-2026.sql"
const sql = fs.readFileSync(file, "utf8")

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

try {
  console.log(`  applico ${file} (${sql.length} caratteri)...`)
  await c.query("BEGIN")
  await c.query(sql)
  await c.query("COMMIT")
  console.log("  comando eseguito senza errori\n")
} catch (e) {
  await c.query("ROLLBACK")
  console.error("  FALLITA, annullata: " + e.message)
  await c.end()
  process.exit(1)
}

// --- verifica: gli oggetti esistono DAVVERO? ---
const controlla = async (etichetta, sqlq, attesa) => {
  try {
    const { rows } = await c.query(sqlq)
    const v = rows[0] ? Object.values(rows[0])[0] : null
    const ok = attesa === undefined || String(v) === String(attesa) || (attesa === ">0" && Number(v) > 0)
    console.log(`  ${ok ? "OK  " : "NO  "} ${etichetta}: ${v}`)
    return ok
  } catch (e) {
    console.log(`  NO   ${etichetta}: ERRORE ${e.message}`)
    return false
  }
}

console.log("=== verifica degli oggetti creati ===")
let tutto = true
tutto &&= await controlla(
  "tabella hospitality_consumer_domains",
  "SELECT count(*)::int FROM hospitality_consumer_domains",
  ">0"
)
tutto &&= await controlla(
  "vista hospitality_seed_candidates",
  "SELECT count(*)::int FROM hospitality_seed_candidates",
  ">0"
)
tutto &&= await controlla(
  "funzione censimento_semina_lotto",
  "SELECT count(*)::int FROM pg_proc WHERE proname='censimento_semina_lotto'",
  1
)
tutto &&= await controlla(
  "funzione censimento_per_gestionale",
  "SELECT count(*)::int FROM pg_proc WHERE proname='censimento_per_gestionale'",
  1
)
tutto &&= await controlla(
  "indici nuovi",
  "SELECT count(*)::int FROM pg_indexes WHERE indexname IN ('idx_hosp_pms_provider','idx_hosp_tech_status','idx_hosp_be_provider','idx_hosp_queue_next')",
  4
)

console.log("\n=== composizione delle candidate (il numero che conta) ===")
const { rows: comp } = await c.query(`
  SELECT technology_status stato, count(*)::int candidate,
         sum(coalesce(array_length(emails,1),0))::int indirizzi
  FROM hospitality_seed_candidates GROUP BY 1 ORDER BY 2 DESC`)
comp.forEach((r) => console.log(`  ${String(r.stato).padEnd(12)} candidate=${String(r.candidate).padStart(6)}  indirizzi=${r.indirizzi}`))

const { rows: tot } = await c.query("SELECT count(*)::int n FROM hospitality_seed_candidates")
console.log(`  TOTALE candidate: ${tot[0].n}`)

await c.end()
process.exit(tutto ? 0 : 1)
