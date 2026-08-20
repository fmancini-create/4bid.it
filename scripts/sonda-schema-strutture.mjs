// Sonda di sola lettura: dove stanno "le strutture che abbiamo" e c'e' un campo PMS?
// Dichiara ogni fallimento invece di stampare zero.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.log("  IMPOSSIBILE: manca NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
  process.exit(2)
}

const base = url.replace(/\/$/, "")

async function conta(tabella) {
  const r = await fetch(`${base}/rest/v1/${tabella}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
  })
  if (!r.ok) {
    const t = await r.text()
    return { errore: `HTTP ${r.status} ${t.slice(0, 120)}` }
  }
  const range = r.headers.get("content-range") || ""
  const totale = range.includes("/") ? range.split("/")[1] : "?"
  const righe = await r.json()
  const colonne = Array.isArray(righe) && righe.length ? Object.keys(righe[0]) : []
  return { totale, colonne }
}

const candidate = [
  "scidoo_properties",
  "scidoo_scan_state",
  "contacts",
  "dem_recipients",
  "dem_campaigns",
  "dem_contacts",
  "dem_lists",
  "dem_audiences",
]

console.log("=== tabelle candidate ===")
for (const t of candidate) {
  const r = await conta(t)
  if (r.errore) {
    console.log(`  ${t}: NON LEGGIBILE -> ${r.errore}`)
    continue
  }
  console.log(`  ${t}: ${r.totale} righe`)
  if (r.colonne.length) {
    const pms = r.colonne.filter((c) => /pms|gestional|engine|software/i.test(c))
    console.log(`    colonne (${r.colonne.length}): ${r.colonne.join(", ")}`)
    console.log(`    colonne che parlano di PMS: ${pms.length ? pms.join(", ") : "NESSUNA"}`)
  } else {
    console.log(`    tabella vuota: non posso dedurre le colonne da una riga`)
  }
}
