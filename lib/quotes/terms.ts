import type { QuoteLineItem } from "./types"
import { annualSetupPromo, getCommercialMeta, getIncludedCredits, type QuoteBillingPreference } from "./commercial"

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

/**
 * Condizioni generali di 4BID S.r.l. Sono SEMPRE presenti in ogni preventivo
 * (indipendentemente dai prodotti) e congelate nello snapshot all'accettazione:
 * costituiscono la liberatoria di 4BID su malfunzionamenti, downtime da
 * aggiornamenti/manutenzione, servizi di terze parti e forza maggiore, cosi' da
 * escludere contestazioni per eventi non imputabili a 4BID. Vivono qui, accanto
 * a economicTerms, perche' la stessa lista deve finire sia a schermo sia nella
 * copia conservata dal server: la prova deve dire, parola per parola, cio' che
 * il cliente ha letto e accettato.
 */
export function generalConditions(): string[] {
  return [
    "I servizi sono forniti da 4BID S.r.l. \u00absecondo disponibilit\u00e0\u00bb. 4BID S.r.l. si impegna a garantire la massima continuit\u00e0 e affidabilit\u00e0, ma non garantisce che il funzionamento sia ininterrotto o del tutto esente da errori.",
    "Il Cliente prende atto e accetta che il servizio possa essere temporaneamente sospeso, rallentato o interrotto per attivit\u00e0 di manutenzione ordinaria o straordinaria, aggiornamenti, migrazioni, interventi di sicurezza o miglioramenti tecnici. Ove possibile tali attivit\u00e0 sono comunicate con ragionevole preavviso; quelle urgenti o legate alla sicurezza possono essere eseguite senza preavviso.",
    "4BID S.r.l. non \u00e8 responsabile per malfunzionamenti, indisponibilit\u00e0, perdita di dati, cali di prestazioni o danni, diretti o indiretti, derivanti da: (a) aggiornamenti, manutenzione o evoluzioni dei propri sistemi; (b) guasti, sospensioni, limitazioni o modifiche di servizi, API o infrastrutture di terze parti (a titolo esemplificativo: hosting, connettivit\u00e0, PMS, channel manager, gateway di pagamento, provider di messaggistica e fornitori cloud); (c) cause di forza maggiore o eventi comunque non imputabili a 4BID S.r.l., inclusi guasti di rete, attacchi informatici, interruzioni di energia elettrica ed eventi naturali; (d) uso improprio, errato o non conforme del servizio da parte del Cliente o di terzi.",
    "Le interruzioni o i disservizi riconducibili alle attivit\u00e0 e alle cause sopra indicate non danno diritto a rimborsi, indennizzi, riduzioni del canone o risoluzione anticipata del contratto.",
    "In ogni caso, ove una responsabilit\u00e0 di 4BID S.r.l. dovesse essere accertata, essa sara' limitata all'importo effettivamente corrisposto dal Cliente per il servizio interessato nei 3 (tre) mesi precedenti l'evento, restando esclusi danni indiretti, mancati guadagni e perdite di opportunita'.",
  ]
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
  const selectedById = new Map(selected.filter(item => item.id).map(item => [item.id as string, item]))
  const lines: string[] = []

  if (recurring.length) {
    lines.push(billingPreference === "yearly"
      ? "Formula annuale: i canoni dei servizi in abbonamento sono fatturati in un'unica soluzione per 12 mesi di servizio."
      : "Formula mensile: i canoni dei servizi in abbonamento sono fatturati ogni mese.")
    lines.push("Gli abbonamenti si rinnovano automaticamente alla scadenza del periodo scelto. Per disdire il rinnovo e' sufficiente disattivare il rinnovo automatico in autonomia dalla piattaforma (dalla pagina del tuo abbonamento, tramite la funzione Gestisci abbonamento); in mancanza di tale funzione e' sufficiente una comunicazione scritta, anche via email o PEC. In entrambi i casi senza penali ed entro i seguenti termini: per gli abbonamenti mensili almeno 7 giorni prima della scadenza; per gli abbonamenti annuali almeno 30 giorni prima della normale scadenza. In assenza di disdetta entro tali termini, il servizio si rinnova automaticamente per un ulteriore periodo pari a quello scelto. In ogni caso il servizio resta attivo fino al termine del periodo gia' pagato.")
    lines.push("Per i servizi in abbonamento e' richiesta una carta di credito, usata per l'attivazione e per i rinnovi automatici.")
    const trial = recurring.filter(item => Number(item.trial_days) > 0)
    for (const item of trial) lines.push(`${item.name || item.description}: periodo di prova di ${Number(item.trial_days)} giorni prima del primo addebito del canone.`)
  }

  if (oneTime.length) {
    lines.push("Le voci una tantum (setup, attivazioni e servizi manuali) sono addebitate una sola volta e non si rinnovano. Il dettaglio seguente fa parte delle condizioni economiche del preventivo.")
    for (const item of oneTime) {
      const label = item.name || item.description || "Voce una tantum"
      const meta = getCommercialMeta(item)
      const parent = meta.parent_line_id ? selectedById.get(meta.parent_line_id) : undefined
      const linkedTo = parent ? `, collegata a ${parent.name || parent.description || "servizio ricorrente"}` : ""
      const quantity = Math.max(1, Number(item.quantity) || 1)
      const quantityText = quantity > 1 ? `, quantita' ${quantity}` : ""
      const currentAmount = Math.max(0, Number(item.amount ?? item.unit_amount) || 0)
      const promo = annualSetupPromo(item)

      if (!promo) {
        lines.push(`${label}${linkedTo}${quantityText}: ${euro(currentAmount, currency)} una tantum, addebitata una sola volta e senza rinnovo.`)
        continue
      }

      if (billingPreference === "yearly") {
        lines.push(promo.mode === "free"
          ? `${label}${linkedTo}${quantityText}: in omaggio una tantum con la formula annuale (valore ${euro(promo.normalPrice, currency)}; con la formula mensile ${euro(promo.normalPrice, currency)}).`
          : `${label}${linkedTo}${quantityText}: ${euro(promo.annualPrice, currency)} una tantum con la formula annuale anziche' ${euro(promo.normalPrice, currency)}.`)
      } else {
        lines.push(promo.mode === "free"
          ? `${label}${linkedTo}${quantityText}: ${euro(currentAmount, currency)} una tantum con la formula mensile; in omaggio scegliendo la formula annuale.`
          : `${label}${linkedTo}${quantityText}: ${euro(currentAmount, currency)} una tantum con la formula mensile; ${euro(promo.annualPrice, currency)} con la formula annuale anziche' ${euro(promo.normalPrice, currency)}.`)
      }
    }
  }

  const dependent = selected.filter(item => getCommercialMeta(item).parent_line_id)
  if (dependent.length) lines.push("I servizi di attivazione e configurazione sono collegati al modulo di riferimento: senza quel modulo non vengono attivati ne' addebitati.")

  // Crediti inclusi negli addon a consumo: allowance gia' compresa nel prezzo,
  // percio' non aggiunta ai totali. La riga rende esplicito nello snapshot
  // accettato che i consumi eccedenti sono a carico del cliente.
  for (const item of selected) {
    const credits = getIncludedCredits(item)
    if (!credits) continue
    lines.push(`${item.name || item.description}: ${euro(credits.amount, currency)} di crediti a consumo inclusi, ricaricati automaticamente ${credits.recharge === "recurring" ? "ad ogni rinnovo" : "all'attivazione"} e gia' compresi nel prezzo; i consumi eccedenti sono addebitati a parte, a consumo.`)
  }

  lines.push(options.vatIncluded === false ? "Gli importi indicati sono IVA esclusa." : "Gli importi indicati sono IVA inclusa.")
  if (options.expiresAt) {
    const expiry = new Date(options.expiresAt)
    if (!Number.isNaN(expiry.getTime())) lines.push(`Le condizioni economiche di questo preventivo restano valide fino al ${expiry.toLocaleString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}.`)
  }
  return lines
}
