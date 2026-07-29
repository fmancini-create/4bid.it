/**
 * Crea le DEM "traffico aereo" per chi ci CONOSCE GIA' e ne carica i destinatari
 * leggendoli dal database di Santaddeo.
 *
 * Due campagne distinte, perche' i pubblici sono due e il messaggio giusto e'
 * diverso:
 *   - clienti        (usano Santaddeo)      -> tipo_contatto "cliente"
 *   - collaboratori  (lo vendono con noi)   -> tipo_contatto "rappresentante"
 * Sono TENUTE SEPARATE anche dalla campagna di primo contatto: quella dice
 * "riteniamo Santaddeo utile per la tua struttura", frase che a un cliente
 * comunica che non sappiamo chi e'.
 *
 * SOLA LETTURA su Santaddeo: da qui si legge e nulla si scrive. Le uniche
 * scritture avvengono sul database di 4bid, tramite le ROUTE REALI
 * dell'applicazione (/api/dem/campaigns e /api/dem/recipients), cosi'
 * l'esclusione dei disiscritti applicata qui e' esattamente la stessa della
 * dashboard. Uno script che riscrivesse quella logica proverebbe solo se stesso.
 *
 * Le campagne nascono in stato "draft" con `auto_send` NON impostato: il cron
 * dem-auto-send seleziona solo `auto_send = true`, quindi NULLA parte da sola.
 *
 * Uso:
 *   npx tsx scripts/create-santaddeo-warm-dem.ts             (prova a vuoto)
 *   npx tsx scripts/create-santaddeo-warm-dem.ts --conferma  (scrive davvero)
 */
import { createClient } from "@supabase/supabase-js"
import { AIR_MARKET_CLIENTI_PRESET, AIR_MARKET_COLLABORATORI_PRESET } from "../lib/dem/air-market-template"

const BASE = process.env.DEM_BASE_URL || "http://localhost:3000"
const CONFERMA = process.argv.includes("--conferma")

// Indirizzi e nomi che NON sono contatti veri: dati di prova rimasti in
// piattaforma e caselle di servizio. Senza questo filtro finirebbero in lista
// "pippo mancio" e gli indirizzi @hotelbid.org usati per le verifiche.
const NON_CONTATTI = /test|prova|example|fittizi|demo|pippo|pluto|paperino|hotelbid\.org|noreply|no-reply/i

// I ruoli della piattaforma Santaddeo, tradotti nei tipi ammessi dalla lista DEM.
// ATTENZIONE: `dem_recipients.tipo_contatto` accetta SOLO
// cliente / ex_cliente / potenziale / rappresentante (vincolo
// dem_recipients_tipo_contatto_check). Un valore fuori elenco fa rifiutare
// OGNI riga del lotto, non solo quella sbagliata.
const TIPO_PER_RUOLO: Record<string, "cliente" | "rappresentante"> = {
  property_admin: "cliente",
  sales_agent: "rappresentante",
}

type Contatto = {
  email: string
  nome?: string
  cognome?: string
  nome_azienda?: string
  tipo_contatto: "cliente" | "rappresentante"
}

async function leggiDaSantaddeo(): Promise<{ contatti: Contatto[]; scartati: number }> {
  const url = process.env.SANTADDEO_SUPABASE_URL
  const chiave = process.env.SANTADDEO_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chiave) {
    throw new Error(
      "Mancano SANTADDEO_SUPABASE_URL e/o SANTADDEO_SUPABASE_SERVICE_ROLE_KEY: senza le credenziali di Santaddeo non c'e' nulla da leggere."
    )
  }
  const sant = createClient(url, chiave, { auth: { persistSession: false } })

  const [{ data: hotels, error: erroreHotels }, { data: profili, error: erroreProfili }, { data: legami }] =
    await Promise.all([
      sant.from("hotels").select("id,name,contact_email,is_active,deleted_at"),
      sant.from("profiles").select("id,email,first_name,last_name,role"),
      sant.from("hotel_users").select("user_id,hotel_id"),
    ])
  if (erroreHotels) throw new Error("lettura hotels fallita: " + erroreHotels.message)
  if (erroreProfili) throw new Error("lettura profiles fallita: " + erroreProfili.message)

  // Strutture attive, per nome: serve per riempire `nome_azienda` con l'azienda
  // vera. La qualifica (job_title) NON e' il nome dell'azienda: salvarla la' e'
  // un dato sbagliato che poi qualcuno usera' credendolo giusto.
  const nomeStruttura = new Map<string, string>()
  const strutturaAttiva = new Map<string, boolean>()
  for (const h of hotels ?? []) {
    nomeStruttura.set(h.id, h.name ?? "")
    strutturaAttiva.set(h.id, Boolean(h.is_active) && !h.deleted_at)
  }
  const strutturaDiUtente = new Map<string, string>()
  for (const l of legami ?? []) {
    if (!strutturaDiUtente.has(l.user_id) && strutturaAttiva.get(l.hotel_id)) {
      strutturaDiUtente.set(l.user_id, l.hotel_id)
    }
  }

  const perEmail = new Map<string, Contatto>()
  let scartati = 0

  // 1) Indirizzi generici delle strutture attive (info@...): sono clienti, ma
  //    senza un nome di persona.
  for (const h of hotels ?? []) {
    const email = (h.contact_email ?? "").trim().toLowerCase()
    if (!email.includes("@")) continue
    if (!strutturaAttiva.get(h.id)) {
      scartati++
      continue
    }
    if (NON_CONTATTI.test(email) || NON_CONTATTI.test(h.name ?? "")) {
      scartati++
      continue
    }
    perEmail.set(email, { email, nome_azienda: h.name ?? undefined, tipo_contatto: "cliente" })
  }

  // 2) Persone. Sovrascrivono l'indirizzo generico quando coincidono, perche'
  //    portano nome e cognome in piu'.
  for (const p of profili ?? []) {
    const email = (p.email ?? "").trim().toLowerCase()
    if (!email.includes("@")) continue
    const tipo = TIPO_PER_RUOLO[p.role ?? ""]
    // Ruoli non commerciali (super_admin e simili): utenze interne, fuori lista.
    if (!tipo) {
      scartati++
      continue
    }
    const nome = (p.first_name ?? "").trim()
    const cognome = (p.last_name ?? "").trim()
    if (NON_CONTATTI.test(email) || NON_CONTATTI.test(nome + " " + cognome)) {
      scartati++
      continue
    }
    const idStruttura = strutturaDiUtente.get(p.id)
    perEmail.set(email, {
      email,
      nome: nome || undefined,
      cognome: cognome || undefined,
      nome_azienda: idStruttura ? nomeStruttura.get(idStruttura) || undefined : undefined,
      tipo_contatto: tipo,
    })
  }

  return { contatti: [...perEmail.values()], scartati }
}

async function creaCampagna(preset: { name: string; subject: string; html: string }, contatti: Contatto[]) {
  const res = await fetch(`${BASE}/api/dem/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: preset.name,
      subject: preset.subject,
      html_template: preset.html,
      track_opens: true,
      track_clicks: true,
    }),
  })
  const dati = await res.json()
  if (!res.ok) throw new Error("creazione campagna fallita: " + JSON.stringify(dati))
  const id = dati.campaign?.id || dati.id
  if (!id) throw new Error("nessun id di campagna restituito: " + JSON.stringify(dati))

  const resD = await fetch(`${BASE}/api/dem/recipients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id: id, recipients: contatti }),
  })
  const d = await resD.json()
  // Non proseguire in silenzio: una risposta 200 con `added: 0` e' identica a
  // "nessun contatto nuovo" e nasconderebbe un caricamento fallito del tutto.
  if (!resD.ok && (d.added || 0) === 0 && (d.esclusi_disiscritti || 0) < contatti.length) {
    throw new Error(`destinatari non caricati (HTTP ${resD.status}): ${d.error || JSON.stringify(d)}`)
  }
  return {
    id,
    stato: dati.campaign?.status || "draft",
    aggiunti: d.added || 0,
    esclusiDisiscritti: d.esclusi_disiscritti || 0,
    duplicati: d.duplicates || 0,
  }
}

async function main() {
  const { contatti, scartati } = await leggiDaSantaddeo()
  const clienti = contatti.filter((c) => c.tipo_contatto === "cliente")
  const collaboratori = contatti.filter((c) => c.tipo_contatto === "rappresentante")

  console.log("Letti da Santaddeo (sola lettura):")
  console.log(`  clienti:        ${clienti.length}`)
  console.log(`  collaboratori:  ${collaboratori.length}`)
  console.log(`  scartati (prove, utenze interne, strutture non attive): ${scartati}`)
  console.log("")
  console.log(`Campagna 1: "${AIR_MARKET_CLIENTI_PRESET.name}"`)
  console.log(`  oggetto: "${AIR_MARKET_CLIENTI_PRESET.subject}"`)
  console.log(`Campagna 2: "${AIR_MARKET_COLLABORATORI_PRESET.name}"`)
  console.log(`  oggetto: "${AIR_MARKET_COLLABORATORI_PRESET.subject}"`)

  if (!CONFERMA) {
    console.log("\nProva a vuoto: nessuna scrittura. Aggiungi --conferma per procedere.")
    return
  }
  if (!clienti.length && !collaboratori.length) {
    throw new Error("nessun contatto da caricare: mi fermo invece di creare campagne vuote")
  }

  for (const [preset, lista] of [
    [AIR_MARKET_CLIENTI_PRESET, clienti],
    [AIR_MARKET_COLLABORATORI_PRESET, collaboratori],
  ] as const) {
    if (!lista.length) {
      console.log(`\n"${preset.name}": nessun contatto, campagna non creata.`)
      continue
    }
    const r = await creaCampagna(preset, lista)
    console.log(`\n"${preset.name}"`)
    console.log(`  id campagna: ${r.id}  (stato: ${r.stato})`)
    console.log(`  destinatari caricati: ${r.aggiunti}`)
    console.log(`  esclusi perche' disiscritti o non raggiungibili: ${r.esclusiDisiscritti}`)
    console.log(`  scartati come duplicati o non validi: ${r.duplicati}`)
  }

  console.log("\nStato: BOZZA, invio automatico spento. Nulla partira' finche' non lo attivi.")
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
