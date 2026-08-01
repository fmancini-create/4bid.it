import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const r = await c.query(`select tipo_contatto, count(*) n from dem_recipients where campaign_id='b9d32eb8-c4af-4487-9701-450fdb58e515' group by 1`)
  console.log("=== tipo_contatto usati nella campagna clienti (riuso il valore esistente) ===")
  for (const x of r.rows) console.log(`  ${x.tipo_contatto ?? '(null)'}  ${x.n}`)
  const e = await c.query(`select email, nome, cognome, nome_azienda from dem_recipients where campaign_id='b9d32eb8-c4af-4487-9701-450fdb58e515' limit 3`)
  console.log("\n=== esempi di righe esistenti (per compilare i campi allo stesso modo) ===")
  for (const x of e.rows) console.log(`  ${x.email} | nome:${x.nome ?? '-'} | cognome:${x.cognome ?? '-'} | azienda:${x.nome_azienda ?? '-'}`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
