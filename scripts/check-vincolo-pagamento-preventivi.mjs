// Verifica che il vincolo sales_channel_quotes_pagamento_coerente MORDA davvero.
//
// Perche' esiste: il cron dei solleciti filtra con `payment_status <> 'paid'`, che
// su NULL vale NULL, quindi la riga viene SCARTATA (nessun sollecito, per sempre,
// senza errori). Il cruscotto invece la mostra come da pagare, perche' in
// JavaScript `null !== "paid"` e' VERO. Il vincolo impedisce la riga ambigua.
//
// Un vincolo presente nel catalogo NON e' un vincolo applicato: si prova solo
// scrivendo una riga che DEVE essere respinta. Le righe di prova vengono sempre
// cancellate.
const u = process.env.SUPABASE_URL
const k = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!u || !k) {
  console.log("  credenziali Supabase assenti: impossibile verificare")
  process.exit(1)
}

const H = { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json", Prefer: "return=representation" }
const TABELLA = "sales_channel_quotes"

let male = 0

async function prova(nome, riga, atteso) {
  const r = await fetch(`${u}/rest/v1/${TABELLA}`, { method: "POST", headers: H, body: JSON.stringify(riga) })
  const ok = atteso === "rifiuto" ? r.status >= 400 : r.status < 400
  if (!ok) male++
  console.log(`  ${ok ? "OK  " : "MALE"} ${nome} -> HTTP ${r.status} (atteso ${atteso})`)

  const b = await r.json().catch(() => null)
  if (r.status < 400) {
    await fetch(`${u}/rest/v1/${TABELLA}?id=eq.${b[0].id}`, { method: "DELETE", headers: H })
    console.log("        riga di prova CANCELLATA")
  } else {
    // Stampo QUALE vincolo ha morso: senza questo, un rifiuto per un altro
    // motivo passerebbe per una prova riuscita.
    const nomeVincolo = (JSON.stringify(b).match(/sales_channel_quotes_\w+/) || ["(non nominato)"])[0]
    console.log("        vincolo che ha morso:", nomeVincolo)
    if (atteso === "rifiuto" && nomeVincolo !== "sales_channel_quotes_pagamento_coerente") {
      male++
      console.log("        MALE: rifiutata dal vincolo SBAGLIATO, non prova nulla")
    }
  }
}

const base = { client_name: "PROVA VINCOLO - da cancellare", title: "PROVA VINCOLO" }

// I due casi della trappola NULL: stato avanzato senza pagamento registrato.
// Sono le righe che il cron scarterebbe in silenzio.
await prova("status=accepted, payment_status NULLO", { ...base, status: "accepted" }, "rifiuto")
await prova("status=paid, payment_status NULLO", { ...base, status: "paid" }, "rifiuto")

// Casi legittimi: il vincolo non deve essere troppo severo.
await prova("accepted con pending", { ...base, status: "accepted", payment_status: "pending" }, "accettata")
await prova("accepted in attesa di bonifico", { ...base, status: "accepted", payment_status: "awaiting_transfer" }, "accettata")
await prova("paid con paid", { ...base, status: "paid", payment_status: "paid" }, "accettata")
// La creazione di un preventivo nasce 'draft' senza pagamento: deve passare.
await prova("draft senza pagamento (creazione)", { ...base, status: "draft" }, "accettata")
await prova("sent senza pagamento", { ...base, status: "sent" }, "accettata")

console.log(
  male === 0
    ? "\n  TUTTE E 7 COME ATTESO: il vincolo morde e non blocca i flussi legittimi"
    : `\n  ${male} PROVE FALLITE`,
)
process.exit(male === 0 ? 0 : 1)
