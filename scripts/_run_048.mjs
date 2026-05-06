// Riallinea knowledge_base: disattiva record obsoleti/duplicati e inserisce
// 9 record canonici per holding 4BID + Suite HORECA + Altri progetti.

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

// =====================================================================
// STEP 1: Soft-delete tutti i record esistenti che riguardano i nostri prodotti.
// Lasciamo intatti eventuali record "guida" (category='guide') e altri.
// =====================================================================
console.log("STEP 1: Disattivazione record obsoleti...")
const { data: toDeactivate, error: e1 } = await supabase
  .from("knowledge_base")
  .select("id, title, category")
  .in("category", ["company", "project", "progetti"])

if (e1) {
  console.error("Select error:", e1.message)
  process.exit(1)
}
console.log(`  Trovati ${toDeactivate.length} record da disattivare`)

if (toDeactivate.length) {
  const ids = toDeactivate.map((r) => r.id)
  const { error: e2 } = await supabase
    .from("knowledge_base")
    .update({ is_active: false })
    .in("id", ids)
  if (e2) {
    console.error("Deactivate error:", e2.message)
    process.exit(1)
  }
  console.log(`  Disattivati ${ids.length} record`)
}

// =====================================================================
// STEP 2: Insert dei 9 record canonici
// =====================================================================
console.log("\nSTEP 2: Insert 9 record canonici...")

const records = [
  // ===== AZIENDA / HOLDING =====
  {
    source: "manual",
    source_url: "https://www.4bid.it",
    category: "company",
    title: "4BID SRL - Holding e Ecosistema Prodotti",
    content: `4BID SRL è una holding italiana con sede in Italia che sviluppa software, app e tool per il settore turistico (HORECA - hotel, ristoranti, alberghi) e altri verticali. L'ecosistema 4BID include 8 prodotti principali divisi in due categorie:

SUITE HORECA (software e tool per hotel e turismo):
1. Santaddeo - Revenue Management System intelligente per hotel — ONLINE su https://santaddeo.com
2. HotelProfit AI - Controllo di gestione e analisi economico-finanziaria per hotel — ONLINE su https://hotelprofitai.com
3. Manubot - Gestione manutenzioni via WhatsApp e Telegram — ONLINE su https://manubot.it
4. Hotel Accelerator - Programma di accelerazione per hotel indipendenti (in sviluppo, 80%)
5. 4BID Ecomobility - Soluzioni di mobilità elettrica per strutture ricettive

ALTRI PROGETTI (verticali extra-turismo):
6. Autoexel - Excel intelligente con AI per analisi dati senza competenze tecniche — https://autoexel.it
7. MyPetSenseAI - Piattaforma AI per la salute dei cani con monitoraggio quotidiano — https://mypetsenseai.com
8. Risparmio Compulsivo - App di gamification del risparmio personale (in sviluppo, 70%)

Contatti: info@4bid.it - https://www.4bid.it
Social: LinkedIn (linkedin.com/company/4bid-srl), Instagram (@4bid_revenue_guru), Facebook (4bidrevenueguru)`,
    keywords: [
      "4bid",
      "4bid srl",
      "azienda",
      "holding",
      "ecosistema",
      "prodotti",
      "suite horeca",
      "software hotel",
      "tool turismo",
      "santaddeo",
      "hotelprofit ai",
      "manubot",
      "hotel accelerator",
      "ecomobility",
      "autoexel",
      "mypetsenseai",
      "risparmio compulsivo",
    ],
    is_active: true,
    priority: 10,
    created_by: "system",
  },

  // ===== SUITE HORECA =====
  {
    source: "manual",
    source_url: "https://santaddeo.com",
    category: "product",
    title: "Santaddeo - Revenue Management System (Online)",
    content: `Santaddeo è un Revenue Management System (RMS) intelligente sviluppato da 4BID SRL per hotel e strutture ricettive. STATO: ONLINE e operativo su https://santaddeo.com (Suite HORECA 4BID).

Caratteristiche principali:
- Pricing dinamico basato su intelligenza artificiale
- Adattamento automatico a ogni tipologia di struttura (hotel, B&B, residence, agriturismi)
- Spiegabilità: il sistema spiega ogni decisione di pricing
- Integrazione con i principali PMS e channel manager
- Analisi competitiva e monitoraggio del mercato
- Suggerimenti operativi giornalieri

Sito ufficiale: https://santaddeo.com
Pagina prodotto su 4bid.it: https://www.4bid.it/progetti/santaddeo`,
    keywords: [
      "santaddeo",
      "revenue management",
      "rms",
      "pricing dinamico",
      "hotel",
      "online",
      "santaddeo.com",
      "suite horeca",
      "4bid",
    ],
    is_active: true,
    priority: 10,
    created_by: "system",
  },
  {
    source: "manual",
    source_url: "https://hotelprofitai.com",
    category: "product",
    title: "HotelProfit AI - Controllo di Gestione (Online)",
    content: `HotelProfit AI è il software di controllo di gestione per hotel sviluppato da 4BID SRL. STATO: ONLINE e operativo su https://hotelprofitai.com (Suite HORECA 4BID).

Funzionalità:
- Analisi economico-finanziaria automatica
- Conto economico riclassificato per centri di costo
- KPI alberghieri (RevPAR, ADR, GOPPAR, occupancy)
- Budget e forecast
- Dashboard con AI per insight e suggerimenti
- Integrazione con PMS, channel manager, sistemi di contabilità

Sito ufficiale: https://hotelprofitai.com
Pagina prodotto su 4bid.it: https://www.4bid.it/progetti/hotelprofit-ai`,
    keywords: [
      "hotelprofit ai",
      "hotelprofitai",
      "controllo di gestione hotel",
      "kpi alberghieri",
      "revpar",
      "adr",
      "online",
      "hotelprofitai.com",
      "suite horeca",
      "4bid",
    ],
    is_active: true,
    priority: 10,
    created_by: "system",
  },
  {
    source: "manual",
    source_url: "https://manubot.it",
    category: "product",
    title: "Manubot - Manutenzioni via WhatsApp/Telegram (Online)",
    content: `Manubot è il sistema universale di gestione e automazione delle manutenzioni sviluppato da 4BID SRL. STATO: ONLINE e operativo su https://manubot.it (Suite HORECA 4BID).

Caratteristiche:
- Bot WhatsApp e Telegram per segnalazioni rapide dal personale
- Gestione asset e categorizzazione automatica degli interventi
- Multi-organizzazione (ideale per gruppi alberghieri)
- Foto, descrizione, priorità e gruppo di intervento
- Dashboard web per amministrazione e reportistica
- Notifiche automatiche e workflow personalizzabili
- Adatto anche a condomini e aziende non-hotel

Sito ufficiale: https://manubot.it
Pagina prodotto su 4bid.it: https://www.4bid.it/progetti/manubot`,
    keywords: [
      "manubot",
      "manutenzioni",
      "whatsapp bot",
      "telegram bot",
      "online",
      "manubot.it",
      "suite horeca",
      "4bid",
    ],
    is_active: true,
    priority: 10,
    created_by: "system",
  },
  {
    source: "manual",
    source_url: "https://www.4bid.it/progetti/hotel-accelerator",
    category: "product",
    title: "Hotel Accelerator - Acceleratore per Hotel Indipendenti",
    content: `Hotel Accelerator è il programma di accelerazione di 4BID SRL per hotel indipendenti che vogliono crescere velocemente. STATO: in sviluppo (80%, parte della Suite HORECA 4BID).

Cosa offre:
- Programma di consulenza strutturato su 6-12 mesi
- Affiancamento revenue management con Santaddeo
- Controllo di gestione con HotelProfit AI
- Operations con Manubot
- Accesso prioritario a tutta la suite 4BID
- Benchmark e community di hotel partner

Pagina prodotto: https://www.4bid.it/progetti/hotel-accelerator`,
    keywords: [
      "hotel accelerator",
      "acceleratore hotel",
      "consulenza hotel",
      "in sviluppo",
      "suite horeca",
      "4bid",
    ],
    is_active: true,
    priority: 9,
    created_by: "system",
  },
  {
    source: "manual",
    source_url: "https://www.4bid.it/progetti/ecomobility",
    category: "product",
    title: "4BID Ecomobility - Mobilità Elettrica per Strutture Ricettive",
    content: `4BID Ecomobility è la soluzione di mobilità elettrica di 4BID SRL pensata per hotel, B&B e strutture ricettive (Suite HORECA 4BID).

Servizi:
- Installazione colonnine di ricarica per veicoli elettrici
- Gestione e billing automatizzato degli ospiti
- Integrazione con PMS per addebito automatico in conto camera
- Reportistica energetica e di utilizzo
- Compliance normativa
- Marketing turismo green
- Modello SaaS multi-tenant

Pagina prodotto: https://www.4bid.it/progetti/ecomobility`,
    keywords: [
      "ecomobility",
      "4bid ecomobility",
      "mobilità elettrica",
      "colonnine ricarica",
      "auto elettriche hotel",
      "turismo green",
      "suite horeca",
      "4bid",
    ],
    is_active: true,
    priority: 9,
    created_by: "system",
  },

  // ===== ALTRI PROGETTI =====
  {
    source: "manual",
    source_url: "https://autoexel.it",
    category: "product",
    title: "Autoexel - Excel intelligente con AI",
    content: `Autoexel è l'app di 4BID SRL che permette a chiunque di analizzare dati e creare fogli Excel senza competenze tecniche. Categoria: Altri progetti (verticale dati, non specifico turismo).

Funzionalità:
- Carica file Excel/CSV → analisi automatiche, KPI e grafici
- Crea fogli da zero usando comandi in linguaggio naturale
- AI integrata per insight, formule e visualizzazioni
- Export in Excel, PDF, Google Sheets
- Piani Free e Pro

Sito ufficiale: https://autoexel.it
Pagina prodotto su 4bid.it: https://www.4bid.it/progetti/autoexel`,
    keywords: [
      "autoexel",
      "excel ai",
      "analisi dati",
      "fogli excel",
      "linguaggio naturale",
      "altri progetti",
      "4bid",
    ],
    is_active: true,
    priority: 8,
    created_by: "system",
  },
  {
    source: "manual",
    source_url: "https://mypetsenseai.com",
    category: "product",
    title: "MyPetSenseAI - Salute dei Cani con AI",
    content: `MyPetSenseAI è la piattaforma di 4BID SRL per il monitoraggio della salute dei cani tramite intelligenza artificiale. Categoria: Altri progetti (verticale pet care, non turismo).

Funzionalità:
- Analisi foto del cane con AI (occhi, pelle, pelo, denti)
- Monitoraggio benessere quotidiano
- Diario della salute personalizzato
- Piani dietetici personalizzati
- Report professionali per il veterinario
- Consigli personalizzati per razza ed età
- Sezione dedicata ai veterinari (vet/register)

Sito ufficiale: https://mypetsenseai.com
Pagina prodotto su 4bid.it: https://www.4bid.it/progetti/mypetsenseai`,
    keywords: [
      "mypetsenseai",
      "petsense",
      "pet care",
      "cani",
      "salute animali",
      "diario veterinario",
      "altri progetti",
      "4bid",
    ],
    is_active: true,
    priority: 8,
    created_by: "system",
  },
  {
    source: "manual",
    source_url: "https://www.4bid.it/progetti/risparmio-compulsivo",
    category: "product",
    title: "Risparmio Compulsivo - App di Gamification del Risparmio",
    content: `Risparmio Compulsivo è l'app di 4BID SRL che trasforma il risparmio personale in un gioco motivante e automatico. STATO: in sviluppo (70%). Categoria: Altri progetti (consumer fintech, non turismo).

Idea:
- Microsalvadanai automatici legati a regole di vita quotidiana
- Sfide e achievement per motivare al risparmio
- Round-up automatico dei pagamenti
- Obiettivi di risparmio personalizzati
- Educazione finanziaria gamificata

Pagina prodotto: https://www.4bid.it/progetti/risparmio-compulsivo`,
    keywords: [
      "risparmio compulsivo",
      "app risparmio",
      "gamification",
      "fintech",
      "in sviluppo",
      "altri progetti",
      "4bid",
    ],
    is_active: true,
    priority: 7,
    created_by: "system",
  },
]

let ok = 0
let fail = 0
for (const rec of records) {
  const { error } = await supabase.from("knowledge_base").insert(rec)
  if (error) {
    console.error(`  FAIL "${rec.title}":`, error.message)
    fail++
  } else {
    console.log(`  OK   "${rec.title}"`)
    ok++
  }
}

console.log(`\n  Inserted ${ok} records, ${fail} errors`)

// =====================================================================
// STEP 3: Verification
// =====================================================================
console.log("\nSTEP 3: Verifica finale")

const { data: counts } = await supabase
  .from("knowledge_base")
  .select("category, is_active")

const stats = counts.reduce(
  (acc, r) => {
    const k = `${r.category || "(null)"}_${r.is_active ? "active" : "inactive"}`
    acc[k] = (acc[k] || 0) + 1
    return acc
  },
  {},
)
console.log("Records by category × is_active:")
console.table(stats)

const { data: actives } = await supabase
  .from("knowledge_base")
  .select("title, source_url, category, priority, source")
  .eq("is_active", true)
  .order("priority", { ascending: false })
  .order("title")

console.log("\n=== Active records ===")
console.table(
  actives.map((r) => ({
    title: r.title.slice(0, 55),
    url: (r.source_url || "").slice(0, 45),
    cat: r.category,
    src: r.source,
    pri: r.priority,
  })),
)
