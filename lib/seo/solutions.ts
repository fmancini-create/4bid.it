// Fonte dati unica delle landing/soluzioni Revenue Management.
// Usata da: Footer (de-orfanizza tutte le pagine), hub /soluzioni-revenue-management
// e componente RelatedSolutions (link interni contestuali nelle landing).
// NB: tenere allineato con app/sitemap.ts.

export type SolutionCluster =
  | "Consulenza & Strategia"
  | "Software & Tecnologia"
  | "Pricing & Tariffe"
  | "Distribuzione & Canali"
  | "Prenotazioni Dirette"
  | "Per Tipologia di Struttura"
  | "KPI, Analisi & Formazione"

export type Solution = {
  slug: string
  title: string
  short: string
  cluster: SolutionCluster
}

export const SOLUTIONS: Solution[] = [
  // Consulenza & Strategia
  {
    // Questa e' la pagina che si posiziona meglio di tutto il sito: da sola
    // regge 5 delle 10 chiavi per cui 4bid.it e' presente su Google, inclusa
    // "revenue management" (1.000 ricerche/mese). Mancava da questo elenco,
    // quindi ne' il Footer ne' RelatedSolutions la collegavano: riceveva 2 soli
    // link interni in tutto il sito. Metterla qui la collega da ogni landing.
    slug: "cose-il-revenue-management",
    title: "Cos'è il Revenue Management",
    short: "La guida di partenza: cos'è, come funziona e perché conviene.",
    cluster: "Consulenza & Strategia",
  },
  {
    // Pagina di ingresso per chi cerca partendo dal proprio problema, non dal
    // nome della soluzione. Inserita qui perche' Footer e RelatedSolutions
    // leggono questo elenco: senza, la pagina resterebbe collegata solo dalla
    // home e nessuna landing la raggiungerebbe.
    slug: "problemi-hotel-soluzioni",
    title: "Problemi e Soluzioni per Hotel",
    short: "Parti dal tuo problema e trova la soluzione 4BID che lo risolve.",
    cluster: "Consulenza & Strategia",
  },
  {
    slug: "consulenza-revenue-management-hotel",
    title: "Consulenza Revenue Management",
    short: "Strategia su misura per aumentare i ricavi della tua struttura.",
    cluster: "Consulenza & Strategia",
  },
  {
    slug: "consulenza-personalizzata-hotel",
    title: "Consulenza Personalizzata",
    short: "Affiancamento dedicato sulle tue esigenze specifiche.",
    cluster: "Consulenza & Strategia",
  },
  {
    slug: "revenue-manager-hotel-toscana",
    title: "Revenue Manager in Toscana",
    short: "Un revenue manager esterno per hotel e strutture toscane.",
    cluster: "Consulenza & Strategia",
  },
  {
    slug: "come-aumentare-ricavi-hotel",
    title: "Come Aumentare i Ricavi dell'Hotel",
    short: "Le leve concrete per far crescere il fatturato.",
    cluster: "Consulenza & Strategia",
  },
  {
    slug: "preventivi-progetti-personalizzati-hotel",
    title: "Preventivi e Progetti Personalizzati",
    short: "Soluzioni costruite sul tuo modello di business.",
    cluster: "Consulenza & Strategia",
  },

  // Software & Tecnologia
  {
    slug: "software-revenue-management-santaddeo",
    title: "Santaddeo: Software Revenue",
    short: "Il nostro software AI per il pricing automatico.",
    cluster: "Software & Tecnologia",
  },
  {
    slug: "software-revenue-management-hotel",
    title: "Software Revenue Management",
    short: "Tecnologia per automatizzare prezzi e distribuzione.",
    cluster: "Software & Tecnologia",
  },

  // Pricing & Tariffe
  {
    slug: "dynamic-pricing-hotel",
    title: "Dynamic Pricing Hotel",
    short: "Prezzi dinamici basati su domanda e mercato.",
    cluster: "Pricing & Tariffe",
  },
  {
    slug: "yield-management-hotel",
    title: "Yield Management Hotel",
    short: "Massimizza il ricavo per camera disponibile.",
    cluster: "Pricing & Tariffe",
  },
  {
    slug: "strategie-pricing-hotel",
    title: "Strategie di Pricing",
    short: "Imposta tariffe efficaci per ogni stagione.",
    cluster: "Pricing & Tariffe",
  },
  {
    slug: "ottimizzazione-adr-hotel",
    title: "Ottimizzazione ADR",
    short: "Aumenta la tariffa media giornaliera.",
    cluster: "Pricing & Tariffe",
  },
  {
    slug: "adr-hotel-come-aumentarlo",
    title: "Come Aumentare l'ADR",
    short: "Tecniche pratiche per alzare l'ADR.",
    cluster: "Pricing & Tariffe",
  },
  {
    slug: "ottimizzazione-prezzi-hotel-toscana",
    title: "Ottimizzazione Prezzi in Toscana",
    short: "Pricing ottimizzato per il mercato toscano.",
    cluster: "Pricing & Tariffe",
  },

  // Distribuzione & Canali
  {
    slug: "gestione-canali-distribuzione-hotel",
    title: "Gestione Canali di Distribuzione",
    short: "Coordina OTA e canali diretti senza disparità.",
    cluster: "Distribuzione & Canali",
  },
  {
    slug: "ottimizzazione-ota-hotel",
    title: "Ottimizzazione OTA",
    short: "Migliora visibilità e ranking sulle OTA.",
    cluster: "Distribuzione & Canali",
  },

  // Prenotazioni Dirette
  {
    slug: "prenotazioni-dirette-hotel",
    title: "Prenotazioni Dirette",
    short: "Riduci le commissioni aumentando il diretto.",
    cluster: "Prenotazioni Dirette",
  },
  {
    slug: "strategie-prenotazioni-dirette-hotel",
    title: "Strategie Prenotazioni Dirette",
    short: "Un piano per spostare volume sul tuo sito.",
    cluster: "Prenotazioni Dirette",
  },
  {
    slug: "strategie-vendita-diretta-hotel",
    title: "Strategie di Vendita Diretta",
    short: "Vendi di più senza intermediari.",
    cluster: "Prenotazioni Dirette",
  },
  {
    slug: "webmarketing-hotel-prenotazioni",
    title: "Web Marketing per Prenotazioni",
    short: "Campagne e funnel per il canale diretto.",
    cluster: "Prenotazioni Dirette",
  },

  // Per Tipologia di Struttura
  {
    slug: "revenue-management-bed-breakfast",
    title: "Revenue per B&B",
    short: "Strategie dedicate ai bed & breakfast.",
    cluster: "Per Tipologia di Struttura",
  },
  {
    slug: "revenue-management-agriturismo",
    title: "Revenue per Agriturismi",
    short: "Pricing e stagionalità per il turismo rurale.",
    cluster: "Per Tipologia di Struttura",
  },
  {
    slug: "revenue-management-boutique-hotel",
    title: "Revenue per Boutique Hotel",
    short: "Valorizza l'unicità del tuo boutique hotel.",
    cluster: "Per Tipologia di Struttura",
  },
  {
    slug: "revenue-management-resort-lusso",
    title: "Revenue per Resort di Lusso",
    short: "Massimizza i ricavi del segmento luxury.",
    cluster: "Per Tipologia di Struttura",
  },
  {
    slug: "revenue-management-catene-hotel",
    title: "Revenue per Catene Hotel",
    short: "Gestione multi-proprietà e standardizzazione.",
    cluster: "Per Tipologia di Struttura",
  },

  // KPI, Analisi & Formazione
  {
    slug: "kpi-metriche-hotel",
    title: "KPI e Metriche Hotel",
    short: "Le metriche che contano per decidere.",
    cluster: "KPI, Analisi & Formazione",
  },
  {
    slug: "kpi-hotel-revenue-management",
    title: "KPI del Revenue Management",
    short: "Misura le performance con i giusti indicatori.",
    cluster: "KPI, Analisi & Formazione",
  },
  {
    slug: "ottimizzazione-revpar-hotel",
    title: "Ottimizzazione RevPAR",
    short: "Aumenta il ricavo per camera disponibile.",
    cluster: "KPI, Analisi & Formazione",
  },
  {
    slug: "forecast-budgeting-hotel",
    title: "Forecast e Budgeting",
    short: "Previsioni e budget affidabili.",
    cluster: "KPI, Analisi & Formazione",
  },
  {
    slug: "analisi-competitiva-hotel-firenze",
    title: "Analisi Competitiva (Firenze)",
    short: "Studia il comp-set e posizionati meglio.",
    cluster: "KPI, Analisi & Formazione",
  },
  {
    slug: "formazione-revenue-management-hotel",
    title: "Formazione Revenue Management",
    short: "Forma il tuo team sul revenue management.",
    cluster: "KPI, Analisi & Formazione",
  },
]

export const CLUSTER_ORDER: SolutionCluster[] = [
  "Consulenza & Strategia",
  "Software & Tecnologia",
  "Pricing & Tariffe",
  "Distribuzione & Canali",
  "Prenotazioni Dirette",
  "Per Tipologia di Struttura",
  "KPI, Analisi & Formazione",
]

export function getSolutionsByCluster(): Record<SolutionCluster, Solution[]> {
  const grouped = {} as Record<SolutionCluster, Solution[]>
  for (const c of CLUSTER_ORDER) grouped[c] = []
  for (const s of SOLUTIONS) grouped[s.cluster].push(s)
  return grouped
}

// Soluzioni correlate per una landing: prima le "sorelle" dello stesso cluster,
// poi si completa con altre soluzioni fino a `limit`.
export function getRelatedSolutions(currentSlug: string, limit = 6): Solution[] {
  const current = SOLUTIONS.find((s) => s.slug === currentSlug)
  const siblings = SOLUTIONS.filter((s) => s.slug !== currentSlug && s.cluster === current?.cluster)
  const others = SOLUTIONS.filter((s) => s.slug !== currentSlug && s.cluster !== current?.cluster)
  return [...siblings, ...others].slice(0, limit)
}
