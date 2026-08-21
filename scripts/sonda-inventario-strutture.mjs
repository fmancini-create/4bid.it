// Sonda di sola lettura: quante strutture distinte "abbiamo" e con che appigli
// per dedurre il gestionale. Dichiara ogni fallimento invece di stampare zero.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.log("  IMPOSSIBILE: manca l'URL Supabase o la chiave di servizio")
  process.exit(2)
}
const base = url.replace(/\/$/, "")
const head = { apikey: key, Authorization: `Bearer ${key}` }

async function pagina(tabella, colonne, da, a) {
  const r = await fetch(`${base}/rest/v1/${tabella}?select=${colonne}`, {
    headers: { ...head, Range: `${da}-${a}`, "Range-Unit": "items" },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 120)}`)
  return r.json()
}

async function tutte(tabella, colonne) {
  const out = []
  const passo = 1000
  for (let da = 0; ; da += passo) {
    const righe = await pagina(tabella, colonne, da, da + passo - 1)
    out.push(...righe)
    if (righe.length < passo) break
    if (da > 200000) {
      console.log("  ATTENZIONE: interrotto per sicurezza a 200k righe")
      break
    }
  }
  return out
}

try {
  const dest = await tutte("dem_recipients", "email,nome_azienda,tipo_contatto")
  console.log(`=== dem_recipients: ${dest.length} righe lette (copie per campagna) ===`)

  const email = new Set()
  const domini = new Set()
  const aziende = new Set()
  const perTipo = new Map()
  for (const r of dest) {
    const e = (r.email || "").trim().toLowerCase()
    if (e) {
      email.add(e)
      const d = e.split("@")[1]
      if (d) domini.add(d)
    }
    if (r.nome_azienda) aziende.add(r.nome_azienda.trim().toLowerCase())
    const t = r.tipo_contatto || "(vuoto)"
    perTipo.set(t, (perTipo.get(t) || 0) + 1)
  }
  console.log(`  email DISTINTE:          ${email.size}`)
  console.log(`  domini DISTINTI:         ${domini.size}   <- appiglio per dedurre il sito`)
  console.log(`  nomi azienda distinti:   ${aziende.size}`)
  console.log(`  per tipo_contatto:`)
  for (const [t, n] of [...perTipo].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t}: ${n}`)
  }

  const generici = [...domini].filter((d) =>
    /^(gmail|libero|hotmail|yahoo|outlook|icloud|alice|virgilio|tiscali|pec\.it|live)\./.test(d),
  )
  console.log(`  domini generici (gmail/libero/...): ${generici.length}`)
  console.log(`  domini PROPRI (probabile sito):     ${domini.size - generici.length}`)

  const sc = await tutte("scidoo_properties", "scidoo_code,website_url,email,is_active")
  const attive = sc.filter((r) => r.is_active)
  console.log(`\n=== scidoo_properties: ${sc.length} righe (${attive.length} attive) ===`)
  console.log(`  con sito proprio:  ${sc.filter((r) => r.website_url).length}`)
  console.log(`  con email:         ${sc.filter((r) => r.email).length}`)

  const domScidoo = new Set(
    sc.map((r) => (r.email || "").trim().toLowerCase().split("@")[1]).filter(Boolean),
  )
  const inComune = [...domScidoo].filter((d) => domini.has(d))
  console.log(`\n=== incrocio ===`)
  console.log(`  domini Scidoo:                    ${domScidoo.size}`)
  console.log(`  di cui GIA' fra i destinatari DEM: ${inComune.length}`)
} catch (e) {
  console.log(`  FALLITA: ${e.message}`)
  process.exit(1)
}
