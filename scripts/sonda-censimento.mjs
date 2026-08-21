// Sonda di sola lettura sul sottosistema hospitality_* / slope_*.
// Dichiara ogni fallimento: una tabella illeggibile non deve sembrare vuota.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.log("  IMPOSSIBILE: manca l'URL Supabase o la chiave di servizio")
  process.exit(2)
}
const base = url.replace(/\/$/, "")
const head = { apikey: key, Authorization: `Bearer ${key}` }

async function info(tabella) {
  const r = await fetch(`${base}/rest/v1/${tabella}?select=*&limit=2`, {
    headers: { ...head, Prefer: "count=exact", Range: "0-1" },
  })
  if (!r.ok) return { errore: `HTTP ${r.status} ${(await r.text()).slice(0, 100)}` }
  const cr = r.headers.get("content-range") || ""
  const totale = cr.includes("/") ? cr.split("/")[1] : "?"
  const righe = await r.json()
  return { totale, colonne: righe.length ? Object.keys(righe[0]) : [], campione: righe[0] || null }
}

const tabelle = [
  "hospitality_properties",
  "hospitality_census_state",
  "hospitality_crawl_queue",
  "hospitality_provider_signatures",
  "hospitality_provider_summary",
  "hospitality_technology_detections",
  "hospitality_unknown_booking_hosts",
  "slope_properties",
  "slope_scan_state",
]

for (const t of tabelle) {
  const r = await info(t)
  if (r.errore) {
    console.log(`\n${t}: NON LEGGIBILE -> ${r.errore}`)
    continue
  }
  console.log(`\n${t}: ${r.totale} righe`)
  if (r.colonne.length) {
    console.log(`  colonne: ${r.colonne.join(", ")}`)
  } else {
    console.log(`  VUOTA (colonne non deducibili da una riga)`)
  }
}
