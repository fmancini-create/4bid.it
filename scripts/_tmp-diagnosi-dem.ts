/**
 * Diagnosi: stato reale delle campagne DEM e ricerca di un contatto.
 * Solo LETTURA. Nessun invio, nessuna scrittura.
 */
import { Client } from "pg"

const CERCA = process.argv[2] ?? "tesi"

async function main() {
  const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING
  if (!url) throw new Error("SUPABASE_POSTGRES_URL_NON_POOLING assente")
  // I dati DEM vivono su SUPABASE, non su Neon (POSTGRES_URL punta a Neon).
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await c.connect()

  console.log("=== CAMPAGNE: stato reale e invii ===")
  const camp = await c.query(`
    select ca.id, ca.name, ca.status, ca.auto_send, ca.sent_at,
           count(r.*) as destinatari,
           count(*) filter (where r.send_status = 'sent') as inviate,
           count(*) filter (where r.send_status = 'pending') as in_attesa,
           count(*) filter (where r.send_status = 'failed') as fallite,
           count(*) filter (where r.send_status = 'unsubscribed') as disiscritti
    from dem_campaigns ca
    left join dem_recipients r on r.campaign_id = ca.id
    group by ca.id, ca.name, ca.status, ca.auto_send, ca.sent_at
    order by ca.created_at desc
  `)
  for (const r of camp.rows) {
    console.log(`  ${String(r.name).slice(0, 34).padEnd(34)} stato:${String(r.status).padEnd(6)} auto:${r.auto_send}`)
    console.log(
      `    destinatari:${r.destinatari}  INVIATE:${r.inviate}  in attesa:${r.in_attesa}  fallite:${r.fallite}  disiscritti:${r.disiscritti}`,
    )
  }

  console.log("")
  console.log(`=== RICERCA "${CERCA}" fra i destinatari DEM ===`)
  const dest = await c.query(
    `select r.email, r.nome, r.cognome, r.nome_azienda, r.send_status, r.sent_at, ca.name as campagna
     from dem_recipients r join dem_campaigns ca on ca.id = r.campaign_id
     where r.email ilike $1 or coalesce(r.nome,'') ilike $1 or coalesce(r.cognome,'') ilike $1
        or coalesce(r.nome_azienda,'') ilike $1
     order by ca.name limit 30`,
    [`%${CERCA}%`],
  )
  if (dest.rows.length === 0) console.log("  NESSUN destinatario corrisponde")
  for (const r of dest.rows) {
    console.log(
      `  ${String(r.email).padEnd(34)} ${String(r.nome ?? "")} ${String(r.cognome ?? "")} | ${String(r.campagna).slice(0, 22)} | ${r.send_status}`,
    )
  }

  console.log("")
  console.log(`=== e' fra i soppressi (disiscritti/bounce/reclami)? ===`)
  const sup = await c.query(`select email, reason, created_at from dem_unsubscribes where email ilike $1 limit 10`, [
    `%${CERCA}%`,
  ])
  console.log(sup.rows.length === 0 ? "  no" : sup.rows.map((r) => `  ${r.email} (${r.reason})`).join("\n"))

  await c.end()
}
main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
