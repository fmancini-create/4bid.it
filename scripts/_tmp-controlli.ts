import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const mail = ["andrea.tesi.mancini@gmail.com", "f.mancini@4bid.it"]
  // Rispettare le disiscrizioni e' obbligatorio: verifico PRIMA di inserire.
  const u = await c.query(`select email from dem_unsubscribes where lower(email) = any($1)`, [mail])
  console.log("=== risultano disiscritti? ===")
  console.log(u.rows.length === 0 ? "  nessuno dei due: si puo' procedere" : "  " + u.rows.map((r:any)=>r.email).join(", "))
  const ca = await c.query(`select id, name, status, auto_send, subject, length(html_template) len from dem_campaigns where name ilike '%Traffico aereo (clienti)%'`)
  console.log("\n=== campagna clienti ===")
  for (const r of ca.rows) console.log(`  id:${r.id}\n  nome:${r.name}\n  stato:${r.status}  auto:${r.auto_send}\n  oggetto:${r.subject}\n  html:${r.len} caratteri`)
  const ex = await c.query(`select r.email, r.send_status from dem_recipients r join dem_campaigns ca on ca.id=r.campaign_id where ca.name ilike '%Traffico aereo (clienti)%' and lower(r.email)=any($1)`, [mail])
  console.log("\n=== sono gia' destinatari di questa campagna? ===")
  console.log(ex.rows.length === 0 ? "  no, da inserire" : "  " + ex.rows.map((r:any)=>`${r.email} (${r.send_status})`).join(", "))
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
