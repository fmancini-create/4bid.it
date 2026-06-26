// Glossario centrale della Knowledge Base 4BID.
// Definizioni FATTUALI e standard del settore hospitality/revenue management.
// Ogni termine è richiamabile automaticamente nelle guide (auto-link) e ha
// una pagina dedicata /glossario/[slug] per l'Entity SEO.

import type { GlossaryTerm } from "./types"

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "revenue-management",
    term: "Revenue Management",
    definition:
      "Disciplina gestionale che ottimizza prezzi e disponibilità per vendere la camera giusta, al cliente giusto, al momento giusto e al prezzo giusto, massimizzando il ricavo totale.",
    categorySlug: "revenue-management",
    related: ["forecast", "dynamic-pricing", "revpar", "adr"],
    entity: "revenue-management",
    aliases: ["revenue management", "gestione dei ricavi"],
  },
  {
    slug: "forecast",
    term: "Forecast",
    fullName: "Previsione della domanda",
    definition:
      "Previsione di domanda, occupazione e ricavi futuri basata su dati storici, pick-up e fattori di mercato, usata per decidere prezzi e strategie in anticipo.",
    categorySlug: "revenue-management",
    related: ["revenue-management", "pick-up", "budget"],
    entity: "forecast",
    aliases: ["forecast", "previsione", "forecasting"],
  },
  {
    slug: "pricing",
    term: "Pricing",
    definition:
      "Definizione e gestione delle tariffe di vendita delle camere, attraverso regole, livelli tariffari e restrizioni coerenti con la strategia commerciale.",
    categorySlug: "pricing",
    related: ["dynamic-pricing", "bar", "adr"],
    aliases: ["pricing", "tariffazione"],
  },
  {
    slug: "dynamic-pricing",
    term: "Dynamic Pricing",
    fullName: "Prezzi dinamici",
    definition:
      "Strategia di prezzo che adatta automaticamente le tariffe in base a domanda, occupazione, lead time e mercato, anziché mantenere prezzi statici.",
    categorySlug: "pricing",
    related: ["pricing", "revenue-management", "bar"],
    entity: "dynamic-pricing",
    aliases: ["dynamic pricing", "prezzi dinamici"],
  },
  {
    slug: "adr",
    term: "ADR",
    fullName: "Average Daily Rate",
    definition:
      "Tariffa media giornaliera: ricavo camere diviso il numero di camere vendute in un periodo. Misura il prezzo medio effettivo di vendita.",
    categorySlug: "kpi",
    related: ["revpar", "occupancy", "trevpar"],
    aliases: ["adr", "average daily rate", "tariffa media"],
  },
  {
    slug: "revpar",
    term: "RevPAR",
    fullName: "Revenue Per Available Room",
    definition:
      "Ricavo per camera disponibile: ricavo camere diviso il numero di camere disponibili. Combina occupazione e tariffa media in un unico indicatore.",
    categorySlug: "kpi",
    related: ["adr", "occupancy", "trevpar", "goppar"],
    aliases: ["revpar", "revenue per available room"],
  },
  {
    slug: "occupancy",
    term: "Occupazione",
    fullName: "Occupancy Rate",
    definition:
      "Percentuale di camere vendute rispetto a quelle disponibili in un periodo. Indicatore base della performance di vendita.",
    categorySlug: "kpi",
    related: ["revpar", "adr"],
    aliases: ["occupazione", "occupancy", "tasso di occupazione"],
  },
  {
    slug: "trevpar",
    term: "TRevPAR",
    fullName: "Total Revenue Per Available Room",
    definition:
      "Ricavo totale per camera disponibile, inclusi i ricavi extra-camera (ristorazione, spa, servizi). Misura la redditività complessiva della struttura.",
    categorySlug: "kpi",
    related: ["revpar", "goppar"],
    aliases: ["trevpar", "total revpar"],
  },
  {
    slug: "goppar",
    term: "GOPPAR",
    fullName: "Gross Operating Profit Per Available Room",
    definition:
      "Profitto operativo lordo per camera disponibile. Lega le performance di ricavo alla marginalità, considerando i costi operativi.",
    categorySlug: "kpi",
    related: ["revpar", "trevpar"],
    aliases: ["goppar"],
  },
  {
    slug: "bar",
    term: "BAR",
    fullName: "Best Available Rate",
    definition:
      "Migliore tariffa disponibile al pubblico per una data, usata come riferimento per la struttura tariffaria.",
    categorySlug: "pricing",
    related: ["pricing", "dynamic-pricing", "los"],
    aliases: ["bar", "best available rate"],
  },
  {
    slug: "los",
    term: "LOS",
    fullName: "Length of Stay",
    definition:
      "Durata del soggiorno, espressa in notti. Usata come leva tariffaria tramite restrizioni di soggiorno minimo o massimo.",
    categorySlug: "pricing",
    related: ["bar", "pick-up"],
    aliases: ["los", "length of stay", "durata del soggiorno"],
  },
  {
    slug: "pick-up",
    term: "Pick-up",
    definition:
      "Ritmo di acquisizione delle prenotazioni per una data futura in un dato intervallo di tempo. Indicatore chiave per il forecast e le decisioni di prezzo.",
    categorySlug: "revenue-management",
    related: ["forecast", "revenue-management"],
    aliases: ["pick-up", "pickup"],
  },
  {
    slug: "comp-set",
    term: "Comp Set",
    fullName: "Competitive Set",
    definition:
      "Insieme degli hotel concorrenti di riferimento, usato per confrontare tariffe e posizionamento di mercato.",
    categorySlug: "revenue-management",
    related: ["revenue-management", "dynamic-pricing"],
    aliases: ["comp set", "competitive set", "compset"],
  },
  {
    slug: "ota",
    term: "OTA",
    fullName: "Online Travel Agency",
    definition:
      "Agenzia di viaggio online (es. portali di prenotazione) che distribuisce le camere in cambio di una commissione.",
    categorySlug: "distribuzione",
    related: ["booking-engine", "channel-manager", "google-hotel-ads"],
    entity: "ota",
    aliases: ["ota", "online travel agency"],
  },
  {
    slug: "booking-engine",
    term: "Booking Engine",
    fullName: "Motore di prenotazione",
    definition:
      "Sistema integrato nel sito della struttura che consente all'ospite di prenotare direttamente, senza intermediari.",
    categorySlug: "distribuzione",
    related: ["ota", "channel-manager"],
    entity: "booking-engine",
    aliases: ["booking engine", "motore di prenotazione"],
  },
  {
    slug: "google-hotel-ads",
    term: "Google Hotel Ads",
    definition:
      "Piattaforma pubblicitaria di Google che mostra prezzi e disponibilità degli hotel nei risultati di ricerca e su Maps, in formato metasearch.",
    categorySlug: "distribuzione",
    related: ["ota", "booking-engine"],
    aliases: ["google hotel ads", "hotel ads"],
  },
  {
    slug: "channel-manager",
    term: "Channel Manager",
    definition:
      "Software che sincronizza tariffe e disponibilità su tutti i canali di vendita (OTA, sito, GDS) da un'unica interfaccia, evitando overbooking e disparità.",
    categorySlug: "distribuzione",
    related: ["ota", "pms", "booking-engine"],
    aliases: ["channel manager"],
  },
  {
    slug: "pms",
    term: "PMS",
    fullName: "Property Management System",
    definition:
      "Gestionale della struttura che amministra prenotazioni, check-in/out, camere, anagrafiche e fatturazione.",
    categorySlug: "tecnologia",
    related: ["channel-manager", "hotel-software"],
    entity: "pms",
    aliases: ["pms", "property management system", "gestionale"],
  },
  {
    slug: "hotel-software",
    term: "Hotel Software",
    definition:
      "Insieme degli strumenti software che supportano la gestione alberghiera: PMS, channel manager, RMS, CRM, booking engine.",
    categorySlug: "tecnologia",
    related: ["pms", "channel-manager"],
    aliases: ["hotel software", "software per hotel"],
  },
  {
    slug: "ai",
    term: "AI",
    fullName: "Intelligenza Artificiale",
    definition:
      "Tecnologie che permettono ai sistemi di analizzare dati, riconoscere pattern e supportare o automatizzare decisioni, applicate al revenue e alle operations.",
    categorySlug: "ai-dati",
    related: ["machine-learning", "business-intelligence"],
    entity: "ai-hotel",
    aliases: ["ai", "intelligenza artificiale", "artificial intelligence"],
  },
  {
    slug: "machine-learning",
    term: "Machine Learning",
    definition:
      "Branca dell'AI in cui i modelli apprendono dai dati storici per migliorare previsioni e raccomandazioni, ad esempio nel forecast della domanda.",
    categorySlug: "ai-dati",
    related: ["ai", "forecast", "business-intelligence"],
    aliases: ["machine learning", "apprendimento automatico"],
  },
  {
    slug: "business-intelligence",
    term: "Business Intelligence",
    fullName: "BI",
    definition:
      "Insieme di processi e strumenti che trasformano i dati grezzi in report e cruscotti utili a decisioni informate.",
    categorySlug: "ai-dati",
    related: ["ai", "machine-learning"],
    aliases: ["business intelligence", "bi"],
  },
  {
    slug: "upselling",
    term: "Upselling",
    definition:
      "Tecnica di vendita che propone all'ospite una camera o un servizio di categoria superiore rispetto a quello scelto, aumentando il valore della prenotazione.",
    categorySlug: "vendite-marketing",
    related: ["cross-selling", "adr"],
    aliases: ["upselling", "up-selling"],
  },
  {
    slug: "cross-selling",
    term: "Cross Selling",
    definition:
      "Tecnica di vendita che propone servizi complementari (ristorazione, spa, esperienze) in aggiunta al soggiorno, aumentando il ricavo per ospite.",
    categorySlug: "vendite-marketing",
    related: ["upselling", "trevpar"],
    aliases: ["cross selling", "cross-selling"],
  },
  {
    slug: "automazioni",
    term: "Automazioni",
    definition:
      "Flussi di lavoro automatici che eseguono attività ripetitive (messaggi, task operativi, aggiornamenti) senza intervento manuale, riducendo errori e tempi.",
    categorySlug: "operations",
    related: ["ai", "pms"],
    aliases: ["automazioni", "automazione", "automation"],
  },
]

const GLOSSARY_BY_SLUG = new Map(GLOSSARY.map((t) => [t.slug, t]))

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_BY_SLUG.get(slug)
}

export function getGlossaryByCategory(categorySlug: string): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.categorySlug === categorySlug)
}

/** Termini correlati di una voce (risolti in oggetti). */
export function getRelatedGlossaryTerms(slug: string): GlossaryTerm[] {
  const term = GLOSSARY_BY_SLUG.get(slug)
  if (!term?.related) return []
  return term.related.map((s) => GLOSSARY_BY_SLUG.get(s)).filter((t): t is GlossaryTerm => Boolean(t))
}
