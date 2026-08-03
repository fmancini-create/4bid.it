import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  // Riporto ad 'active' per rifare la prova dal principio: senza questo il cron
  // non selezionerebbe il richiamo e la prova non misurerebbe nulla.
  const r = await c.query(`update dem_followups set status='active', paused_reason=null where status='paused' returning id`)
  console.log(`  richiami riattivati per la prova: ${r.rowCount}`)
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
