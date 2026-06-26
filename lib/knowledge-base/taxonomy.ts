// Tassonomia della Knowledge Base pubblica 4BID: Categoria → Sottocategoria → Guida.
// FASE 5 = SOLA STRUTTURA. Il registro GUIDES è predisposto ma vuoto: nessun
// contenuto/articolo viene scritto ora. Aggiungere guide qui le renderà
// automaticamente attive (route, sitemap, link correlati, schema).

import type { KBCategory, KBGuide } from "./types"

export const KB_BASE_PATH = "/knowledge-base"
export const KB_BASE_URL = "https://www.4bid.it/knowledge-base"
export const KB_DEFAULT_AUTHOR = "Redazione 4BID"

export const CATEGORIES: KBCategory[] = [
  {
    slug: "revenue-management",
    name: "Revenue Management",
    title: "Revenue Management per Hotel: guide e fondamenti",
    short: "Fondamenti, forecast e logica del revenue management alberghiero.",
    intro:
      "Il Revenue Management è la disciplina che ottimizza prezzi e disponibilità per massimizzare il ricavo totale della struttura. In questa categoria raccogliamo i fondamenti, le logiche di forecast e gli indicatori che guidano le decisioni quotidiane.",
    icon: "TrendingUp",
    entity: "revenue-management",
    subcategories: [
      { slug: "fondamenti", name: "Fondamenti", description: "Concetti base e principi del revenue management." },
      { slug: "forecast", name: "Forecast & Budgeting", description: "Previsione di domanda, ricavi e budget." },
      { slug: "strategia", name: "Strategia", description: "Segmentazione, posizionamento e piani d'azione." },
    ],
    faqs: [
      {
        question: "Cos'è il revenue management alberghiero?",
        answer:
          "È la disciplina gestionale che ottimizza prezzi e disponibilità per vendere la camera giusta, al cliente giusto, al momento giusto e al prezzo giusto, massimizzando il ricavo totale.",
      },
      {
        question: "Il revenue management serve solo agli hotel grandi?",
        answer:
          "No. Si applica a qualsiasi struttura ricettiva — hotel indipendenti, B&B, resort, agriturismi e case vacanza — adattando metodi e strumenti alle dimensioni.",
      },
    ],
  },
  {
    slug: "kpi",
    name: "KPI & Metriche",
    title: "KPI e metriche per hotel: ADR, RevPAR, occupazione",
    short: "Gli indicatori che misurano la performance: ADR, RevPAR, occupazione e oltre.",
    intro:
      "I KPI traducono la performance della struttura in numeri confrontabili. Qui spieghiamo come si calcolano e si leggono ADR, RevPAR, occupazione, TRevPAR e GOPPAR, e come usarli per decidere.",
    icon: "BarChart3",
    subcategories: [
      { slug: "ricavo", name: "Indicatori di ricavo", description: "ADR, RevPAR, TRevPAR e marginalità." },
      { slug: "domanda", name: "Indicatori di domanda", description: "Occupazione, pick-up e pace." },
    ],
    faqs: [
      {
        question: "Qual è la differenza tra ADR e RevPAR?",
        answer:
          "L'ADR è la tariffa media sulle camere vendute; il RevPAR è il ricavo per camera disponibile e combina occupazione e tariffa media in un solo indicatore.",
      },
    ],
  },
  {
    slug: "pricing",
    name: "Pricing & Tariffe",
    title: "Pricing e strategie tariffarie per hotel",
    short: "Dynamic pricing, BAR e strategie tariffarie per ogni stagione.",
    intro:
      "Il pricing definisce come e a quanto vendere le camere. In questa categoria trattiamo la costruzione della struttura tariffaria, il dynamic pricing e le restrizioni che proteggono il ricavo.",
    icon: "Tag",
    entity: "dynamic-pricing",
    subcategories: [
      { slug: "dynamic-pricing", name: "Dynamic Pricing", description: "Prezzi dinamici guidati dalla domanda." },
      { slug: "strategie", name: "Strategie tariffarie", description: "BAR, restrizioni e livelli di prezzo." },
    ],
    faqs: [
      {
        question: "Cos'è il dynamic pricing?",
        answer:
          "È la strategia che adatta automaticamente le tariffe in base a domanda, occupazione, lead time e mercato, anziché mantenere prezzi statici tutto l'anno.",
      },
    ],
  },
  {
    slug: "distribuzione",
    name: "Distribuzione & Canali",
    title: "Distribuzione alberghiera: OTA, booking engine e canali",
    short: "OTA, booking engine, Google Hotel Ads e channel manager.",
    intro:
      "La distribuzione governa dove e come vengono vendute le camere. Qui spieghiamo il ruolo delle OTA, del booking engine per le vendite dirette, di Google Hotel Ads e del channel manager.",
    icon: "Share2",
    entity: "ota",
    subcategories: [
      { slug: "ota", name: "OTA", description: "Portali di prenotazione e loro ottimizzazione." },
      { slug: "diretto", name: "Canale diretto", description: "Booking engine e prenotazioni dirette." },
      { slug: "metasearch", name: "Metasearch", description: "Google Hotel Ads e comparatori." },
    ],
  },
  {
    slug: "tecnologia",
    name: "Tecnologia & Software",
    title: "Tecnologia e software per hotel: PMS, channel manager, RMS",
    short: "PMS, channel manager e l'ecosistema software della struttura.",
    intro:
      "La tecnologia è l'infrastruttura su cui poggiano revenue e operations. In questa categoria descriviamo PMS, channel manager e gli altri software che compongono lo stack alberghiero.",
    icon: "Server",
    entity: "pms",
    subcategories: [
      { slug: "pms", name: "PMS", description: "Property Management System e gestionali." },
      { slug: "stack", name: "Stack software", description: "Integrazioni e architettura degli strumenti." },
    ],
  },
  {
    slug: "ai-dati",
    name: "AI & Dati",
    title: "AI e dati per hotel: intelligenza artificiale e business intelligence",
    short: "Intelligenza artificiale, machine learning e business intelligence.",
    intro:
      "Dati e intelligenza artificiale rendono le decisioni più rapide e informate. Qui trattiamo AI applicata al revenue, machine learning per il forecast e business intelligence per il controllo.",
    icon: "Brain",
    entity: "ai-hotel",
    subcategories: [
      { slug: "ai", name: "Intelligenza Artificiale", description: "AI applicata a revenue e operations." },
      { slug: "bi", name: "Business Intelligence", description: "Report, cruscotti e analisi dei dati." },
    ],
  },
  {
    slug: "vendite-marketing",
    name: "Vendite & Marketing",
    title: "Vendite e marketing per hotel: upselling, cross selling, diretto",
    short: "Upselling, cross selling e crescita delle vendite dirette.",
    intro:
      "Vendite e marketing aumentano il valore di ogni ospite e il peso del canale diretto. In questa categoria trattiamo upselling, cross selling e le leve per vendere di più senza intermediari.",
    icon: "ShoppingCart",
    subcategories: [
      { slug: "ancillary", name: "Ricavi ancillari", description: "Upselling e cross selling." },
      { slug: "diretto", name: "Vendita diretta", description: "Strategie per il canale diretto." },
    ],
  },
  {
    slug: "operations",
    name: "Operations & Automazioni",
    title: "Operations e automazioni per hotel",
    short: "Automazioni e governance operativa della struttura.",
    intro:
      "Le operations garantiscono che la strategia diventi esecuzione. Qui trattiamo le automazioni dei processi e la governance operativa che riduce errori e tempi.",
    icon: "Workflow",
    subcategories: [
      { slug: "automazioni", name: "Automazioni", description: "Flussi automatici e riduzione del lavoro manuale." },
      { slug: "governance", name: "Governance operativa", description: "Coordinamento e controllo delle attività." },
    ],
  },
  {
    slug: "case-study",
    name: "Case Study",
    title: "Case study di revenue management alberghiero",
    short: "Esempi e analisi applicate (in arrivo).",
    intro:
      "I case study mostrano metodi e risultati in contesti reali. Questa sezione è predisposta per ospitare analisi applicate; i contenuti verranno pubblicati progressivamente.",
    icon: "FileText",
    subcategories: [
      { slug: "applicazioni", name: "Applicazioni", description: "Esempi di metodo applicato." },
    ],
  },
]

/**
 * Registro delle GUIDE. FASE 5: VUOTO per scelta — nessun contenuto viene
 * scritto ora. Aggiungere qui un oggetto KBGuide (con published: true) attiva
 * automaticamente route, sitemap, breadcrumb, correlati e schema.
 */
export const GUIDES: KBGuide[] = []

// ---------------------------------------------------------------------------
// Indici e helper
// ---------------------------------------------------------------------------

const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]))

export function getCategory(slug: string): KBCategory | undefined {
  return CATEGORY_BY_SLUG.get(slug)
}

export function getAllCategories(): KBCategory[] {
  return CATEGORIES
}

/** Solo guide pubblicate (con contenuto). In FASE 5 ritorna []. */
export function getPublishedGuides(): KBGuide[] {
  return GUIDES.filter((g) => g.published)
}

export function getGuide(slug: string): KBGuide | undefined {
  return GUIDES.find((g) => g.slug === slug && g.published)
}

export function getGuidesByCategory(categorySlug: string): KBGuide[] {
  return getPublishedGuides().filter((g) => g.categorySlug === categorySlug)
}

export function getGuidesBySubcategory(categorySlug: string, subcategorySlug: string): KBGuide[] {
  return getPublishedGuides().filter(
    (g) => g.categorySlug === categorySlug && g.subcategorySlug === subcategorySlug,
  )
}

/**
 * Guide correlate: prima quelle esplicite, poi le "sorelle" della stessa
 * categoria, fino a `limit`. Tutte filtrate per published.
 */
export function getRelatedGuides(slug: string, limit = 4): KBGuide[] {
  const current = getGuide(slug)
  if (!current) return []
  const explicit = (current.relatedGuides ?? [])
    .map((s) => getGuide(s))
    .filter((g): g is KBGuide => Boolean(g))
  const siblings = getGuidesByCategory(current.categorySlug).filter(
    (g) => g.slug !== slug && !explicit.some((e) => e.slug === g.slug),
  )
  return [...explicit, ...siblings].slice(0, limit)
}

export function categoryUrl(slug: string): string {
  return `${KB_BASE_URL}/${slug}`
}

export function guideUrl(categorySlug: string, guideSlug: string): string {
  return `${KB_BASE_URL}/${categorySlug}/${guideSlug}`
}
