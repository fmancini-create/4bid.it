// Diagnostico usa-e-getta: quale manomissione dell'URL produce i valori corrotti
// realmente presenti in dem_unsubscribes? Nessuna scrittura.
import pg from "pg"
import fs from "node:fs"

const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

// Decodificatore VECCHIO, copiato tale e quale dal codice in produzione.
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

const rotte = await c.query(
  `select email, reason, campaign_id, created_at from dem_unsubscribes
    where email ~ '[^\\x20-\\x7E]' or email like '%\uFFFD%' order by created_at`
)
console.log("=== valori corrotti realmente in tabella: " + rotte.rows.length + " ===")
for (const r of rotte.rows) {
  const b = Buffer.from(r.email, "utf8")
  console.log(
    "  lung=" + String(r.email.length).padEnd(4) +
    " byte=" + String(b.length).padEnd(4) +
    " sostituz=" + String((r.email.match(/\uFFFD/g) || []).length).padEnd(4) +
    " chiocciole=" + (r.email.match(/@/g) || []).length +
    "  " + JSON.stringify(r.email.slice(0, 34))
  )
}

// Campione di email vere da cui simulare i link.
const righe = fs.readFileSync("public/dem/hotels-italia.csv", "utf8").split("\n").slice(1)
const emails = []
for (const l of righe) {
  const m = l.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)
  if (m) emails.push(m[0].toLowerCase())
  if (emails.length >= 4000) break
}

const enc = (e) =>
  Buffer.from(e, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

// Manomissioni plausibili operate da client di posta, proxy antivirus e filtri.
const manomissioni = {
  "tutto minuscolo": (s) => s.toLowerCase(),
  "tutto MAIUSCOLO": (s) => s.toUpperCase(),
  "troncato di 1": (s) => s.slice(0, -1),
  "troncato di 2": (s) => s.slice(0, -2),
  "troncato di 3": (s) => s.slice(0, -3),
  "trattini persi": (s) => s.replace(/-/g, ""),
  "underscore persi": (s) => s.replace(/_/g, ""),
  "- e _ in +/ non decodificati": (s) => s.replace(/-/g, "%2D"),
  "primo carattere perso": (s) => s.slice(1),
}

console.log("\n=== quale manomissione produce spazzatura CON la chiocciola (che la vecchia guardia accettava)? ===")
for (const [nome, f] of Object.entries(manomissioni)) {
  let accettate = 0
  let corrotte = 0
  for (const e of emails) {
    const out = vecchio(f(enc(e)))
    if (out === null) continue
    accettate++
    if (/\uFFFD/.test(out) || out !== e) corrotte++
  }
  const pct = ((corrotte / emails.length) * 100).toFixed(2)
  console.log(
    "  " + nome.padEnd(32) +
    " accettate=" + String(accettate).padEnd(6) +
    " corrotte=" + String(corrotte).padEnd(6) +
    " (" + pct + "% del campione)"
  )
}

await c.end()
