import type { QuoteLineItem } from "./types"
import { annualSetupPromo, getCommercialMeta, type QuoteBillingPreference } from "./commercial"

/**
 * Condizioni contrattuali: la fonte e' il singolo progetto, esattamente come per
 * moduli e listini. Ogni progetto pubblica le proprie condizioni e il preventivo
 * ne conserva una copia (snapshot), cosi' il cliente legge cio' che accetta e
 * una modifica successiva alla pagina del progetto non riscrive il passato.
 */
export const PROJECT_TERMS_SOURCES = {
  hotelaccelerator: { label: "HotelAccelerator", url: "https://www.hotelaccelerator.com/terms" },
  santaddeo: { label: "Santaddeo", url: "https://www.santaddeo.com/termini" },
  hotelprofitai: { label: "HotelProfitAI", url: "https://www.hotelprofitai.com/termini" },
  manubot: { label: "ManuBot", url: "https://www.manubot.it/termini" },
  "4bid": { label: "4BID (servizi e consulenze)", url: "https://www.4bid.it/terms" },
} as const

export type TermsProject = keyof typeof PROJECT_TERMS_SOURCES

/**
 * Voci fuori dai progetti SaaS (consulenze, sviluppi su misura, voci manuali)
 * ricadono qui. Senza questa fonte le loro condizioni sarebbero SCARTATE in
 * silenzio: verificato su dati reali, 11 voci su preventivi esistenti hanno
 * project "custom", "consulenza" o nessun progetto. Non e' un caso di
 * confine: e' la maggioranza delle voci scritte a mano.
 */
export const BASE_TERMS_PROJECT = "4bid" as const

export type TermsBlock = { type: "heading" | "paragraph" | "item"; text: string }

export interface ProjectTermsSnapshot {
  project: TermsProject
  label: string
  url: string
  title: string
  version: string | null
  blocks: TermsBlock[]
  text: string
  characters: number
  hash: string
  fetched_at: string
}

/** Fallimento conservato: un buco va mostrato, non nascosto dietro una sezione vuota. */
export interface ProjectTermsFailure {
  project: TermsProject
  label: string
  url: string
  error: string
  fetched_at: string
}

export interface QuoteContractTerms {
  version: 1
  generated_at: string
  projects: ProjectTermsSnapshot[]
  failures: ProjectTermsFailure[]
}

export function isTermsProject(value: unknown): value is TermsProject {
  return typeof value === "string" && value in PROJECT_TERMS_SOURCES
}

export function termsLabel(project: TermsProject) { return PROJECT_TERMS_SOURCES[project].label }

/**
 * Progetti di cui servono le condizioni: quelli realmente presenti nel
 * preventivo, piu' le condizioni base 4BID se anche UNA sola voce non
 * appartiene a un progetto SaaS. Una voce senza condizioni non deve poter
 * passare inosservata: e' il caso piu' comune (consulenze e voci scritte a
 * mano), non l'eccezione.
 */
export function quoteTermsProjects(items: QuoteLineItem[] | null | undefined): TermsProject[] {
  const found: TermsProject[] = []
  let needsBase = false
  for (const item of items || []) {
    if (!item) continue
    // "consulting", "custom", un progetto sconosciuto o l'assenza di progetto
    // ricadono tutti sulle condizioni base 4BID.
    const project: string | undefined = item.project
    if (isTermsProject(project) && project !== BASE_TERMS_PROJECT) {
      if (!found.includes(project)) found.push(project)
    } else {
      needsBase = true
    }
  }
  if (needsBase && !found.includes(BASE_TERMS_PROJECT)) found.push(BASE_TERMS_PROJECT)
  return found
}

export function parseContractTerms(value: unknown): QuoteContractTerms | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Partial<QuoteContractTerms>
  if (!Array.isArray(raw.projects)) return null
  return {
    version: 1,
    generated_at: typeof raw.generated_at === "string" ? raw.generated_at : new Date().toISOString(),
    projects: raw.projects.filter(entry => entry && isTermsProject(entry.project) && Array.isArray(entry.blocks)),
    failures: Array.isArray(raw.failures) ? raw.failures.filter(entry => entry && isTermsProject(entry.project)) : [],
  }
}

/**
 * Se il sito di un progetto non risponde, si conserva la copia gia' presente sul
 * preventivo invece di perderla: un guasto di rete non deve svuotare le
 * condizioni che il cliente sta per accettare.
 */
export function mergeContractTerms(previous: QuoteContractTerms | null, fresh: QuoteContractTerms): QuoteContractTerms {
  const projects: ProjectTermsSnapshot[] = [...fresh.projects]
  const failures: ProjectTermsFailure[] = []
  for (const failure of fresh.failures) {
    const kept = previous?.projects.find(entry => entry.project === failure.project)
    if (kept) projects.push(kept)
    else failures.push(failure)
  }
  return { version: 1, generated_at: fresh.generated_at, projects, failures }
}

/**
 * Testo della dichiarazione di accettazione: cita solo le condizioni realmente
 * mostrate. Vive qui, e non nel componente, perche' la stessa frase deve finire
 * anche nella copia conservata dal server: la prova deve dire cio' che il
 * cliente ha letto, parola per parola.
 */
export function acceptanceDeclaration(terms: QuoteContractTerms | null): string {
  const nomi = (terms?.projects || []).map(entry => entry.version ? `${entry.label} (aggiornate al ${entry.version})` : entry.label)
  const base = "Confermo di aver letto e accettato il preventivo, la durata selezionata, il rinnovo automatico e le condizioni economiche riportate qui sopra"
  if (!nomi.length) return `${base}.`
  const elenco = nomi.length === 1 ? nomi[0] : `${nomi.slice(0, -1).join(", ")} e ${nomi[nomi.length - 1]}`
  return `${base}, insieme alle condizioni contrattuali di ${elenco}, riportate per esteso in questa pagina.`
}

/** Progetti inclusi nel preventivo per i quali non esiste alcuna copia delle condizioni. */
export function missingTermsProjects(items: QuoteLineItem[], terms: QuoteContractTerms | null): TermsProject[] {
  return quoteTermsProjects(items).filter(project => !terms?.projects.some(entry => entry.project === project))
}

const euro = (value: number, currency: string) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: (currency || "eur").toUpperCase() }).format(Number(value) || 0)

/**
 * Condizioni economiche del preventivo, ricavate dalla selezione reale.
 * Descrivono cio' che il server fa davvero all'accettazione: la casella di
 * conferma cita "durata, rinnovo automatico e condizioni economiche" e queste
 * sono le frasi che le rendono verificabili.
 */
export function economicTerms(
  items: QuoteLineItem[],
  billingPreference: QuoteBillingPreference,
  currency: string,
  options: { expiresAt?: string | null; vatIncluded?: boolean } = {},
): string[] {
  const selected = items.filter(item => item.customer_selected !== false)
  const recurring = selected.filter(item => item.billing_period && item.billing_period !== "one_time")
  const oneTime = selected.filter(item => item.billing_period === "one_time")
  const lines: string[] = []

  if (recurring.length) {
    lines.push(billingPreference === "yearly"
      ? "Formula annuale: i canoni dei servizi in abbonamento sono fatturati in un'unica soluzione per 12 mesi di servizio."
      : "Formula mensile: i canoni dei servizi in abbonamento sono fatturati ogni mese.")
    lines.push("Gli abbonamenti si rinnovano automaticamente alla scadenza del periodo scelto. Puoi disdire il rinnovo prima della scadenza del periodo in corso, senza penali: il servizio resta attivo fino al termine del periodo gia' pagato.")
    lines.push("Per i servizi in abbonamento e' richiesta una carta di credito, usata per l'attivazione e per i rinnovi automatici.")
    const trial = recurring.filter(item => Number(item.trial_days) > 0)
    for (const item of trial) lines.push(`${item.name || item.description}: periodo di prova di ${Number(item.trial_days)} giorni prima del primo addebito del canone.`)
  }

  if (oneTime.length) {
    lines.push("Le voci una tantum (setup, attivazioni e servizi manuali) sono addebitate una sola volta e non si rinnovano.")
    for (const item of oneTime) {
      const promo = annualSetupPromo(item)
      if (!promo) continue
      lines.push(promo.mode === "free"
        ? `${item.name || item.description}: in omaggio con la formula annuale (${euro(promo.normalPrice, currency)} con la formula mensile).`
        : `${item.name || item.description}: ${euro(promo.annualPrice, currency)} con la formula annuale anziche' ${euro(promo.normalPrice, currency)}.`)
    }
  }

  const dependent = selected.filter(item => getCommercialMeta(item).parent_line_id)
  if (dependent.length) lines.push("I servizi di attivazione e configurazione sono collegati al modulo di riferimento: senza quel modulo non vengono attivati ne' addebitati.")

  lines.push(options.vatIncluded === false ? "Gli importi indicati sono IVA esclusa." : "Gli importi indicati sono IVA inclusa.")
  if (options.expiresAt) {
    const expiry = new Date(options.expiresAt)
    if (!Number.isNaN(expiry.getTime())) lines.push(`Le condizioni economiche di questo preventivo restano valide fino al ${expiry.toLocaleString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}.`)
  }
  return lines
}
