/**
 * Cerca una persona in TUTTE le tabelle del db 4bid che hanno una colonna email,
 * e nel db Santaddeo (profiles). Solo LETTURA.
 *
 * Non indovino in quali tabelle guardare: leggo information_schema e cerco
 * dappertutto, altrimenti rischio di dire "non c'e'" avendo guardato nel posto
 * sbagliato.
 */
import { Client } from "pg"
import { createClient } from "@supabase/supabase-js"

const TERMINI = ["tesi", "andrea"]

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  // Una riga per (tabella, colonna): array_agg su information_schema torna un
  // tipo che non e' un array JS, e dare per buono il tipo mi aveva rotto lo script.
  const tab = await c.query(`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public' and column_name ilike '%mail%'
    order by table_name, column_name
  `)
  const nomiTabelle = new Set(tab.rows.map((r: any) => r.table_name))
  console.log(`=== db 4BID: ${nomiTabelle.size} tabelle con una colonna email ===`)

  for (const t of tab.rows) {
    for (const termine of TERMINI) {
      let r
      try {
        r = await c.query(
          `select "${t.column_name}"::text as email from "${t.table_name}" where "${t.column_name}"::text ilike $1 limit 6`,
          [`%${termine}%`],
        )
      } catch {
        continue
      }
      if (r.rows.length > 0) {
        console.log(
          `  ${String(t.table_name).padEnd(26)} ${String(t.column_name).padEnd(14)} ("${termine}"): ${r.rows.map((x: any) => x.email).join(", ")}`,
        )
      }
    }
  }

  await c.end()

  // --- db Santaddeo (piattaforma operativa) ---
  const sUrl = process.env.SANTADDEO_SUPABASE_URL
  const sKey = process.env.SANTADDEO_SUPABASE_SERVICE_ROLE_KEY
  console.log("")
  if (!sUrl || !sKey) {
    console.log("=== db SANTADDEO: credenziali assenti, non verificabile ===")
    return
  }
  const s = createClient(sUrl, sKey, { auth: { persistSession: false } })
  console.log("=== db SANTADDEO: profiles ===")
  const { data, error } = await s.from("profiles").select("*").limit(200)
  if (error) {
    console.log(`  errore: ${error.message}`)
    return
  }
  const campi = Object.keys(data?.[0] ?? {})
  console.log(`  colonne: ${campi.join(", ")}`)
  const trovati = (data ?? []).filter((r: any) =>
    TERMINI.some((t) => JSON.stringify(r).toLowerCase().includes(t)),
  )
  console.log(`  righe totali lette: ${data?.length ?? 0}   corrispondenze: ${trovati.length}`)
  for (const r of trovati) {
    console.log(`    ${r.email ?? "?"} | ${r.full_name ?? r.name ?? "?"} | ruolo: ${r.role ?? "?"}`)
  }
}
main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
