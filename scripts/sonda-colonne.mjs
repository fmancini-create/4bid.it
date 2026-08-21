// Legge le colonne DICHIARATE dallo schema (non dedotte da una riga):
// le tabelle del censimento sono vuote, quindi un campione non basta.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.log("  IMPOSSIBILE: manca l'URL Supabase o la chiave di servizio")
  process.exit(2)
}

const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})
if (!r.ok) {
  console.log(`  IMPOSSIBILE leggere lo schema: HTTP ${r.status}`)
  process.exit(1)
}
const spec = await r.json()
const defs = spec.definitions || spec.components?.schemas || {}

const volute = process.argv.slice(2)
if (!volute.length) {
  console.log("  uso: node scripts/sonda-colonne.mjs <tabella> [tabella...]")
  process.exit(2)
}

for (const t of volute) {
  const d = defs[t]
  if (!d) {
    console.log(`\n${t}: NON PRESENTE nello schema dichiarato`)
    continue
  }
  const props = d.properties || {}
  const req = new Set(d.required || [])
  console.log(`\n${t}: ${Object.keys(props).length} colonne`)
  for (const [nome, meta] of Object.entries(props)) {
    const tipo = meta.format || meta.type || "?"
    const obbl = req.has(nome) ? " OBBLIGATORIA" : ""
    const desc = meta.description ? ` -- ${meta.description.replace(/\s+/g, " ").slice(0, 90)}` : ""
    console.log(`  ${nome}: ${tipo}${obbl}${desc}`)
  }
}
