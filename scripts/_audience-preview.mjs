// Sola lettura: calcola il pubblico pulito per la nuova DEM.
// CSV master MENO disiscritti MENO indirizzi che hanno fatto bounce.
import pg from "pg"
import fs from "fs"
import path from "path"

const raw = process.env.SUPABASE_POSTGRES_URL_NON_POOLING
const url = raw.replace(/[?&]sslmode=[^&]*/, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

// --- CSV master ---
const CSV = path.join(process.cwd(), "public", "dem", "hotels-italia.csv")
const lines = fs.readFileSync(CSV, "utf8").split(/\r?\n/)
const csvEmails = new Set()
let vuote = 0
let malformate = 0
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue
  const email = (lines[i].split(",")[0] || "").trim().toLowerCase().replace(/^"|"$/g, "")
  if (!email) { vuote++; continue }
  if (!email.includes("@") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { malformate++; continue }
  csvEmails.add(email)
}

// --- liste di esclusione dal DB ---
const { rows: unsubRows } = await client.query(`select lower(email) as email from dem_unsubscribes`)
const unsub = new Set(unsubRows.map((r) => r.email))

const { rows: deadRows } = await client.query(
  `select distinct lower(email) as email from dem_recipients
    where send_status in ('bounced','complained')`
)
const dead = new Set(deadRows.map((r) => r.email))

// --- intersezioni ---
let inUnsub = 0
let inDead = 0
let inBoth = 0
const pulite = []
for (const e of csvEmails) {
  const u = unsub.has(e)
  const d = dead.has(e)
  if (u && d) inBoth++
  if (u) inUnsub++
  if (d) inDead++
  if (!u && !d) pulite.push(e)
}

console.log("=== CSV master ===")
console.log("  email valide distinte:", csvEmails.size)
console.log("  righe senza email:", vuote, "| malformate scartate:", malformate)
console.log("\n=== liste di esclusione (dal DB) ===")
console.log("  disiscritti totali in dem_unsubscribes:", unsub.size)
console.log("  indirizzi morti (bounce/complaint):", dead.size)
console.log("\n=== intersezione col CSV ===")
console.log("  presenti nel CSV E disiscritti:", inUnsub)
console.log("  presenti nel CSV E morti:", inDead)
console.log("  in entrambe le liste (sovrapposizione):", inBoth)
console.log("\n=== RISULTATO ===")
console.log("  destinatari puliti per la nuova DEM:", pulite.length)
console.log("  esclusi in totale:", csvEmails.size - pulite.length)

// prova di correttezza: nessuna email pulita deve stare nelle liste
const violazioni = pulite.filter((e) => unsub.has(e) || dead.has(e))
console.log("\n  CONTROPROVA - email pulite che sono anche escluse (deve essere 0):", violazioni.length)

// controprova inversa: verifico che il filtro NON sia inerte
const campione = [...unsub].slice(0, 3)
console.log("  campione disiscritti:", campione.join(", "))
console.log("  sono nel CSV?", campione.map((e) => (csvEmails.has(e) ? "SI" : "no")).join(", "))
console.log("  sono nella lista pulita?", campione.map((e) => (pulite.includes(e) ? "SI (ERRORE!)" : "no")).join(", "))

await client.end()
