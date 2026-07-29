// Sola lettura: le email in dem_unsubscribes sono valide o corrotte?
import pg from "pg"

const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

const { rows } = await client.query(
  `select email, reason, created_at from dem_unsubscribes order by created_at desc`
)

const valida = (e) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
const nonStampabile = (e) => /[^\x20-\x7E]/.test(String(e))

const ok = []
const rotte = []
for (const r of rows) {
  if (valida(r.email) && !nonStampabile(r.email)) ok.push(r)
  else rotte.push(r)
}

console.log("=== integrita' della suppression list ===")
console.log("  righe totali:", rows.length)
console.log("  email VALIDE:", ok.length)
console.log("  email SOSPETTE/ROTTE:", rotte.length)

if (rotte.length) {
  console.log("\n=== righe sospette (primi 12) ===")
  for (const r of rotte.slice(0, 12)) {
    const grezza = String(r.email)
    console.log(
      `  motivo=${r.reason || "-"} | lunghezza=${grezza.length} | caratteri_non_stampabili=${nonStampabile(grezza) ? "SI" : "no"} | data=${new Date(r.created_at).toISOString().slice(0, 10)}`
    )
    console.log(`     esadecimale (primi 40 byte): ${Buffer.from(grezza, "utf8").subarray(0, 40).toString("hex")}`)
  }
  console.log("\n=== motivi delle righe rotte ===")
  const perMotivo = {}
  for (const r of rotte) perMotivo[r.reason || "(nessuno)"] = (perMotivo[r.reason || "(nessuno)"] || 0) + 1
  console.table(perMotivo)
} else {
  console.log("\n  nessuna riga corrotta: il campione illeggibile era un artefatto della mia stampa")
}

console.log("\n=== campione di email VALIDE (per controprova) ===")
for (const r of ok.slice(0, 5)) {
  const [u, d] = r.email.split("@")
  console.log(`  ${u.slice(0, 2)}***@${d}  (motivo: ${r.reason})`)
}

await client.end()
