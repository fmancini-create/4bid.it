// Sola lettura. Ipotesi 2: il parametro `e` e' arrivato come email IN CHIARO
// (non base64). `Buffer.from(x,"base64")` in Node NON lancia: ignora i caratteri
// non validi e decodifica spazzatura. Se quella spazzatura contiene per caso il
// byte 0x40 ("@"), la guardia `decoded.includes("@")` la accetta e viene salvata
// al posto dell'email vera.
//
// Verifica IN AVANTI su tutti i candidati, con piu' varianti di trasformazione.
import pg from "pg"

const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

const decodeEmail = (raw) => {
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(padded, "base64").toString("utf8")
}
const encodeEmail = (email) =>
  Buffer.from(email.trim().toLowerCase(), "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

const { rows: unsubRows } = await client.query(`select email, reason, campaign_id from dem_unsubscribes`)
const rotte = unsubRows.filter((r) => /[^\x20-\x7E]/.test(String(r.email)))

const { rows: cand } = await client.query(
  `select distinct lower(email) as email from dem_recipients where email is not null`
)

// varianti: come poteva arrivare il parametro `e`
const varianti = {
  "email in chiaro": (e) => e,
  "email URL-encoded": (e) => encodeURIComponent(e),
  "email MAIUSCOLA in chiaro": (e) => e.toUpperCase(),
  "base64 standard (non url-safe)": (e) => Buffer.from(e, "utf8").toString("base64"),
  "base64url doppio": (e) => encodeEmail(encodeEmail(e)),
  "base64url senza padding rimosso": (e) => Buffer.from(e, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_"),
}

const indici = {}
for (const [nome, fn] of Object.entries(varianti)) {
  const m = new Map()
  for (const c of cand) {
    try { m.set(decodeEmail(fn(c.email)), c.email) } catch {}
  }
  indici[nome] = m
}

console.log("righe corrotte:", rotte.length, "| candidati:", cand.length)
console.log("\n=== quale variante spiega le righe corrotte? ===")
const esito = {}
const trovate = []
for (const r of rotte) {
  const grezza = String(r.email)
  let spiegata = null
  for (const [nome, m] of Object.entries(indici)) {
    if (m.has(grezza)) { spiegata = { variante: nome, reale: m.get(grezza) }; break }
  }
  if (spiegata) {
    esito[spiegata.variante] = (esito[spiegata.variante] || 0) + 1
    trovate.push({ ...spiegata, corrotta: grezza, campaign_id: r.campaign_id })
  } else {
    esito["NON SPIEGATA"] = (esito["NON SPIEGATA"] || 0) + 1
  }
}
console.table(esito)

if (trovate.length) {
  console.log("\n=== identificate ===")
  for (const t of trovate) {
    const [u, d] = t.reale.split("@")
    console.log(`  ${u.slice(0, 2)}***@${d}   (via: ${t.variante})`)
  }
  const reali = trovate.map((t) => t.reale)
  const { rows: sopp } = await client.query(
    `select count(*)::int as n from dem_unsubscribes where lower(email) = any($1::text[])`, [reali]
  )
  console.log(`\n  correttamente in suppression list: ${sopp[0].n} su ${reali.length}`)
}

// Se nulla spiega, mostro cosa contiene la spazzatura per capire la forma
if (esito["NON SPIEGATA"]) {
  console.log("\n=== analisi della spazzatura (per capire la forma originale) ===")
  for (const r of rotte.slice(0, 4)) {
    const g = String(r.email)
    const ascii = [...g].map((ch) => (/[\x20-\x7E]/.test(ch) ? ch : ".")).join("")
    console.log(`  ascii-visibile: "${ascii}"`)
  }
  // quanti byte 0x40 ci sono? spiega perche' la guardia le ha accettate
  const con40 = rotte.filter((r) => String(r.email).includes("@")).length
  console.log(`\n  righe corrotte che contengono "@": ${con40} su ${rotte.length}`)
  console.log("  -> e' esattamente il motivo per cui la guardia le ha accettate")
}

await client.end()
