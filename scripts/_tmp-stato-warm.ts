import { Client } from "pg"
async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const r = await c.query(`select id, name, status, paused_reason, to_char(updated_at,'HH24:MI:SS') agg from dem_followups order by created_at`)
  console.log("=== stato dei richiami DOPO l'esecuzione del cron ===")
  for (const x of r.rows) {
    console.log(`  ${String(x.name).slice(0,34).padEnd(34)} stato:${String(x.status).padEnd(10)} agg:${x.agg}`)
    console.log(`    motivo: ${x.paused_reason ? String(x.paused_reason).slice(0,110) : "(nessuno)"}`)
  }
  await c.end()
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
