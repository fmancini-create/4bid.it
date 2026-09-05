import { PROBLEMS, PROBLEM_CATEGORIES, type Problem } from "@/lib/problem-solutions"
import { PROBLEM_SEO_CONTENT, type ProblemSeoContent } from "@/lib/problem-seo-content"

/**
 * Slug editoriali stabili per il cluster SEO /problemi-hotel/*.
 * I casi che collidevano con landing commerciali preesistenti usano un intento
 * diagnostico esplicito ("perche'", "dipendenza", "poco affidabile", ecc.).
 */
export const PROBLEM_SLUGS: Record<string, string> = {
  prezzi: "prezzi-camere-hotel-decisi-a-intuito",
  kpi: "non-capisco-kpi-hotel-revpar-adr",
  pickup: "pickup-prenotazioni-hotel",
  "forecast-domanda": "prevedere-occupazione-domanda-hotel",
  "competitor-rate": "prezzi-competitor-hotel",
  "regole-vendita": "minlos-stop-sale-restrizioni-hotel",
  "eventi-domanda": "eventi-picchi-domanda-prezzi-hotel",
  "autopilot-prezzi": "automazione-prezzi-hotel-rms-autopilot",

  ota: "dipendenza-booking-expedia-commissioni-hotel",
  dirette: "perche-poche-prenotazioni-dirette-hotel",
  "conversione-preventivi": "aumentare-conversione-preventivi-hotel",
  "lead-followup": "follow-up-lead-commerciali-hotel",
  "crm-contatti": "crm-hotel-contatti-ospiti-aziende-agenzie",
  "b2b-prospecting": "prospecting-b2b-hotel-aziende-agenzie",
  "canali-distribuzione": "quali-canali-vendita-rendono-hotel",
  extra: "ricavi-extra-hotel-upselling-servizi",

  "richieste-ospiti": "inbox-omnicanale-hotel-email-whatsapp",
  "caselle-email": "gestire-piu-caselle-email-hotel",
  "risposte-ripetitive": "automatizzare-risposte-ospiti-hotel-ai",
  reputazione: "recensioni-reputazione-online-hotel",
  immagine: "sito-hotel-datato-restyling",
  "seo-visibilita": "seo-hotel-visibilita-google",
  "email-marketing": "email-marketing-hotel-database-ospiti",
  "social-marketing": "social-media-marketing-hotel",

  margini: "margini-hotel-calcolare-redditivita",
  cassa: "cash-flow-hotel-incassi-pagamenti",
  budget: "budget-hotel-poco-affidabile-scostamenti",
  "fatture-import": "importare-fatture-hotel-automaticamente",
  "classificazione-spese": "classificare-spese-fatture-hotel",
  "centri-costo": "centri-di-costo-hotel-redditivita-reparti",
  scadenziario: "scadenziario-fornitori-pagamenti-hotel",
  "bilancio-piano-conti": "bilancio-piano-dei-conti-hotel",
  acquisti: "controllo-acquisti-costi-hotel",

  manutenzioni: "gestione-manutenzioni-guasti-hotel",
  "manutenzione-programmata": "manutenzione-preventiva-programmata-hotel",
  "asset-qr": "gestione-asset-qr-code-hotel",
  "fornitori-preventivi": "fornitori-preventivi-manutenzione-hotel",
  compliance: "scadenze-compliance-manutenzione-hotel",
  housekeeping: "gestione-housekeeping-hotel",
  biancheria: "gestione-biancheria-lavanderia-hotel",
  "minibar-roomcheck": "controllo-camera-minibar-hotel",
  "staff-comunicazione": "comunicazione-task-staff-hotel",
  "turni-presenze": "turni-presenze-timbrature-personale-hotel",
  personale: "organizzazione-personale-hotel",
  formazione: "formazione-team-hotel-revenue-processi",

  strumenti: "software-hotel-scollegati-dati-duplicati",
  multi: "dati-processi-piu-strutture-hotel",
  "pms-accesso": "integrare-pms-altri-software-hotel",
  "dati-manuali": "automazione-import-export-dati-hotel",
  "dashboard-unica": "dashboard-unica-kpi-hotel",
  "suite-login": "sso-login-unico-software-hotel",
  integrazioni: "integrazioni-api-software-hotel",
  "software-standard": "software-hotel-non-adatto-al-processo",
  "report-condivisione": "report-hotel-automatici-condivisibili",
}

/** Title brevi e specifici: evitano title da 70-90 caratteri generati dai testi lunghi. */
export const PROBLEM_SEO_TITLES: Record<string, string> = {
  prezzi: "Prezzi camere hotel decisi a intuito",
  kpi: "KPI hotel: RevPAR, ADR e occupazione poco chiari",
  pickup: "Pickup prenotazioni hotel non monitorato",
  "forecast-domanda": "Prevedere occupazione e domanda hotel",
  "competitor-rate": "Prezzi competitor hotel: come interpretarli",
  "regole-vendita": "MinLOS e stop sale hotel senza metodo",
  "eventi-domanda": "Eventi e picchi di domanda hotel scoperti tardi",
  "autopilot-prezzi": "Automazione prezzi hotel con controllo",

  ota: "Troppa dipendenza da Booking, Expedia e OTA",
  dirette: "Poche prenotazioni dirette dal sito hotel",
  "conversione-preventivi": "Preventivi hotel che convertono poco",
  "lead-followup": "Follow-up commerciali hotel non organizzati",
  "crm-contatti": "CRM hotel: contatti sparsi e duplicati",
  "b2b-prospecting": "Prospecting B2B hotel da strutturare",
  "canali-distribuzione": "Quali canali di vendita rendono davvero in hotel",
  extra: "Ricavi extra hotel e upselling poco sviluppati",

  "richieste-ospiti": "Richieste ospiti sparse tra troppi canali",
  "caselle-email": "Piu' caselle email hotel difficili da coordinare",
  "risposte-ripetitive": "Risposte ripetitive agli ospiti: come ridurle",
  reputazione: "Reputazione online hotel da migliorare",
  immagine: "Sito e immagine online hotel datati",
  "seo-visibilita": "SEO hotel: visibilita' Google insufficiente",
  "email-marketing": "Database ospiti hotel poco sfruttato",
  "social-marketing": "Social hotel senza una strategia coerente",

  margini: "Margini hotel poco chiari",
  cassa: "Cash flow hotel senza visibilita'",
  budget: "Budget hotel approssimativo",
  "fatture-import": "Import fatture hotel troppo manuale",
  "classificazione-spese": "Classificazione spese hotel manuale",
  "centri-costo": "Redditivita' per reparto hotel non misurata",
  scadenziario: "Scadenziario fornitori hotel frammentato",
  "bilancio-piano-conti": "Bilancio e gestione hotel non riconciliati",
  acquisti: "Acquisti e costi hotel anomali poco visibili",

  manutenzioni: "Manutenzioni hotel gestite a voce",
  "manutenzione-programmata": "Manutenzione preventiva hotel non strutturata",
  "asset-qr": "Asset hotel e storico manutenzioni non tracciati",
  "fornitori-preventivi": "Fornitori e preventivi tecnici hotel da coordinare",
  compliance: "Compliance e scadenze tecniche hotel",
  housekeeping: "Housekeeping hotel difficile da coordinare",
  biancheria: "Biancheria e lavanderia hotel poco controllate",
  "minibar-roomcheck": "Room check e minibar hotel gestiti a mano",
  "staff-comunicazione": "Comunicazione staff hotel caotica",
  "turni-presenze": "Turni e presenze hotel troppo manuali",
  personale: "Organizzazione e ricerca personale hotel",
  formazione: "Team hotel poco autonomo su dati e processi",

  strumenti: "Software hotel scollegati e dati duplicati",
  multi: "Piu' strutture hotel difficili da confrontare",
  "pms-accesso": "PMS e altri strumenti hotel separati",
  "dati-manuali": "Aggiornamento dati hotel troppo manuale",
  "dashboard-unica": "Troppe dashboard separate per gestire l'hotel",
  "suite-login": "Login e utenti duplicati tra software hotel",
  integrazioni: "Integrazioni tra software hotel mancanti",
  "software-standard": "Software standard non adatto al processo hotel",
  "report-condivisione": "Report gestionali hotel ricostruiti a mano",
}

const FALLBACK_CONTENT: ProblemSeoContent = {
  intro: "Questa criticita' va misurata nel processo reale della struttura prima di scegliere una soluzione.",
  impact: "Senza una diagnosi condivisa si rischia di aggiungere strumenti senza eliminare la causa del problema.",
  checks: [
    "Individua dove nasce il problema e chi lo incontra nel lavoro quotidiano.",
    "Misura frequenza, impatto e dati disponibili prima di modificare il processo.",
    "Verifica quali sistemi e persone sono coinvolti e quale fonte dati e' autorevole.",
  ],
  approach: [
    "Definisci il risultato atteso con una metrica verificabile.",
    "Correggi prima il processo e integra gli strumenti che funzionano gia'.",
    "Automatizza soltanto quando errori ed eccezioni possono essere monitorati.",
  ],
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  const slice = value.slice(0, maxLength - 1)
  const lastSpace = slice.lastIndexOf(" ")
  return `${slice.slice(0, Math.max(lastSpace, maxLength - 18)).trimEnd()}…`
}

export function getProblemSlug(problem: Problem): string {
  return PROBLEM_SLUGS[problem.id] ?? problem.id
}

export function getProblemBySlug(slug: string): Problem | undefined {
  return PROBLEMS.find((problem) => getProblemSlug(problem) === slug)
}

export function getProblemCategory(problem: Problem) {
  return PROBLEM_CATEGORIES.find((category) => category.id === problem.category)
}

export function getProblemSeoContent(problem: Problem): ProblemSeoContent {
  return PROBLEM_SEO_CONTENT[problem.id] ?? FALLBACK_CONTENT
}

export function getRelatedProblems(problem: Problem, limit = 6): Problem[] {
  const sameCategory = PROBLEMS.filter(
    (candidate) => candidate.id !== problem.id && candidate.category === problem.category,
  )
  const sharedSolutions = PROBLEMS.filter(
    (candidate) =>
      candidate.id !== problem.id &&
      candidate.category !== problem.category &&
      candidate.solutions.some((solutionId) => problem.solutions.includes(solutionId)),
  )

  return [...sameCategory, ...sharedSolutions]
    .filter((candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index)
    .slice(0, limit)
}

export function getProblemCanonical(problem: Problem): string {
  return `https://www.4bid.it/problemi-hotel/${getProblemSlug(problem)}`
}

export function getProblemTitle(problem: Problem): string {
  const base = PROBLEM_SEO_TITLES[problem.id] ?? problem.short
  return `${base} | 4BID.IT`
}

export function getProblemDescription(problem: Problem): string {
  return truncateAtWord(getProblemSeoContent(problem).intro, 158)
}
