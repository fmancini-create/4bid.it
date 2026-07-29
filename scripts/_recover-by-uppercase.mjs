// Diagnostico usa-e-getta: se la corruzione nasce da un URL portato in
// MAIUSCOLO, allora per l'email vera E vale
//   vecchio( enc(E).toUpperCase() ) === valore_corrotto_in_tabella
// Cerco su TUTTA la lista, non su un campione. Nessuna scrittura.
import pg from "pg"
import fs from "node:fs"

const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

function vecchio(raw) {
  if (!raw) return null
  try {
    const n = raw.replace(/-/g, "+").replace(/_/g, "/")
    const p = n + "=".repeat((4 - (n.length % 4)) % 4)
    const d = Buffer.from(p, "base64").toString("utf8")
    if (d.includes("@")) return d.trim().toLowerCase()
  } catch {}
  if (raw.includes("@")) return decodeURIComponent(raw).trim().toLowerCase()
  return null
}
const enc = (e) =>
  Buffer.from(e, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

const rotte = (
  await c.query(
    `select email from dem_unsubscribes where email ~ '[^\\x20-\\x7E]' or email like '%\uFFFD%'`
  )
).rows.map((r) => r.email)

// Universo dei candidati: CSV master + tutti i destinatari mai caricati.
const universo = new Set()
for (const l of fs.readFileSync("public/dem/hotels-italia.csv", "utf8").split("\n")) {
  const m = l.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)
  if (m) universo.add(m[0].toLowerCase())
}
for (const r of (await c.query("select distinct lower(email) as e from dem_recipients")).rows) {
  universo.add(r.e)
}
console.log("candidati esaminati: " + universo.size + " | valori corrotti: " + rotte.length)

// Diverse manomissioni, per non fissarmi su una sola ipotesi.
const varianti = {
  MAIUSCOLO: (s) => s.toUpperCase(),
  "troncato -1": (s) => s.slice(0, -1),
  "troncato -2": (s) => s.slice(0, -2),
  "troncato -3": (s) => s.slice(0, -3),
  "troncato -4": (s) => s.slice(0, -4),
}

const trovati = new Map()
for (const [nome, f] of Object.entries(varianti)) {
  const indice = new Map()
  for (const e of universo) {
    const out = vecchio(f(enc(e)))
    if (out) indice.set(out, e)
  }
  for (const rotto of rotte) {
    const hit = indice.get(rotto.trim().toLowerCase())
    if (hit && !trovati.has(rotto)) trovati.set(rotto, { email: hit, via: nome })
  }
}

console.log("\n=== identita' recuperate: " + trovati.size + " su " + rotte.length + " ===")
for (const [rotto, info] of trovati) {
  console.log("  " + info.email.padEnd(42) + " (via " + info.via + ")")
}
if (trovati.size === 0) {
  console.log("  nessuna: la manomissione non e' fra quelle provate")
}

await c.end()
