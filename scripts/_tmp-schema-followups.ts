import { Client } from "pg"

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  console.log("=== dem_followups: colonne ===")
  const cols = await c.query(
    `select column_name, data_type, is_nullable
     from information_schema.columns
     where table_schema='public' and table_name='dem_followups'
     order by ordinal_position`,
  )
  for (const x of cols.rows) console.log(`  ${String(x.column_name).padEnd(26)} ${x.data_type} (null:${x.is_nullable})`)

  console.log("\n=== vincolo su dem_followups.status (valori ammessi) ===")
  const chk = await c.query(
    `select pg_get_constraintdef(oid) def from pg_constraint
     where conrelid='public.dem_followups'::regclass and contype='c'`,
  )
  if (chk.rows.length === 0) console.log("  nessun CHECK: status libero")
  for (const x of chk.rows) console.log(`  ${x.def}`)

  console.log("\n=== stati realmente presenti ===")
  const st = await c.query(`select status, count(*) n from dem_followups group by 1 order by 2 desc`)
  for (const x of st.rows) console.log(`  ${String(x.status).padEnd(14)} ${x.n}`)

  await c.end()
}
main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
