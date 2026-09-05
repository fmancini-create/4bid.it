import {
  PROBLEMS,
  PROBLEM_CATEGORIES,
  type Problem,
  type ProblemCategoryId,
} from "@/lib/problem-solutions"

/**
 * Slug editoriali stabili per il cluster SEO /problemi-hotel/*.
 * Non derivarli automaticamente dal testo: le label possono cambiare senza
 * modificare gli URL già indicizzati.
 */
export const PROBLEM_SLUGS: Record<string, string> = {
  prezzi: "prezzi-camere-hotel-decisi-a-intuito",
  kpi: "kpi-hotel-revpar-adr-occupazione",
  pickup: "pickup-prenotazioni-hotel",
  "forecast-domanda": "forecast-occupazione-domanda-hotel",
  "competitor-rate": "prezzi-competitor-hotel",
  "regole-vendita": "minlos-stop-sale-restrizioni-hotel",
  "eventi-domanda": "eventi-picchi-domanda-prezzi-hotel",
  "autopilot-prezzi": "automazione-prezzi-hotel-rms-autopilot",

  ota: "ridurre-commissioni-booking-expedia-ota",
  dirette: "aumentare-prenotazioni-dirette-hotel",
  "conversione-preventivi": "aumentare-conversione-preventivi-hotel",
  "lead-followup": "follow-up-lead-commerciali-hotel",
  "crm-contatti": "crm-hotel-contatti-ospiti-aziende-agenzie",
  "b2b-prospecting": "prospecting-b2b-hotel-aziende-agenzie",
  "canali-distribuzione": "mix-canali-distribuzione-hotel",
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
  budget: "budget-hotel-forecast-economico",
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
  multi: "gestione-multi-struttura-hotel",
  "pms-accesso": "integrare-pms-altri-software-hotel",
  "dati-manuali": "automazione-import-export-dati-hotel",
  "dashboard-unica": "dashboard-unica-kpi-hotel",
  "suite-login": "sso-login-unico-software-hotel",
  integrazioni: "integrazioni-api-software-hotel",
  "software-standard": "software-su-misura-hotel",
  "report-condivisione": "report-hotel-automatici-condivisibili",
}

export type ProblemSeoPlaybook = {
  impact: string
  checks: string[]
  approach: string[]
}

export const CATEGORY_PLAYBOOKS: Record<ProblemCategoryId, ProblemSeoPlaybook> = {
  "revenue-pricing": {
    impact:
      "Quando pricing e domanda vengono letti tardi o a intuito, il rischio è duplice: lasciare ricavi sul tavolo nei giorni forti e perdere occupazione nei giorni deboli. Il punto non è cambiare prezzo più spesso, ma decidere con dati coerenti e regole comprensibili.",
    checks: [
      "Confronta occupazione, ADR e RevPAR con lo stesso periodo e con il budget.",
      "Leggi pickup e lead time per capire se la domanda sta accelerando o rallentando.",
      "Controlla eventi, competitor e restrizioni senza usarli come unico segnale.",
      "Definisci soglie e regole: ogni variazione deve avere una motivazione leggibile.",
    ],
    approach: [
      "Misura il dato prima di automatizzare la decisione.",
      "Costruisci una strategia tariffaria con obiettivi, soglie e vincoli.",
      "Automatizza solo ciò che può essere monitorato e corretto rapidamente.",
    ],
  },
  "vendite-distribuzione": {
    impact:
      "Un problema commerciale raramente nasce da un solo canale: spesso si sommano dipendenza dalle OTA, follow-up discontinui, contatti dispersi e poca lettura del valore di ogni sorgente. La priorità è capire dove nasce il lead, chi lo segue e quanto rende davvero.",
    checks: [
      "Misura conversione e costo per canale, non soltanto il numero di prenotazioni.",
      "Verifica che ogni richiesta abbia proprietario, stato e prossima azione.",
      "Segmenta ospiti, aziende e agenzie invece di gestirli in un'unica lista.",
      "Confronta ricavo netto del canale diretto con quello delle OTA dopo commissioni e costi marketing.",
    ],
    approach: [
      "Centralizza contatti e opportunità in un flusso commerciale unico.",
      "Dai priorità ai lead con maggiore probabilità o valore potenziale.",
      "Collega distribuzione, preventivi e follow-up ai dati economici reali.",
    ],
  },
  "marketing-ospiti": {
    impact:
      "Quando sito, reputazione e messaggi vivono in strumenti separati, l'hotel rischia di spendere per farsi trovare e poi perdere la conversione nella fase di risposta o follow-up. Marketing e assistenza devono condividere contatti, storico e priorità.",
    checks: [
      "Verifica da quali ricerche e campagne arrivano davvero richieste e prenotazioni.",
      "Misura tempi di risposta e richieste perse tra email, WhatsApp, social e telefono.",
      "Controlla qualità e frequenza delle comunicazioni pre, durante e post soggiorno.",
      "Usa il database ospiti con segmenti e consensi, non come semplice rubrica.",
    ],
    approach: [
      "Riduci i passaggi tra canali e persone con una vista condivisa del cliente.",
      "Automatizza le risposte ripetitive mantenendo escalation e controllo umano.",
      "Collega visibilità, reputazione e retention a metriche di conversione.",
    ],
  },
  "controllo-finanza": {
    impact:
      "Fatturato e occupazione non bastano a dire se la struttura sta guadagnando. Se documenti, centri di costo, scadenze e budget sono frammentati, le decisioni arrivano quando il costo è già stato sostenuto invece che quando può ancora essere corretto.",
    checks: [
      "Separa ricavi e costi per reparto o centro di responsabilità.",
      "Riconcilia fatture, pagamenti e scadenze con una classificazione coerente.",
      "Confronta actual, budget e forecast con la stessa struttura di conti.",
      "Evidenzia scostamenti e fornitori anomali prima della chiusura del mese.",
    ],
    approach: [
      "Porta i documenti in un flusso unico e riduci la classificazione manuale.",
      "Costruisci un modello di controllo leggibile anche da chi non fa contabilità.",
      "Trasforma gli scostamenti in azioni, responsabili e priorità.",
    ],
  },
  "operativita-staff": {
    impact:
      "Le attività operative diventano costose quando dipendono dalla memoria, dalle chat personali o dalle telefonate. Il problema non è soltanto perdere un task: è perdere storico, responsabilità, tempi di intervento e capacità di prevenire il problema successivo.",
    checks: [
      "Verifica quali attività vengono ancora assegnate a voce o in chat non tracciate.",
      "Distingui urgenze, manutenzioni programmate e controlli ricorrenti.",
      "Collega attività, asset, camera o reparto a uno storico consultabile.",
      "Misura chi prende in carico, quanto impiega e dove si ripetono gli stessi problemi.",
    ],
    approach: [
      "Trasforma segnalazioni e controlli in task con responsabilità e scadenza.",
      "Usa QR, asset e procedure per dare contesto immediato a chi interviene.",
      "Porta housekeeping, manutenzione e staff su flussi semplici da usare anche da mobile.",
    ],
  },
  "tecnologia-dati": {
    impact:
      "Ogni software scollegato aggiunge login, esportazioni, file Excel e possibilità di errore. L'obiettivo non è avere un unico software a tutti i costi, ma far circolare identità e dati tra i sistemi giusti senza duplicazioni inutili.",
    checks: [
      "Mappa dove lo stesso dato viene digitato o importato più di una volta.",
      "Individua quale sistema è la fonte ufficiale per clienti, prenotazioni, costi e task.",
      "Verifica API, webhook e possibilità di integrazione prima di sostituire un software esistente.",
      "Controlla ruoli, accessi e isolamento dati quando ci sono più strutture o società.",
    ],
    approach: [
      "Definisci prima il processo e poi il contratto dati tra i sistemi.",
      "Integra ciò che funziona già invece di ricostruirlo senza motivo.",
      "Automatizza sincronizzazioni e report mantenendo log, recovery e responsabilità chiare.",
    ],
  },
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
  const short = problem.short.charAt(0).toUpperCase() + problem.short.slice(1)
  return `${short}: cosa fare in hotel | 4BID.IT`
}

export function getProblemDescription(problem: Problem): string {
  const category = getProblemCategory(problem)
  return `Hai ${problem.short.toLowerCase()}? Scopri cosa controllare, come intervenire e quali soluzioni 4BID possono aiutare la struttura nell'area ${category?.label ?? "gestione hotel"}.`
}
