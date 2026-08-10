import type { QuoteBillingPeriod, QuoteProject, QuoteSupportTerms } from "./types"

export interface QuoteCatalogDependency { role?: "base" | "addon"; project?: string; requires_base?: boolean; required_kind?: "plan"; linked_project?: string | null }
export interface QuoteCatalogAlternativePeriod { billing_period: "monthly" | "yearly"; unit_amount: number; stripe_price_id?: string | null; discount_pct?: number }
export interface QuoteCatalogItem {
  id: string; project: Exclude<QuoteProject, "consulting" | "custom">; kind: "plan" | "module" | "setup" | "service"; name: string; description?: string; features: string[]; unit_amount: number; currency: string; billing_period: QuoteBillingPeriod; trial_days?: number; support?: QuoteSupportTerms; version?: string; configuration_schema?: Record<string, unknown>; raw_snapshot: Record<string, unknown>; source_id?: string; stripe_price_id?: string | null; billing_family?: string; alternative_period?: QuoteCatalogAlternativePeriod | null; dependency?: QuoteCatalogDependency | null
}

const PROJECTS = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const
type CatalogProject = (typeof PROJECTS)[number]
const DEFAULT_CATALOG_URLS: Record<CatalogProject, string> = {
  hotelaccelerator: "https://baldznorrxlctucsfsto.supabase.co/functions/v1/quote-catalog",
  santaddeo: "https://aeynirkfixurikshxfov.supabase.co/functions/v1/quote-catalog",
  hotelprofitai: "https://jzfwplsgmcgfqnkkhddc.supabase.co/functions/v1/quote-catalog",
  manubot: "https://bblgrdukgxkszuayzqjt.supabase.co/functions/v1/quote-catalog",
}

const SALES_INTRO: Record<CatalogProject, string> = {
  hotelaccelerator: "Tutto il tuo hotel in un unico ecosistema: meno lavoro manuale, più richieste trasformate in prenotazioni e un team che finalmente respira.",
  santaddeo: "Basta prezzi decisi a intuito: leggi la domanda in anticipo e proteggi ADR, occupazione e ricavi ogni singolo giorno dell'anno.",
  hotelprofitai: "Scopri dove stai perdendo margine prima che sia troppo tardi: costi, margini e KPI finalmente chiari, per decidere con i numeri e non a sensazione.",
  manubot: "Basta caos, telefonate e cose dimenticate: ogni attività diventa un flusso ordinato e tracciabile, e il tuo team lavora sereno.",
}

// Copy curato e ad alto impatto emotivo, gestito da 4BID (indipendente dalle
// descrizioni dei cataloghi esterni). Chiave = nome della voce senza il suffisso
// "— annuale". Se una voce non ha override, si usa la descrizione del catalogo e,
// in ultima istanza, l'intro di progetto. Cambiare qui = cambiare cosa legge il
// cliente sul preventivo.
const SALES_COPY: Record<CatalogProject, Record<string, string>> = {
  hotelaccelerator: {
    "HotelAccelerator Suite": "Il cuore digitale del tuo hotel: attiva la piattaforma e porta sito, contatti, conversazioni e dati in un unico posto, pronto a crescere con te.",
    "CMS": "Un sito che lavora per te: pagine modulari e SEO-ready che trasformano i visitatori in prenotazioni dirette, senza commissioni.",
    "Inbox": "Tutte le conversazioni — email, chat e messaggi — in un'unica casella: nessuna richiesta persa, ogni ospite seguito in tempo.",
    "CRM": "Conosci davvero i tuoi ospiti: contatti, segmenti e relazioni organizzati per far tornare chi ha già scelto te.",
    "AI": "Rispondi in un attimo anche quando il team è sotto pressione: l'AI suggerisce e automatizza le risposte, tu mantieni il controllo.",
    "Tracking & Eventi": "Sai esattamente cosa funziona: eventi e tracciamento indipendenti dal sito per decidere con i dati, non a intuito.",
    "Sito pubblico": "La vetrina pubblica della tua struttura, veloce e curata, che regala subito una prima impressione da ricordare.",
    "Revenue (Santaddeo)": "Il revenue management dentro la tua suite: leggi la domanda e ottimizza i prezzi senza saltare da uno strumento all'altro.",
    "Operations (Manubot)": "Task, manutenzioni e housekeeping sotto controllo con i bot: meno cose dimenticate, un team più sereno.",
    "HotelProfitAI": "Finalmente sai quanto guadagni davvero: analisi di profittabilità per proteggere il margine su ogni camera.",
    "White Label": "Il tuo brand protagonista assoluto: togli la firma 4BID e presenta ai clienti una piattaforma tutta tua.",
  },
  santaddeo: {
    "Santaddeo RMS": "Basta prezzi decisi a intuito: Santaddeo legge domanda e mercato e ti guida a proteggere ADR, occupazione e ricavi ogni giorno dell'anno.",
    "Premium Expert": "Non sei mai solo davanti alle scelte difficili: un consulente Revenue dedicato prende in carico le tue conversazioni e ti guida con strategie su misura.",
    "Booking Pace": "Anticipa l'andamento delle prenotazioni: confronta l'on-the-books con lo stesso momento dell'anno scorso e agisci prima che sia tardi.",
    "Rate Shopper": "Non perdere mai di vista i competitor: confronta i tuoi prezzi con il tuo set competitivo giorno per giorno e posizionati sempre al punto giusto.",
    "Traffico Web": "Trasforma l'interesse in segnale di prezzo: misura la domanda diretta sul tuo sito, in forma anonima, e usala per vendere meglio.",
    "Air Market Intelligence": "Scopri da dove arriveranno i tuoi ospiti: analizza i voli in arrivo e punta marketing e prezzi sui mercati che stanno crescendo.",
    "Bilancio Commerciale": "Vedi ogni giorno se stai raggiungendo gli obiettivi: prenotazioni, cancellazioni e saldo netto sotto controllo, senza sorprese a fine mese.",
  },
  hotelprofitai: {
    "Entry": "Prova HotelProfitAI per 30 giorni, senza impegno e senza rischi: scopri quanto puoi guadagnare vedendo davvero i tuoi numeri.",
    "Base": "Il primo passo verso il controllo di gestione: budget, insight AI ed export pensati per chi vuole iniziare a decidere con i numeri.",
    "Pro": "Analisi avanzate e integrazioni complete per chi vuole spingere il margine: forecast, benchmark e AI al servizio dei tuoi risultati.",
    "Enterprise": "Il controllo totale per catene e gruppi: multi-struttura, SLA e report su misura per governare la redditività ovunque.",
    "Costo Camera Dettagliato": "Sai quanto ti costa davvero ogni camera occupata: lavanderia, amenities, pulizia e utenze al centesimo, per difendere il margine netto.",
    "Gestione Fornitori": "Metti ordine tra i fornitori: rating, storico spesa e alert scadenze per non pagare mai più del necessario.",
    "Integrazione PMS Diretta": "Basta inserimenti manuali: occupazione, tariffe e revenue arrivano in automatico dal tuo PMS, sempre aggiornati.",
    "Integrazione Santaddeo": "Pricing e profittabilità che si parlano: dati e alert di Santaddeo dentro HotelProfitAI per decisioni ancora più precise.",
    "Metriche e analisi aziende": "Lavora solo con partner affidabili: verifica clienti e fornitori negli archivi ufficiali e confronta i tuoi numeri con il tuo settore.",
    "Report PDF Automatici": "Report pronti ogni mese senza muovere un dito: KPI, costi e margini brandizzati, dritti a te e al commercialista.",
    "AI Chat Consulenza": "L'AI analizza, il tuo commercialista conferma: risposte affidabili sui tuoi conti, con la sicurezza di un professionista.",
    "AI Chat Pro": "Fai domande sui tuoi conti come parlassi a un esperto: fatture, costi, budget e KPI, con risposte in tempo reale sui dati veri.",
    "AI Insights Avanzati": "Guarda avanti, non solo indietro: forecast, previsione dell'occupazione e alert automatici che ti avvisano prima dei problemi.",
    "Benchmark KPI": "Scopri come vai davvero rispetto al mercato: confronta i tuoi KPI con il settore e trova subito dove puoi migliorare.",
    "Budget Avanzato": "Pianifica con sicurezza: budget per centro di costo, scenari what-if e alert sugli sforamenti prima che pesino sul risultato.",
  },
  manubot: {
    "Starter": "Metti ordine da subito: interventi, utenti e manutenzioni essenziali organizzati, per chi gestisce una singola struttura.",
    "Professional": "Il team operativo che gira da solo: automazioni, bot Telegram e report avanzati per chiudere prima ogni attività.",
    "Business": "Governa più strutture senza stress: WhatsApp, API, supporto prioritario e onboarding su misura per il tuo facility management.",
    "Corporate": "La soluzione su misura per catene e grandi gruppi: dimensionata su utenti, volumi, AI e SLA, per tenere davvero tutto sotto controllo.",
    "SuperGovernante AI": "La qualità delle camere non si discute più: l'AI confronta le foto di fine pulizia con il tuo standard e segnala subito cosa manca.",
    "Housekeeping": "Il piano pulizie che si aggiorna da solo: biancheria e addebiti frigobar registrati dal bot in 7 lingue, con notifica immediata.",
  },
}

function displayName(name: string): string {
  return name.replace(/\s*[—–-]\s*annuale\s*$/i, "").trim()
}

function salesDescription(project: CatalogProject, name: string, kind: string, original?: string) {
  const key = displayName(name)
  // 1) copy curato da 4BID (massimo impatto emotivo)
  const override = SALES_COPY[project]?.[key] || (key.toLowerCase().startsWith("housekeeping") ? SALES_COPY[project]?.["Housekeeping"] : undefined)
  if (override) return override
  // 2) descrizione specifica del catalogo (già orientata al beneficio)
  const source = original?.trim()
  if (source) return source
  // 3) fallback: intro di progetto (modulo con nome davanti per contesto)
  return kind === "module" ? `${key}: ${SALES_INTRO[project]}` : SALES_INTRO[project]
}

function envName(project: CatalogProject, suffix: string): string { return `${project.toUpperCase()}_${suffix}` }
function asBillingPeriod(value: unknown): QuoteBillingPeriod {
  if (value === "one_time" || value === "monthly" || value === "quarterly" || value === "yearly") return value
  if (value === "month") return "monthly"; if (value === "quarter") return "quarterly"; if (value === "year" || value === "annual") return "yearly"; return "monthly"
}
function normalizeAlternative(value: any): QuoteCatalogAlternativePeriod | null {
  if (!value || typeof value !== "object") return null
  const period = asBillingPeriod(value.billing_period ?? value.interval)
  if (period !== "monthly" && period !== "yearly") return null
  const price = Number(value.unit_amount ?? value.price ?? 0)
  if (!Number.isFinite(price) || price < 0) return null
  return { billing_period: period, unit_amount: price, stripe_price_id: value.stripe_price_id ?? null, discount_pct: Number.isFinite(Number(value.discount_pct)) ? Number(value.discount_pct) : undefined }
}
function inferredDependency(project: CatalogProject, kind: string): QuoteCatalogDependency | null {
  if (kind === "plan") return { role: "base", project }
  if (kind === "module") return { role: "addon", project, requires_base: true, required_kind: "plan" }
  return null
}
function normalize(project: CatalogProject, value: any): QuoteCatalogItem {
  const price = Number(value.unit_amount ?? value.price ?? value.amount ?? 0)
  const allowedKinds = new Set(["plan", "module", "setup", "service"])
  const kind = allowedKinds.has(value.kind) ? value.kind : value.type === "addon" ? "module" : "plan"
  const name = String(value.name ?? value.title ?? value.id)
  const configuration = value.configuration_schema ?? value.options_schema ?? {}
  return {
    id: String(value.id ?? value.code ?? value.slug), source_id: value.source_id == null ? undefined : String(value.source_id), project, kind, name,
    description: salesDescription(project, name, kind, value.description ? String(value.description) : undefined),
    features: Array.isArray(value.features) ? value.features.map((feature: any) => typeof feature === "string" ? feature : String(feature.name ?? feature.label ?? feature.id)) : [],
    unit_amount: Number.isFinite(price) ? Math.max(0, price) : 0, currency: String(value.currency ?? "eur").toLowerCase(), billing_period: asBillingPeriod(value.billing_period ?? value.interval), trial_days: Math.max(0, Number(value.trial_days ?? value.trial_period_days ?? 0) || 0), support: value.support ?? undefined, version: String(value.version ?? value.updated_at ?? "current"),
    configuration_schema: { ...configuration, _4bid_brand: { project, label: project === "hotelaccelerator" ? "HotelAccelerator" : project === "hotelprofitai" ? "HotelProfitAI" : project === "manubot" ? "ManuBot" : "Santaddeo" } },
    stripe_price_id: value.stripe_price_id ?? null, billing_family: value.billing_family ? String(value.billing_family) : value.source_id ? String(value.source_id) : undefined, alternative_period: normalizeAlternative(value.alternative_period), dependency: value.dependency && typeof value.dependency === "object" ? value.dependency : inferredDependency(project, kind), raw_snapshot: value.raw_snapshot && typeof value.raw_snapshot === "object" ? value.raw_snapshot : value,
  }
}
async function loadProjectCatalog(project: CatalogProject): Promise<QuoteCatalogItem[]> {
  const url = process.env[envName(project, "CATALOG_URL")] || DEFAULT_CATALOG_URLS[project]
  const token = process.env[envName(project, "CATALOG_TOKEN")]
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    if (!response.ok) throw new Error(`${project}: catalogo non disponibile (${response.status})`)
    const body = await response.json(); const rows = Array.isArray(body) ? body : body.items ?? body.products ?? body.plans ?? []
    if (!Array.isArray(rows)) throw new Error(`${project}: formato catalogo non valido`)
    return rows.map((row: any) => normalize(project, row))
  } finally { clearTimeout(timeout) }
}
export async function getFederatedCatalog() {
  const results = await Promise.allSettled(PROJECTS.map(async (project) => ({ project, items: await loadProjectCatalog(project) })))
  return results.map((result, index) => result.status === "fulfilled" ? { ...result.value, configured: result.value.items.length > 0, error: null } : { project: PROJECTS[index], items: [], configured: false, error: result.reason?.name === "AbortError" ? `${PROJECTS[index]}: timeout catalogo` : result.reason?.message ?? "Errore catalogo" })
}
