/**
 * Lettura dei dati di un'azienda italiana da OpenAPI.it (prodotto "Company").
 *
 * ATTENZIONE — OGNI CHIAMATA COSTA. `IT-start` e' tariffato 0,05 EUR a
 * richiesta sul nostro conto OpenAPI. Per questo:
 * - la rotta che usa questo modulo richiede una sessione (nessuno da fuori
 *   deve poter spendere il nostro credito);
 * - una partita IVA formalmente sbagliata viene fermata PRIMA della chiamata,
 *   perche' pagheremmo per sentirci dire che non esiste;
 * - i risultati vengono messi in memoria per non ripagare lo stesso dato.
 */

const BASE_URL = process.env.OPENAPI_COMPANY_BASE_URL || "https://company.openapi.com"

export type CompanyLookupReason =
  | "token_assente"
  | "token_non_valido"
  | "permessi_mancanti"
  | "credito_fornitore_esaurito"
  | "non_trovata"
  | "identificativo_non_valido"
  | "fornitore_non_raggiungibile"

export interface CompanyLookupData {
  denominazione: string | null
  partitaIva: string | null
  codiceFiscale: string | null
  indirizzo: string | null
  cap: string | null
  citta: string | null
  provincia: string | null
  regione: string | null
  statoAttivita: string | null
  formaGiuridica: string | null
  ateco: string | null
  atecoDescrizione: string | null
  rea: string | null
  cciaa: string | null
  dataIscrizione: string | null
  pec: string | null
  codiceSdi: string | null
  /** Vero se l'azienda non risulta piu' attiva: va mostrato, non nascosto. */
  cessata: boolean
}

export type CompanyLookupResult =
  | { ok: true; data: CompanyLookupData; fromCache: boolean }
  | { ok: false; reason: CompanyLookupReason; message: string }

/**
 * Controllo formale della partita IVA italiana (11 cifre con cifra di
 * controllo) o del codice fiscale (16 caratteri).
 *
 * Non dice se l'azienda esiste: dice solo che vale la pena pagare per chiederlo.
 */
export function normalizeCompanyId(input: string): { id: string; kind: "piva" | "cf" } | null {
  const pulito = (input || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^IT/, "")

  if (/^\d{11}$/.test(pulito)) {
    let somma = 0
    for (let i = 0; i < 11; i++) {
      let cifra = Number(pulito[i])
      if (i % 2 === 1) {
        cifra *= 2
        if (cifra > 9) cifra -= 9
      }
      somma += cifra
    }
    return somma % 10 === 0 ? { id: pulito, kind: "piva" } : null
  }

  if (/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(pulito)) {
    return { id: pulito, kind: "cf" }
  }

  return null
}

function testo(...candidati: unknown[]): string | null {
  for (const c of candidati) {
    if (typeof c === "string" && c.trim()) return c.trim()
    if (typeof c === "number" && Number.isFinite(c)) return String(c)
  }
  return null
}

function oggetto(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

/**
 * Mappa la risposta del fornitore.
 *
 * I nomi dei campi cambiano fra gli endpoint (`IT-start`, `IT-advanced`,
 * `IT-full`), quindi ogni valore si cerca su piu' nomi possibili: leggerne uno
 * solo darebbe un campo vuoto senza alcun errore, cioe' il difetto piu'
 * difficile da vedere.
 */
function mapCompany(raw: Record<string, any>): CompanyLookupData {
  const indirizzoRaw = oggetto(raw.address)
  const sede = oggetto(indirizzoRaw.registeredOffice) 
  const via = testo(
    sede.streetName,
    sede.street,
    [testo(sede.toponym), testo(sede.street, sede.streetName), testo(sede.streetNumber)].filter(Boolean).join(" "),
    indirizzoRaw.streetName,
    raw.address,
  )

  const ateco = oggetto(oggetto(raw.atecoClassification).ateco)
  const stato = testo(raw.activityStatus, raw.status)

  return {
    denominazione: testo(raw.companyName, raw.denomination, raw.name),
    partitaIva: testo(raw.vatCode, raw.vat, raw.piva),
    codiceFiscale: testo(raw.taxCode, raw.fiscalCode, raw.cf),
    indirizzo: via,
    cap: testo(sede.zipCode, sede.cap, indirizzoRaw.zipCode),
    citta: testo(sede.town, sede.city, indirizzoRaw.town),
    provincia: testo(sede.province, sede.provinceCode, indirizzoRaw.province),
    regione: testo(sede.region, indirizzoRaw.region),
    statoAttivita: stato,
    formaGiuridica: testo(oggetto(raw.detailedLegalForm).description, raw.legalForm, raw.detailedLegalForm),
    ateco: testo(ateco.code, raw.atecoCode),
    atecoDescrizione: testo(ateco.description, raw.atecoDescription),
    rea: testo(raw.reaCode, raw.rea),
    cciaa: testo(raw.cciaa),
    dataIscrizione: testo(raw.registrationDate, raw.creationDate),
    pec: testo(raw.pec, raw.pecEmail),
    codiceSdi: testo(raw.sdiCode, raw.sdi),
    // Un'azienda cessata o in liquidazione non va trattata come una attiva:
    // e' proprio l'informazione per cui si fa il controllo prima di vendere.
    cessata: Boolean(stato && !/^ACTIVE$/i.test(stato)),
  }
}

/** Piccola memoria di processo: evita di ripagare la stessa partita IVA. */
const cache = new Map<string, { scadenza: number; data: CompanyLookupData }>()
const DURATA_CACHE_MS = 12 * 60 * 60 * 1000

export async function lookupCompany(input: string): Promise<CompanyLookupResult> {
  const token = process.env.OPENAPI_COMPANY_TOKEN

  const normalizzato = normalizeCompanyId(input)
  if (!normalizzato) {
    return {
      ok: false,
      reason: "identificativo_non_valido",
      message:
        "Partita IVA o codice fiscale non validi. La partita IVA italiana ha 11 cifre con cifra di controllo; il codice fiscale 16 caratteri. Nessun costo sostenuto.",
    }
  }

  const inCache = cache.get(normalizzato.id)
  if (inCache && inCache.scadenza > Date.now()) {
    return { ok: true, data: inCache.data, fromCache: true }
  }

  // Il controllo del token viene DOPO quello formale ma PRIMA della chiamata:
  // senza credenziale non si spende nulla e il messaggio deve dire che il
  // problema e' nostro, non del dato inserito.
  if (!token || !token.trim()) {
    return {
      ok: false,
      reason: "token_assente",
      message:
        "Il servizio di verifica non è configurato: manca la credenziale OPENAPI_COMPANY_TOKEN. Riprovare non serve, va impostata da noi.",
    }
  }

  let risposta: Response
  try {
    risposta = await fetch(`${BASE_URL}/IT-start/${encodeURIComponent(normalizzato.id)}`, {
      headers: { Authorization: `Bearer ${token.trim()}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
  } catch (e) {
    console.error("[company-lookup] fornitore non raggiungibile:", e)
    return {
      ok: false,
      reason: "fornitore_non_raggiungibile",
      message: "Il servizio dati non ha risposto. Riprova fra poco: nessun costo è stato addebitato.",
    }
  }

  const corpo = await risposta.text()

  // 204 = nessun contenuto: l'identificativo e' valido ma non risulta.
  if (risposta.status === 204) {
    return { ok: false, reason: "non_trovata", message: "Nessuna azienda trovata con questo identificativo." }
  }

  if (risposta.status === 401) {
    console.error("[company-lookup] 401 dal fornitore:", corpo.slice(0, 300))
    return {
      ok: false,
      reason: "token_non_valido",
      message:
        "La credenziale del servizio dati è rifiutata (401). È un problema di configurazione nostro: riprovare non lo risolve.",
    }
  }

  if (risposta.status === 403) {
    console.error("[company-lookup] 403 dal fornitore:", corpo.slice(0, 300))
    return {
      ok: false,
      reason: "permessi_mancanti",
      message: "La credenziale non ha i permessi per questo servizio (403). Va corretta nella console del fornitore.",
    }
  }

  if (risposta.status === 402) {
    console.error("[company-lookup] 402 dal fornitore:", corpo.slice(0, 300))
    return {
      ok: false,
      reason: "credito_fornitore_esaurito",
      message: "Il credito del nostro conto presso il fornitore dati è esaurito (402). Va ricaricato.",
    }
  }

  if (risposta.status === 404) {
    return { ok: false, reason: "non_trovata", message: "Nessuna azienda trovata con questo identificativo." }
  }

  if (!risposta.ok) {
    console.error("[company-lookup] stato inatteso", risposta.status, corpo.slice(0, 300))
    return {
      ok: false,
      reason: "fornitore_non_raggiungibile",
      message: `Il servizio dati ha risposto con un errore (${risposta.status}).`,
    }
  }

  let payload: any
  try {
    payload = JSON.parse(corpo)
  } catch {
    console.error("[company-lookup] risposta non JSON:", corpo.slice(0, 300))
    return { ok: false, reason: "fornitore_non_raggiungibile", message: "Risposta non leggibile dal servizio dati." }
  }

  // `data` e' SEMPRE un array, anche per una sola azienda: leggerlo come
  // oggetto darebbe tutti i campi vuoti senza sollevare alcun errore.
  const elenco = Array.isArray(payload?.data) ? payload.data : payload?.data ? [payload.data] : []
  if (!elenco.length) {
    return { ok: false, reason: "non_trovata", message: "Nessuna azienda trovata con questo identificativo." }
  }

  const data = mapCompany(oggetto(elenco[0]))
  cache.set(normalizzato.id, { scadenza: Date.now() + DURATA_CACHE_MS, data })

  return { ok: true, data, fromCache: false }
}
