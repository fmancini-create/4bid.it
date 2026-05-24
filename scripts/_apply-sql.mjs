import { neon } from "@neondatabase/serverless"
import { readFile } from "node:fs/promises"

const file = process.argv[2]
const target = process.argv[3] || "supabase" // "supabase" or "neon"

if (!file) {
  console.error("usage: node scripts/_apply-sql.mjs <path-to-sql> [supabase|neon]")
  process.exit(1)
}

const url =
  target === "neon"
    ? process.env.POSTGRES_URL
    : process.env.SUPABASE_POSTGRES_URL_NON_POOLING || process.env.SUPABASE_POSTGRES_URL

if (!url) {
  console.error(`No connection string for target=${target}`)
  process.exit(1)
}

const isHttp = url.includes("neon.tech") // only Neon supports the HTTP @neondatabase/serverless driver

const sqlText = await readFile(file, "utf8")

console.log(`[migrate] target=${target} isHttp=${isHttp} chars=${sqlText.length}`)

if (isHttp) {
  const sql = neon(url)
  await sql.transaction([sql(sqlText)]).catch(async () => {
    // fallback - run as one statement
    await sql(sqlText)
  })
  console.log("[migrate] OK (neon http)")
  process.exit(0)
}

// Supabase Postgres -> use pg over TLS via dynamic import
const { default: pg } = await import("pg").catch(() => ({ default: null }))
if (!pg) {
  console.error("[migrate] 'pg' is not installed; cannot connect to Supabase from CLI")
  console.error("[migrate] install with: pnpm add -D pg")
  process.exit(2)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sqlText)
  console.log("[migrate] OK (pg)")
} catch (e) {
  console.error("[migrate] FAIL:", e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
