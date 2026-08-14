// Fonte dati UNICA della mappa "problema della struttura -> soluzione 4BID".
// Usata da:
//  - components/problem-solution-finder.tsx (selettore interattivo, client)
//  - app/problemi-hotel-soluzioni/page.tsx (pagina dedicata: elenco statico
//    reso lato server, quindi leggibile dai motori di ricerca senza JS)
// Tenere qui i testi: duplicarli nella pagina significherebbe farli divergere.

export type SolutionKind = "piattaforma" | "consulenza" | "su-misura"

export type Solution = {
  id: string
  name: string
  kind: SolutionKind
  claim: string
  /** Pagina interna 4BID (link interno: conta per la SEO) */
  href: string
  /** Sito del prodotto, quando esiste (esterno) */
  externalUrl?: string
}

export type Problem = {
  id: string
  label: string
  /** Motivo mostrato nella scheda soluzione: "Risponde a: ..." */
  short: string
  /** id delle soluzioni che risolvono questo problema */
  solutions: string[]
}

export const KIND_LABEL: Record<SolutionKind, string> = {
  piattaforma: "Piattaforma",
  consulenza: "Consulenza",
  "su-misura": "Su misura",
}

export const KIND_STYLE: Record<SolutionKind, string> = {
  piattaforma: "bg-[#5B9BD5]/10 text-[#3A7AB2]",
  consulenza: "bg-[#F4B942]/15 text-[#946A00]",
  "su-misura": "bg-emerald-100 text-emerald-700",
}

export const SOLUTIONS: Solution[] = [
  {
    id: "santaddeo",
    name: "SANTADDEO",
    kind: "piattaforma",
    claim:
      "Revenue management intelligente che decide i prezzi giorno per giorno e ti spiega sempre il perché.",
    href: "/progetti/santaddeo",
    externalUrl: "https://santaddeo.com",
  },
  {
    id: "hotelprofit-ai",
    name: "HOTELPROFIT AI",
    kind: "piattaforma",
    claim:
      "Controllo di gestione, costi, margini e cassa in tempo reale, con commercialisti specializzati a supporto.",
    href: "/progetti/hotelprofit-ai",
    externalUrl: "https://hotelprofitai.com",
  },
  {
    id: "hotel-accelerator",
    name: "HOTEL ACCELERATOR",
    kind: "piattaforma",
    claim:
      "Sito, CRM, email marketing e inbox omnicanale in un unico gestionale per far crescere le prenotazioni dirette.",
    href: "/progetti/hotel-accelerator",
  },
  {
    id: "manubot",
    name: "MANUBOT",
    kind: "piattaforma",
    claim:
      "Manutenzioni, guasti e comunicazioni allo staff via WhatsApp e Telegram: nulla si perde più a voce.",
    href: "/progetti/manubot",
    externalUrl: "https://www.manubot.it",
  },
  {
    id: "ecomobility",
    name: "4BID ECOMOBILITY",
    kind: "piattaforma",
    claim:
      "Noleggio di e-bike, scooter e monopattini in struttura: un servizio in più per gli ospiti e un ricavo extra per te.",
    href: "/ecomobility/noleggio-mobilita-elettrica-hotel",
  },
  {
    id: "consulenza-revenue",
    name: "Consulenza di revenue management",
    kind: "consulenza",
    claim:
      "Un revenue manager al tuo fianco per strategia tariffaria, distribuzione e obiettivi di fatturato.",
    href: "/consulenza-revenue-management-hotel",
  },
  {
    id: "distribuzione",
    name: "Ottimizzazione OTA e canali",
    kind: "consulenza",
    claim:
      "Riequilibriamo il mix distributivo per ridurre commissioni e dipendenza dai portali.",
    href: "/ottimizzazione-ota-hotel",
  },
  {
    id: "dirette",
    name: "Strategie di vendita diretta",
    kind: "consulenza",
    claim:
      "Booking engine, offerte e percorsi di prenotazione pensati per vendere dal tuo sito.",
    href: "/strategie-prenotazioni-dirette-hotel",
  },
  {
    id: "webmarketing",
    name: "Web marketing per hotel",
    kind: "consulenza",
    claim:
      "Immagine online, contenuti e campagne per farti trovare e scegliere prima dei concorrenti.",
    href: "/webmarketing-hotel-prenotazioni",
  },
  {
    id: "forecast",
    name: "Forecast e budgeting",
    kind: "consulenza",
    claim:
      "Costruiamo budget e previsioni affidabili per pianificare stagioni, prezzi e investimenti.",
    href: "/forecast-budgeting-hotel",
  },
  {
    id: "formazione",
    name: "Formazione del tuo team",
    kind: "consulenza",
    claim:
      "Percorsi pratici di revenue management per rendere autonomo il personale della struttura.",
    href: "/formazione-revenue-management-hotel",
  },
  {
    id: "consulenza-personalizzata",
    name: "Consulenza personalizzata",
    kind: "consulenza",
    claim:
      "Analizziamo la tua struttura e mettiamo in fila le priorità, anche su temi organizzativi e di personale.",
    href: "/consulenza-personalizzata-hotel",
  },
  {
    id: "catene",
    name: "Gestione multi-struttura",
    kind: "consulenza",
    claim:
      "Metodo e strumenti per governare più strutture o un gruppo con dati confrontabili.",
    href: "/revenue-management-catene-hotel",
  },
  {
    id: "su-misura",
    name: "Progetto su misura",
    kind: "su-misura",
    claim:
      "Quando i software standard non bastano, sviluppiamo la soluzione che ti serve e la integriamo con i tuoi sistemi.",
    href: "/preventivi-progetti-personalizzati-hotel",
  },
]

export const PROBLEMS: Problem[] = [
  {
    id: "prezzi",
    label: "Non so a che prezzo vendere le camere: decido a intuito",
    short: "prezzi decisi a intuito",
    solutions: ["santaddeo", "consulenza-revenue"],
  },
  {
    id: "ota",
    label: "Dipendo troppo dalle OTA e pago troppe commissioni",
    short: "troppa dipendenza dalle OTA",
    solutions: ["distribuzione", "hotel-accelerator", "consulenza-revenue"],
  },
  {
    id: "dirette",
    label: "Ricevo poche prenotazioni dirette dal mio sito",
    short: "poche prenotazioni dirette",
    solutions: ["hotel-accelerator", "dirette", "webmarketing"],
  },
  {
    id: "margini",
    label: "Fatturo ma non so quanto guadagno davvero: costi e margini poco chiari",
    short: "margini non chiari",
    solutions: ["hotelprofit-ai", "consulenza-personalizzata"],
  },
  {
    id: "cassa",
    label: "Non ho visibilità su cassa, scadenze e pagamenti futuri",
    short: "cassa e scadenze senza visibilità",
    solutions: ["hotelprofit-ai", "forecast"],
  },
  {
    id: "kpi",
    label: "Non riesco a leggere i miei KPI (RevPAR, ADR, occupazione)",
    short: "KPI non misurati",
    solutions: ["santaddeo", "hotelprofit-ai", "consulenza-revenue"],
  },
  {
    id: "budget",
    label: "Non riesco a pianificare l'anno: budget e previsioni sempre approssimativi",
    short: "budget approssimativo",
    solutions: ["forecast", "hotelprofit-ai"],
  },
  {
    id: "manutenzioni",
    label: "Guasti e manutenzioni segnalati a voce: richieste che si perdono",
    short: "manutenzioni gestite a voce",
    solutions: ["manubot"],
  },
  {
    id: "staff-comunicazione",
    label: "La comunicazione con lo staff è caotica: nessuno sa chi fa cosa",
    short: "comunicazione con lo staff caotica",
    solutions: ["manubot", "hotel-accelerator"],
  },
  {
    id: "richieste-ospiti",
    label: "Richieste degli ospiti sparse tra mail, WhatsApp e telefono",
    short: "richieste ospiti sparse su troppi canali",
    solutions: ["hotel-accelerator", "manubot"],
  },
  {
    id: "reputazione",
    label: "Recensioni e reputazione online da migliorare",
    short: "reputazione online da migliorare",
    solutions: ["hotel-accelerator", "webmarketing"],
  },
  {
    id: "immagine",
    label: "Sito e immagine online datati rispetto ai concorrenti",
    short: "immagine online datata",
    solutions: ["webmarketing", "hotel-accelerator"],
  },
  {
    id: "formazione",
    label: "Il mio team non è autonomo: servirebbe formazione",
    short: "team non autonomo",
    solutions: ["formazione", "consulenza-revenue"],
  },
  {
    id: "personale",
    label: "Faccio fatica a trovare e trattenere personale qualificato",
    short: "difficoltà a trovare personale",
    solutions: ["consulenza-personalizzata"],
  },
  {
    id: "extra",
    label: "Vorrei offrire servizi extra agli ospiti e creare nuovi ricavi",
    short: "nuovi ricavi dai servizi extra",
    solutions: ["ecomobility", "consulenza-personalizzata"],
  },
  {
    id: "multi",
    label: "Gestisco più strutture e non riesco a confrontare i dati",
    short: "più strutture da confrontare",
    solutions: ["catene", "hotelprofit-ai", "santaddeo"],
  },
  {
    id: "strumenti",
    label: "Uso troppi strumenti scollegati e ricopio i dati a mano",
    short: "strumenti scollegati",
    solutions: ["hotel-accelerator", "su-misura"],
  },
  {
    id: "software-standard",
    label: "I software standard non coprono il mio caso: mi serve qualcosa di mio",
    short: "serve una soluzione dedicata",
    solutions: ["su-misura", "consulenza-personalizzata"],
  },
]

/** Soluzioni che risolvono un problema, nell'ordine stabile di SOLUTIONS. */
export function getSolutionsForProblem(problem: Problem): Solution[] {
  return SOLUTIONS.filter((s) => problem.solutions.includes(s.id))
}

/** Problemi risolti da una soluzione, nell'ordine stabile di PROBLEMS. */
export function getProblemsForSolution(solutionId: string): Problem[] {
  return PROBLEMS.filter((p) => p.solutions.includes(solutionId))
}
