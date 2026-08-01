/**
 * Chi, fra gli utenti della piattaforma Santaddeo, NON ha ricevuto nessuna DEM.
 * Solo LETTURA. Nessun invio.
 */
import { Client } from "pg"
import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(process.env.SANTADDEO_SUPABASE_URL!, process.env.SANTADDEO_SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  const { data: profili, error } = await s
    .from("profiles")
    .select("email,first_name,last_name,role,is_active,last_login_at,organization_id")
    .order("role")
  if (error) throw new Error(`profiles: ${error.message}`)

  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  // Chi e' gia' destinatario di QUALSIASI campagna, e in quale stato.
  const dest = await c.query(`
    select lower(r.email) as email,
           string_agg(distinct ca.name || ' [' || r.send_status || ']', ' + ') as campagne
    from dem_recipients r join dem_campaigns ca on ca.id = r.campaign_id
    group by lower(r.email)
  `)
  const inLista = new Map<string, string>(dest.rows.map((r: any) => [r.email, r.campagne]))

  const sup = await c.query(`select lower(email) as email, reason from dem_unsubscribes`)
  const soppressi = new Map<string, string>(sup.rows.map((r: any) => [r.email, r.reason]))

  console.log(`=== ${profili?.length ?? 0} utenti sulla piattaforma Santaddeo ===`)
  console.log("")

  const perRuolo = new Map<string, { tot: number; fuori: number }>()
  const mancanti: any[] = []

  for (const p of profili ?? []) {
    const em = String(p.email ?? "").toLowerCase()
    const r = String(p.role ?? "?")
    if (!perRuolo.has(r)) perRuolo.set(r, { tot: 0, fuori: 0 })
    perRuolo.get(r)!.tot++

    const campagne = inLista.get(em)
    const sopp = soppressi.get(em)
    const stato = sopp ? `SOPPRESSO (${sopp})` : campagne ? campagne.slice(0, 58) : "MAI CONTATTATO"
    if (!campagne && !sopp) {
      perRuolo.get(r)!.fuori++
      mancanti.push(p)
    }
    console.log(`  ${em.padEnd(34)} ${r.padEnd(15)} attivo:${p.is_active ? "si" : "no "}  ${stato}`)
  }

  console.log("")
  console.log("=== riepilogo per ruolo ===")
  for (const [r, v] of [...perRuolo].sort()) {
    console.log(`  ${r.padEnd(16)} totali:${String(v.tot).padStart(3)}   mai contattati:${String(v.fuori).padStart(3)}`)
  }

  console.log("")
  console.log(`=== MAI CONTATTATI: ${mancanti.length} ===`)
  for (const p of mancanti) {
    const nome = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(senza nome)"
    console.log(
      `  ${String(p.email).padEnd(34)} ${nome.padEnd(24)} ${p.role}  ultimo accesso: ${p.last_login_at ? String(p.last_login_at).slice(0, 10) : "mai"}`,
    )
  }

  await c.end()
}
main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
