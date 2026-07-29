/**
 * Crea la campagna DEM "Traffico aereo" e ne carica i destinatari.
 *
 * Usa le ROUTE REALI dell'applicazione (/api/dem/campaigns e /api/dem/recipients):
 * cosi' l'esclusione dei disiscritti che viene applicata qui e' esattamente la
 * stessa che si applica dalla dashboard. Uno script che riscrivesse la logica
 * proverebbe soltanto se stesso.
 *
 * La campagna nasce in stato "draft" con `auto_send` NON impostato: il cron
 * dem-auto-send seleziona solo `auto_send = true`, quindi NULLA parte da sola.
 *
 * Uso:
 *   npx tsx scripts/create-air-market-dem.ts            (prova a vuoto)
 *   npx tsx scripts/create-air-market-dem.ts --conferma  (scrive davvero)
 */
import fs from "node:fs"
import { AIR_MARKET_PRESET } from "../lib/dem/air-market-template"

const BASE = process.env.DEM_BASE_URL || "http://localhost:3000"
const CONFERMA = process.argv.includes("--conferma")
const CSV = "public/dem/hotels-italia.csv"

// Parser CSV minimo ma corretto: i campi possono contenere virgole fra apici.
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") {
      out.push(cur)
      cur = ""
    } else cur += ch
  }
  out.push(cur)
  return out
}

type Contatto = {
  email: string
  nome?: string
  cognome?: string
  nome_azienda?: string
  tipo_contatto?: string
}

function leggiContatti(): Contatto[] {
  const righe = fs.readFileSync(CSV, "utf8").split(/\r?\n/)
  const intestazione = parseCsvLine(righe[0]).map((h) => h.trim())
  const idx = (n: string) => intestazione.indexOf(n)
  const iEmail = idx("email")
  const iAzienda = idx("nome_azienda")
  const iNome = idx("referente_nome")
  const iCognome = idx("referente_cognome")

  const visti = new Set<string>()
  const out: Contatto[] = []
  for (let r = 1; r < righe.length; r++) {
    if (!righe[r].trim()) continue
    const c = parseCsvLine(righe[r])
    const email = (c[iEmail] || "").trim().toLowerCase()
    if (!email || !email.includes("@")) continue
    if (visti.has(email)) continue
    visti.add(email)
    out.push({
      email,
      nome: (c[iNome] || "").trim() || undefined,
      cognome: (c[iCognome] || "").trim() || undefined,
      nome_azienda: (c[iAzienda] || "").trim() || undefined,
      tipo_contatto: "hotel",
    })
  }
  return out
}

async function main() {
  const contatti = leggiContatti()
  console.log(`Contatti nel file, senza duplicati: ${contatti.length}`)
  console.log(`Campagna: "${AIR_MARKET_PRESET.name}"`)
  console.log(`Oggetto:  "${AIR_MARKET_PRESET.subject}"`)

  if (!CONFERMA) {
    console.log("\nProva a vuoto: nessuna scrittura. Aggiungi --conferma per procedere.")
    return
  }

  // 1) Creazione della campagna (nasce in "draft").
  const resC = await fetch(`${BASE}/api/dem/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: AIR_MARKET_PRESET.name,
      subject: AIR_MARKET_PRESET.subject,
      html_template: AIR_MARKET_PRESET.html,
      track_opens: true,
      track_clicks: true,
    }),
  })
  const datiC = await resC.json()
  if (!resC.ok) throw new Error("Creazione campagna fallita: " + JSON.stringify(datiC))
  const campaignId = datiC.campaign?.id || datiC.id
  if (!campaignId) throw new Error("Nessun id di campagna restituito: " + JSON.stringify(datiC))
  console.log(`\nCampagna creata: ${campaignId} (stato: ${datiC.campaign?.status || "draft"})`)

  // 2) Caricamento a lotti. La route esclude da se' disiscritti e non recapitabili.
  let aggiunti = 0
  let esclusiDisiscritti = 0
  let duplicati = 0
  const LOTTO = 2000
  for (let i = 0; i < contatti.length; i += LOTTO) {
    const lotto = contatti.slice(i, i + LOTTO)
    const res = await fetch(`${BASE}/api/dem/recipients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, recipients: lotto }),
    })
    const d = await res.json()
    aggiunti += d.added || 0
    esclusiDisiscritti += d.esclusi_disiscritti || 0
    duplicati += d.duplicates || 0
    process.stdout.write(
      `\r  lotto ${Math.floor(i / LOTTO) + 1}: aggiunti ${aggiunti}, esclusi disiscritti ${esclusiDisiscritti}   `
    )
  }
  console.log("\n")
  console.log(`Destinatari caricati:            ${aggiunti}`)
  console.log(`Esclusi (disiscritti/irraggiungibili): ${esclusiDisiscritti}`)
  console.log(`Scartati come duplicati o non validi:  ${duplicati}`)
  console.log(`\nID campagna: ${campaignId}`)
  console.log("Stato: BOZZA, invio automatico spento. Nulla partira' finche' non lo attivi.")
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
