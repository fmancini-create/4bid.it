// Sola lettura. Ipotesi: un client di posta / scanner ha MINUSCOLIZZATO l'URL,
// quindi il base64url e' stato corrotto e la decodifica ha prodotto spazzatura
// che per caso conteneva "@" -> la guardia `decoded.includes("@")` l'ha accettata.
//
// La verifico in AVANTI (nessuna ambiguita'): per ogni destinatario noto calcolo
// base64url(email) -> lo minuscolizzo -> lo decodifico -> confronto con la
// stringa corrotta salvata. Se combacia, ho identificato la persona.
import pg from "pg"

const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

// riproduce esattamente encodeEmail() della send route
const encodeEmail = (email) =>
  Buffer.from(email.trim().toLowerCase(), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

// riproduce esattamente decodeEmail() della route di disiscrizione
const decodeEmail = (raw) => {
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(padded, "base64").toString("utf8")
}

const { rows: unsubRows } = await client.query(
  `select email, reason, campaign_id, created_at from dem_unsubscribes`
)
const rotte = unsubRows.filter((r) => /[^\x20-\x7E]/.test(String(r.email)))
console.log("righe corrotte da identificare:", rotte.length)

// candidati: TUTTI i destinatari mai caricati (l'email potrebbe stare in qualsiasi campagna)
const { rows: cand } = await client.query(
  `select distinct lower(email) as email from dem_recipients where email is not null`
)
console.log("candidati esaminati:", cand.length)

// indice: variante minuscolizzata -> email reale
const perLower = new Map()
// indice di controllo: variante MAIUSCOLIZZATA (altra ipotesi possibile)
const perUpper = new Map()
for (const c of cand) {
  const enc = encodeEmail(c.email)
  perLower.set(decodeEmail(enc.toLowerCase()), c.email)
  perUpper.set(decodeEmail(enc.toUpperCase()), c.email)
}

let viaLower = 0
let viaUpper = 0
const trovate = []
const irrecuperabili = []
for (const r of rotte) {
  const grezza = String(r.email)
  if (perLower.has(grezza)) {
    viaLower++
    trovate.push({ reale: perLower.get(grezza), via: "minuscolo", motivo: r.reason, campaign_id: r.campaign_id, corrotta: grezza })
  } else if (perUpper.has(grezza)) {
    viaUpper++
    trovate.push({ reale: perUpper.get(grezza), via: "MAIUSCOLO", motivo: r.reason, campaign_id: r.campaign_id, corrotta: grezza })
  } else {
    irrecuperabili.push(r)
  }
}

console.log("\n=== ESITO DELLA PROVA ===")
console.log("  identificate con ipotesi MINUSCOLO:", viaLower)
console.log("  identificate con ipotesi MAIUSCOLO:", viaUpper)
console.log("  non identificate:", irrecuperabili.length)

if (trovate.length) {
  console.log("\n=== persone che avevano chiesto la disiscrizione e NON sono soppresse ===")
  for (const t of trovate) {
    const [u, d] = t.reale.split("@")
    console.log(`  ${u.slice(0, 2)}***@${d}  (via ${t.via}, motivo ${t.motivo})`)
  }

  // Sono ancora raggiungibili? Cioe' la nuova DEM le colpirebbe?
  const reali = trovate.map((t) => t.reale)
  const { rows: ancora } = await client.query(
    `select lower(email) as email, count(*)::int as righe,
            count(*) filter (where send_status='sent')::int as gia_ricevute
       from dem_recipients where lower(email) = any($1::text[]) group by 1`,
    [reali]
  )
  console.log("\n=== stato nei destinatari ===")
  console.table(ancora.map((a) => ({ email: a.email.replace(/^(..)[^@]*/, "$1***"), righe: a.righe, gia_ricevute: a.gia_ricevute })))

  const { rows: soppresse } = await client.query(
    `select count(*)::int as n from dem_unsubscribes where lower(email) = any($1::text[])`,
    [reali]
  )
  console.log("  di queste, quante sono correttamente in suppression list:", soppresse[0].n, "su", reali.length)
  console.log("  -> se 0, riceverebbero la nuova DEM pur avendo cliccato 'disiscrivimi'")
}

if (irrecuperabili.length) {
  console.log("\n=== righe non identificate (ipotesi da rivedere) ===")
  for (const r of irrecuperabili.slice(0, 10)) {
    console.log(`  lunghezza=${String(r.email).length} motivo=${r.reason} campagna=${r.campaign_id || "-"}`)
  }
}

await client.end()
