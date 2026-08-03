import { Client } from "pg"

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  console.log("=== LISTA DI SOPPRESSIONE: cosa si sa oggi ===")
  const r = await c.query(`
    select coalesce(reason,'(assente)') motivo,
           coalesce(bounce_type,'(non registrato)') tipo,
           count(*)::int n
    from dem_unsubscribes group by 1,2 order by 3 desc limit 12`)
  for (const x of r.rows) {
    console.log(`  ${String(x.motivo).padEnd(22)} ${String(x.tipo).padEnd(18)} ${x.n}`)
  }

  // Quanti indirizzi sono esclusi a vita senza sapere se fossero davvero morti:
  // e' il residuo del difetto, e non e' recuperabile dal passato.
  const v = await c.query(`
    select count(*)::int n from dem_unsubscribes where reason='bounce' and bounce_type is null`)
  console.log(`\n  esclusi come "rimbalzo" SENZA tipo registrato: ${v.rows[0].n}`)
  console.log("  (storico: il dato non esiste piu', si applica solo da adesso)")

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
