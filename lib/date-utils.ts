/**
 * Utility per gestire le date con timezone Europe/Rome
 * Tutti i timestamp nel DB sono in UTC, ma visualizzati in ora italiana
 */

const TIMEZONE = "Europe/Rome"

/**
 * Formatta una data ISO in italiano con timezone Europe/Rome
 */
export function formatDateIT(
  isoString: string | null | undefined,
  options: {
    dateStyle?: "full" | "long" | "medium" | "short"
    timeStyle?: "full" | "long" | "medium" | "short"
  } = { dateStyle: "short" },
): string {
  if (!isoString) return ""
  try {
    const date = new Date(isoString)
    return date.toLocaleString("it-IT", {
      ...options,
      timeZone: TIMEZONE,
    })
  } catch {
    return isoString
  }
}

/**
 * Formatta solo la data in italiano
 */
export function formatDateOnlyIT(isoString: string | null | undefined): string {
  return formatDateIT(isoString, { dateStyle: "short" })
}

/**
 * Formatta data e ora in italiano
 */
export function formatDateTimeIT(isoString: string | null | undefined): string {
  return formatDateIT(isoString, { dateStyle: "short", timeStyle: "short" })
}

/**
 * Formatta solo l'ora in italiano
 */
export function formatTimeIT(isoString: string | null | undefined): string {
  return formatDateIT(isoString, { timeStyle: "short" })
}

/**
 * Converte un datetime-local (YYYY-MM-DDTHH:mm) inserito dall'utente in Italia
 * in una stringa ISO UTC corretta per il database
 *
 * Esempio: "2025-01-06T15:00" (ora italiana) -> "2025-01-06T14:00:00.000Z" (UTC in inverno)
 */
export function localDatetimeToUTC(localDatetime: string): string {
  if (!localDatetime) return ""

  // L'input è in formato "YYYY-MM-DDTHH:mm" e rappresenta l'ora italiana
  const [datePart, timePart] = localDatetime.split("T")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute] = timePart.split(":").map(Number)

  // Crea una data in UTC, poi calcola l'offset per Europe/Rome
  // In inverno (CET) l'offset è UTC+1, in estate (CEST) è UTC+2
  const tempDate = new Date(Date.UTC(year, month - 1, day, hour, minute))

  // Ottieni l'offset di Europe/Rome per questa data specifica
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    timeZoneName: "shortOffset",
  })
  const parts = formatter.formatToParts(tempDate)
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "+01"

  // Parse l'offset (es: "GMT+1" o "GMT+2")
  const offsetMatch = offsetPart.match(/([+-])(\d{1,2})/)
  const offsetHours = offsetMatch ? Number.parseInt(offsetMatch[2]) * (offsetMatch[1] === "+" ? 1 : -1) : 1

  // Sottrai l'offset per ottenere UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute))

  return utcDate.toISOString()
}

/**
 * Converte una data ISO UTC in formato datetime-local (YYYY-MM-DDTHH:mm)
 * per popolare un input datetime-local con l'ora italiana corretta
 *
 * Esempio: "2025-01-06T14:00:00.000Z" (UTC) -> "2025-01-06T15:00" (ora italiana in inverno)
 */
export function utcToLocalDatetime(isoString: string | null | undefined): string {
  if (!isoString) return ""

  try {
    const date = new Date(isoString)

    // Ottieni i componenti in timezone Europe/Rome
    const formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const get = (type: string) => parts.find((p) => p.type === type)?.value || ""

    // Formato: YYYY-MM-DDTHH:mm (richiesto da datetime-local)
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
  } catch {
    return ""
  }
}

/**
 * Restituisce la data/ora corrente in formato datetime-local per Europe/Rome
 */
export function nowAsLocalDatetime(): string {
  return utcToLocalDatetime(new Date().toISOString())
}
