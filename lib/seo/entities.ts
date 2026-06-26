// Registro unico delle ENTITÀ del sito 4BID (Entity SEO / Knowledge Graph).
// Sorgente di verità per:
//  - la rete di collegamenti contestuali tra brand, persona, metodo, prodotti e concetti RM
//  - la sezione visibile "Approfondimenti correlati" (componente EntityLinks)
//  - i riferimenti JSON-LD `about` / `mentions` collegati via @id (StructuredData)
//
// REGOLE: nessun dato inventato. I link visibili puntano SOLO a pagine reali
// esistenti. I concetti senza pagina dedicata restano solo riferimenti schema
// (Thing) e non vengono mostrati come link.
//
// NB: gli @id devono restare allineati con components/seo-structured-data.tsx.

const BASE = "https://www.4bid.it"
export const ORG_ID = `${BASE}/#organization`
export const PERSON_ID = `${BASE}/#person`
export const WEBSITE_ID = `${BASE}/#website`

export type EntityKey =
  | "4bid"
  | "filippo-mancini"
  | "metodo-4bid"
  | "santaddeo"
  | "hotel-accelerator"
  | "hotelprofitai"
  | "manubot"
  | "revenue-management"
  | "ai-hotel"
  | "forecast"
  | "dynamic-pricing"
  | "ota"
  | "booking-engine"
  | "pms"

// Riferimento entità per JSON-LD: o un @id stabile (Org/Person) o un nodo inline.
export type EntityRef = { "@id": string } | { "@type": string; name: string; url?: string }

type Entity = {
  key: EntityKey
  name: string
  schemaType: string
  // Percorso interno reale della pagina (per i link visibili). null = nessuna pagina.
  path: string | null
  short: string
  // @id stabile nel @graph (solo Organization e Person).
  id?: string
  // Rete di collegamenti contestuali verso altre entità.
  related: EntityKey[]
  // Entità "soggetto" della pagina (schema about). Le altre related → mentions.
  about?: EntityKey[]
}

export const ENTITIES: Record<EntityKey, Entity> = {
  "4bid": {
    key: "4bid",
    name: "4BID",
    schemaType: "Organization",
    path: "/chi-siamo",
    short: "La software house e società di revenue management dietro i prodotti.",
    id: ORG_ID,
    related: ["filippo-mancini", "metodo-4bid", "santaddeo", "hotel-accelerator", "hotelprofitai", "manubot"],
    about: ["4bid"],
  },
  "filippo-mancini": {
    key: "filippo-mancini",
    name: "Filippo Mancini",
    schemaType: "Person",
    path: "/filippo-mancini",
    short: "Fondatore di 4BID e ideatore dei quattro prodotti.",
    id: PERSON_ID,
    related: ["4bid", "metodo-4bid", "santaddeo", "hotel-accelerator", "hotelprofitai", "manubot"],
    about: ["filippo-mancini"],
  },
  "metodo-4bid": {
    key: "metodo-4bid",
    name: "Il Metodo 4BID",
    schemaType: "Article",
    path: "/metodo-4bid",
    short: "Revenue management, dati, AI e automazioni in un unico approccio.",
    related: ["revenue-management", "santaddeo", "hotel-accelerator", "hotelprofitai", "filippo-mancini", "4bid"],
    about: ["metodo-4bid", "revenue-management"],
  },
  santaddeo: {
    key: "santaddeo",
    name: "Santaddeo",
    schemaType: "SoftwareApplication",
    path: "/progetti/santaddeo",
    short: "Il software di revenue management intelligente e trasparente.",
    related: ["revenue-management", "dynamic-pricing", "forecast", "ota", "ai-hotel", "metodo-4bid", "hotel-accelerator"],
    about: ["santaddeo", "revenue-management"],
  },
  "hotel-accelerator": {
    key: "hotel-accelerator",
    name: "Hotel Accelerator",
    schemaType: "SoftwareApplication",
    path: "/progetti/hotel-accelerator",
    short: "La piattaforma per la crescita commerciale della struttura.",
    related: ["revenue-management", "ota", "booking-engine", "metodo-4bid", "santaddeo", "hotelprofitai"],
    about: ["hotel-accelerator"],
  },
  hotelprofitai: {
    key: "hotelprofitai",
    name: "HotelProfitAI",
    schemaType: "SoftwareApplication",
    path: "/progetti/hotelprofit-ai",
    short: "Il controllo di gestione e la marginalità per le strutture ricettive.",
    related: ["forecast", "revenue-management", "metodo-4bid", "santaddeo", "hotel-accelerator", "manubot"],
    about: ["hotelprofitai"],
  },
  manubot: {
    key: "manubot",
    name: "ManuBot",
    schemaType: "SoftwareApplication",
    path: "/progetti/manubot",
    short: "L'automazione delle operations e della governance operativa.",
    related: ["ai-hotel", "hotel-accelerator", "metodo-4bid", "4bid", "santaddeo"],
    about: ["manubot"],
  },

  // ---- Concetti di dominio (Thing) -> puntano alla landing più pertinente ----
  "revenue-management": {
    key: "revenue-management",
    name: "Revenue Management",
    schemaType: "Thing",
    path: "/soluzioni-revenue-management",
    short: "La disciplina per vendere la camera giusta al prezzo giusto.",
    related: ["dynamic-pricing", "forecast", "ota", "santaddeo", "metodo-4bid"],
  },
  "ai-hotel": {
    key: "ai-hotel",
    name: "AI per Hotel",
    schemaType: "Thing",
    path: null,
    short: "Intelligenza artificiale applicata alla gestione alberghiera.",
    related: ["santaddeo", "manubot", "metodo-4bid"],
  },
  forecast: {
    key: "forecast",
    name: "Forecast",
    schemaType: "Thing",
    path: "/forecast-budgeting-hotel",
    short: "Previsione di domanda e ricavi per decidere in anticipo.",
    related: ["revenue-management", "hotelprofitai", "dynamic-pricing"],
  },
  "dynamic-pricing": {
    key: "dynamic-pricing",
    name: "Dynamic Pricing",
    schemaType: "Thing",
    path: "/dynamic-pricing-hotel",
    short: "Prezzi dinamici guidati da domanda e mercato.",
    related: ["revenue-management", "santaddeo", "forecast"],
  },
  ota: {
    key: "ota",
    name: "OTA",
    schemaType: "Thing",
    path: "/ottimizzazione-ota-hotel",
    short: "Canali di distribuzione online e loro ottimizzazione.",
    related: ["revenue-management", "booking-engine", "hotel-accelerator"],
  },
  "booking-engine": {
    key: "booking-engine",
    name: "Booking Engine",
    schemaType: "Thing",
    path: "/prenotazioni-dirette-hotel",
    short: "Il motore di prenotazione per le vendite dirette.",
    related: ["ota", "hotel-accelerator", "revenue-management"],
  },
  pms: {
    key: "pms",
    name: "PMS",
    schemaType: "Thing",
    path: null,
    short: "Property Management System, il gestionale della struttura.",
    related: ["santaddeo", "revenue-management"],
  },
}

const abs = (path: string) => `${BASE}${path}`

// Riferimento JSON-LD di una entità: @id stabile se disponibile, altrimenti nodo inline.
export function entityRef(key: EntityKey): EntityRef {
  const e = ENTITIES[key]
  if (e.id) return { "@id": e.id }
  return e.path
    ? { "@type": e.schemaType, name: e.name, url: abs(e.path) }
    : { "@type": e.schemaType, name: e.name }
}

// about + mentions per lo schema della pagina di una entità.
export function entitySchemaLinks(key: EntityKey): { about: EntityRef[]; mentions: EntityRef[] } {
  const e = ENTITIES[key]
  const aboutKeys = e.about ?? [key]
  const mentionKeys = e.related.filter((k) => !aboutKeys.includes(k))
  return {
    about: aboutKeys.map(entityRef),
    mentions: mentionKeys.map(entityRef),
  }
}

export type EntityLink = { key: EntityKey; name: string; href: string; short: string }

// Link visibili "Approfondimenti correlati": solo entità con pagina reale.
export function getRelatedEntityLinks(key: EntityKey, limit = 6): EntityLink[] {
  const e = ENTITIES[key]
  if (!e) return []
  return e.related
    .map((k) => ENTITIES[k])
    .filter((r): r is Entity => Boolean(r && r.path))
    .slice(0, limit)
    .map((r) => ({ key: r.key, name: r.name, href: r.path as string, short: r.short }))
}
