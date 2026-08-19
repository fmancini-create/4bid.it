import * as cheerio from "cheerio"
import { createAdminClient } from "@/lib/supabase/server-admin"

export const SLOPE_DEFAULT_BATCH_SIZE = 20

const FETCH_TIMEOUT_MS = 15_000
const WORKER_CONCURRENCY = 4
const BOOKING_HOST = "booking.slope.it"
const BOOKING_BASE_URL = `https://${BOOKING_HOST}`
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type JsonRecord = Record<string, unknown>

export type SlopeProperty = {
  slope_id: string
  name: string
  email: string | null
  emails: string[]
  pec: string | null
  phone: string | null
  phones: string[]
  website_url: string | null
  booking_url: string
  address: string | null
  postal_code: string | null
  city: string | null
  province: string | null
  region: string | null
  country: string | null
  facebook_url: string | null
  instagram_url: string | null
  whatsapp_url: string | null
  logo_url: string | null
  vat_number: string | null
  latitude: number | null
  longitude: number | null
  source_title: string | null
  source_http_status: number
  data_quality: number
  contact_data: JsonRecord
  is_active: boolean
  last_checked_at: string
  updated_at: string
}

type ScanState = {
  id: number
  status: "running" | "paused" | "completed"
  processed_count: number
  found_count: number
  failed_count: number
  lock_token: string | null
  lock_until: string | null
  version: number
}

type QueueRow = {
  slope_id: string
  booking_url: string
  attempts: number
}

type ScannedUrl =
  | { kind: "found"; row: QueueRow; property: SlopeProperty }
  | { kind: "missing"; row: QueueRow; httpStatus: number; error: string }
  | { kind: "failed"; row: QueueRow; error: string }

const ITALIAN_REGIONS_BY_PROVINCE: Record<string, string> = {
  AG: "Sicilia", AL: "Piemonte", AN: "Marche", AO: "Valle d'Aosta", AP: "Marche", AQ: "Abruzzo",
  AR: "Toscana", AT: "Piemonte", AV: "Campania", BA: "Puglia", BG: "Lombardia", BI: "Piemonte",
  BL: "Veneto", BN: "Campania", BO: "Emilia-Romagna", BR: "Puglia", BS: "Lombardia", BT: "Puglia",
  BZ: "Trentino-Alto Adige", CA: "Sardegna", CB: "Molise", CE: "Campania", CH: "Abruzzo", CL: "Sicilia",
  CN: "Piemonte", CO: "Lombardia", CR: "Lombardia", CS: "Calabria", CT: "Sicilia", CZ: "Calabria",
  EN: "Sicilia", FC: "Emilia-Romagna", FE: "Emilia-Romagna", FG: "Puglia", FI: "Toscana", FM: "Marche",
  FR: "Lazio", GE: "Liguria", GO: "Friuli-Venezia Giulia", GR: "Toscana", IM: "Liguria", IS: "Molise",
  KR: "Calabria", LC: "Lombardia", LE: "Puglia", LI: "Toscana", LO: "Lombardia", LT: "Lazio",
  LU: "Toscana", MB: "Lombardia", MC: "Marche", ME: "Sicilia", MI: "Lombardia", MN: "Lombardia",
  MO: "Emilia-Romagna", MS: "Toscana", MT: "Basilicata", NA: "Campania", NO: "Piemonte", NU: "Sardegna",
  OR: "Sardegna", PA: "Sicilia", PC: "Emilia-Romagna", PD: "Veneto", PE: "Abruzzo", PG: "Umbria",
  PI: "Toscana", PN: "Friuli-Venezia Giulia", PO: "Toscana", PR: "Emilia-Romagna", PT: "Toscana",
  PU: "Marche", PV: "Lombardia", PZ: "Basilicata", RA: "Emilia-Romagna", RC: "Calabria", RE: "Emilia-Romagna",
  RG: "Sicilia", RI: "Lazio", RM: "Lazio", RN: "Emilia-Romagna", RO: "Veneto", SA: "Campania",
  SI: "Toscana", SO: "Lombardia", SP: "Liguria", SR: "Sicilia", SS: "Sardegna", SU: "Sardegna",
  SV: "Liguria", TA: "Puglia", TE: "Abruzzo", TN: "Trentino-Alto Adige", TO: "Piemonte", TP: "Sicilia",
  TR: "Umbria", TS: "Friuli-Venezia Giulia", TV: "Veneto", UD: "Friuli-Venezia Giulia", VA: "Lombardia",
  VB: "Piemonte", VC: "Piemonte", VE: "Veneto", VI: "Veneto", VR: "Veneto", VT: "Lazio", VV: "Calabria",
}

function compact(value: unknown): string | null {
  if (typeof value !== "string") return null
  const result = value.replace(/\s+/g, " ").trim()
  return result || null
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map(compact).filter((value): value is string => Boolean(value))))
}

function absoluteUrl(value: string | null | undefined, baseUrl: string): string | null {
  const raw = compact(value)
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return null
  try {
    const url = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw, baseUrl)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

function cleanEmail(value: string): string | null {
  const email = decodeURIComponent(value).replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function cleanPhone(value: string): string | null {
  const raw = decodeURIComponent(value).replace(/^tel:/i, "").trim()
  const leadingPlus = raw.startsWith("+") || raw.startsWith("00")
  const digits = raw.replace(/\D/g, "")
  if (digits.length < 7 || digits.length > 16) return null
  return `${leadingPlus ? "+" : ""}${digits.startsWith("00") ? digits.slice(2) : digits}`
}

export function canonicalSlopeBookingUrl(input: string): { slopeId: string; bookingUrl: string } | null {
  const raw = input.trim()
  let slopeId = UUID_PATTERN.test(raw) ? raw : null
  if (!slopeId) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
      if (url.hostname.toLowerCase() !== BOOKING_HOST) return null
      const candidate = url.pathname.split("/").filter(Boolean)[0] || ""
      if (!UUID_PATTERN.test(candidate)) return null
      slopeId = candidate
    } catch {
      return null
    }
  }
  const normalizedId = slopeId.toLowerCase()
  return { slopeId: normalizedId, bookingUrl: `${BOOKING_BASE_URL}/${normalizedId}` }
}

function scoreProperty(property: Omit<SlopeProperty, "data_quality">): number {
  let score = 0
  if (property.email) score += 22
  if (property.phone) score += 18
  if (property.website_url) score += 14
  if (property.address) score += 8
  if (property.city) score += 8
  if (property.postal_code) score += 4
  if (property.province) score += 4
  if (property.region) score += 4
  if (property.logo_url) score += 5
  if (property.facebook_url || property.instagram_url || property.whatsapp_url) score += 5
  if (property.pec) score += 4
  if (property.vat_number) score += 4
  if (property.latitude != null && property.longitude != null) score += 4
  return Math.min(100, score)
}

function findLabelValue($: cheerio.CheerioAPI, labels: RegExp): string | null {
  let value: string | null = null
  $("td, dt, th").each((_, element) => {
    if (value || !labels.test(compact($(element).text()) || "")) return
    const candidate = $(element).next("td, dd").first()
    value = compact(candidate.text())
  })
  return value
}

function findLabelLink($: cheerio.CheerioAPI, labels: RegExp, baseUrl: string): string | null {
  let value: string | null = null
  $("td, dt, th").each((_, element) => {
    if (value || !labels.test(compact($(element).text()) || "")) return
    value = absoluteUrl($(element).next("td, dd").find("a[href]").first().attr("href"), baseUrl)
  })
  return value
}

export function parseSlopeProperty(slopeId: string, html: string, httpStatus = 200): SlopeProperty | null {
  if (!UUID_PATTERN.test(slopeId) || httpStatus < 200 || httpStatus >= 400) return null
  const bookingUrl = `${BOOKING_BASE_URL}/${slopeId.toLowerCase()}`
  const $ = cheerio.load(html)
  const sourceTitle = compact($("title").first().text())
  const name =
    compact($("meta[property='og:site_name']").attr("content")) ||
    compact($("meta[property='og:title']").attr("content")) ||
    compact($("h1").first().text())
  if (!name || /^(slope|prenota|booking|booking engine)$/i.test(name)) return null

  const pageText = compact($("body").text()) || ""
  const emails: string[] = []
  $("a[href^='mailto:']").each((_, element) => {
    const email = cleanEmail($(element).attr("href") || "")
    if (email) emails.push(email)
  })
  ;(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).forEach((value) => {
    const email = cleanEmail(value)
    if (email && !email.endsWith("@example.com")) emails.push(email)
  })

  const pecMatch = pageText.match(/\bPEC\s*:?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
  const pec = pecMatch ? cleanEmail(pecMatch[1]) : null
  const uniqueEmails = unique(emails)
  const ordinaryEmails = uniqueEmails.filter((email) => email !== pec)

  const phones: string[] = []
  $("a[href^='tel:']").each((_, element) => {
    const phone = cleanPhone($(element).attr("href") || "")
    if (phone) phones.push(phone)
  })
  const labelledPhone = findLabelValue($, /^(telefono|phone)\s*:?$/i)
  if (labelledPhone) {
    const phone = cleanPhone(labelledPhone)
    if (phone) phones.push(phone)
  }
  const uniquePhones = unique(phones)

  const allLinks = unique(
    $("a[href]")
      .map((_, element) => absoluteUrl($(element).attr("href"), bookingUrl))
      .get(),
  )
  const facebookUrl = allLinks.find((url) => /(^|\.)facebook\.com$/i.test(new URL(url).hostname)) || null
  const instagramUrl = allLinks.find((url) => /(^|\.)instagram\.com$/i.test(new URL(url).hostname)) || null
  const whatsappUrl = allLinks.find((url) => /(^|\.)(wa\.me|whatsapp\.com)$/i.test(new URL(url).hostname)) || null
  const labelledWebsite = findLabelLink($, /^(sito(?:\s+web)?|website)\s*:?$/i, bookingUrl)
  const websiteUrl =
    unique([labelledWebsite, ...allLinks]).find((url) => {
      const host = new URL(url).hostname.toLowerCase()
      return (
        host !== BOOKING_HOST &&
        !host.endsWith("slope.it") &&
        !host.includes("amazonaws.com") &&
        !/(facebook|instagram|whatsapp|youtube|twitter|linkedin|tiktok|google)\./.test(host) &&
        host !== "wa.me"
      )
    }) || null

  const rawAddress = findLabelValue($, /^(indirizzo|address)\s*:?$/i)
  const addressMatch = rawAddress?.match(/^(.*?)\s+(\d{5})\s+(.+?)\s*\(([A-Z]{2})\)\s*(?:-\s*([A-Z]{2}))?$/i)
  const address = compact(addressMatch?.[1] || rawAddress)
  const postalCode = addressMatch?.[2] || rawAddress?.match(/\b\d{5}\b/)?.[0] || null
  const city = compact(addressMatch?.[3])
  const province = addressMatch?.[4]?.toUpperCase() || rawAddress?.match(/\(([A-Z]{2})\)/)?.[1] || null
  const countryCode = addressMatch?.[5]?.toUpperCase() || null
  const region = province ? ITALIAN_REGIONS_BY_PROVINCE[province] || null : null

  const coordinateValue = $("[data-OpenStreetMap-coordinates-value]").first().attr("data-OpenStreetMap-coordinates-value")
  let latitude: number | null = null
  let longitude: number | null = null
  if (coordinateValue) {
    try {
      const coordinates = JSON.parse(coordinateValue)
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        longitude = Number.isFinite(Number(coordinates[0])) ? Number(coordinates[0]) : null
        latitude = Number.isFinite(Number(coordinates[1])) ? Number(coordinates[1]) : null
      }
    } catch {
      // Coordinate opzionali: un attributo non valido non invalida la struttura.
    }
  }

  const vatMatch = pageText.match(/\b(?:P\.?\s*I\.?|PI|PIVA|PARTITA\s+IVA|VAT)\s*:?\s*(?:IT\s*)?([0-9]{11})\b/i)
  const vatNumber = vatMatch?.[1] || null
  const logoUrl =
    absoluteUrl($("meta[property='og:image']").attr("content"), bookingUrl) ||
    absoluteUrl($("img#logo, img.logo, header img").first().attr("src"), bookingUrl)
  const privacyOwner = pageText.match(/Titolare del trattamento[^.]*?è\s+(.+?)(?:,\s+con sede|\.)/i)?.[1] || null

  const now = new Date().toISOString()
  const baseProperty: Omit<SlopeProperty, "data_quality"> = {
    slope_id: slopeId.toLowerCase(),
    name,
    email: ordinaryEmails[0] || pec || null,
    emails: uniqueEmails,
    pec,
    phone: uniquePhones[0] || null,
    phones: uniquePhones,
    website_url: websiteUrl,
    booking_url: bookingUrl,
    address,
    postal_code: postalCode,
    city,
    province,
    region,
    country: countryCode === "IT" ? "Italia" : countryCode,
    facebook_url: facebookUrl,
    instagram_url: instagramUrl,
    whatsapp_url: whatsappUrl,
    logo_url: logoUrl,
    vat_number: vatNumber,
    latitude,
    longitude,
    source_title: sourceTitle,
    source_http_status: httpStatus,
    contact_data: {
      privacy_owner: compact(privacyOwner),
      source_address: rawAddress,
      source_country_code: countryCode,
    },
    is_active: true,
    last_checked_at: now,
    updated_at: now,
  }
  return { ...baseProperty, data_quality: scoreProperty(baseProperty) }
}

async function fetchSlopeUrl(row: QueueRow): Promise<ScannedUrl> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(row.booking_url, {
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.6",
        "User-Agent": "4BID-Slope-Directory/1.0 (+https://www.4bid.it)",
      },
    })
    const html = await response.text()
    const property = parseSlopeProperty(row.slope_id, html, response.status)
    if (property) return { kind: "found", row, property }
    return { kind: "missing", row, httpStatus: response.status, error: `Pagina Slope non riconosciuta (HTTP ${response.status})` }
  } catch (error) {
    return { kind: "failed", row, error: error instanceof Error ? error.message : "Errore di rete sconosciuto" }
  } finally {
    clearTimeout(timeout)
  }
}

async function scanWithWorkerPool(rows: QueueRow[]): Promise<ScannedUrl[]> {
  const results: ScannedUrl[] = []
  let cursor = 0
  async function worker() {
    while (cursor < rows.length) {
      const index = cursor++
      results[index] = await fetchSlopeUrl(rows[index])
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  await Promise.all(Array.from({ length: Math.min(WORKER_CONCURRENCY, rows.length) }, () => worker()))
  return results
}

async function claimBatch(batchSize: number): Promise<{ state: ScanState; rows: QueueRow[]; token: string } | null> {
  const admin = createAdminClient()
  const { data: state, error } = await admin.from("slope_scan_state").select("*").eq("id", 1).single()
  if (error || !state) throw new Error(error?.message || "Stato scansione Slope non disponibile")
  const typed = state as ScanState
  if (typed.status === "paused") return null
  if (typed.lock_until && new Date(typed.lock_until).getTime() > Date.now()) return null

  const now = new Date().toISOString()
  const { data: queueRows, error: queueError } = await admin
    .from("slope_scan_queue")
    .select("slope_id, booking_url, attempts")
    .in("status", ["pending", "failed"])
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order("created_at", { ascending: true })
    .limit(batchSize)
  if (queueError) throw new Error(queueError.message)
  if (!queueRows?.length) {
    await admin.from("slope_scan_state").update({ status: "completed", updated_at: now }).eq("id", 1)
    return null
  }

  const token = crypto.randomUUID()
  const lockUntil = new Date(Date.now() + 4 * 60_000).toISOString()
  const { data: claimed, error: claimError } = await admin
    .from("slope_scan_state")
    .update({
      status: "running",
      lock_token: token,
      lock_until: lockUntil,
      last_batch_started_at: now,
      last_error: null,
      version: typed.version + 1,
      updated_at: now,
    })
    .eq("id", 1)
    .eq("version", typed.version)
    .select("id")
  if (claimError) throw new Error(claimError.message)
  if (!claimed?.length) return null

  const rows = queueRows as QueueRow[]
  const { error: markError } = await admin
    .from("slope_scan_queue")
    .update({ status: "processing", last_attempt_at: now, updated_at: now })
    .in("slope_id", rows.map((row) => row.slope_id))
  if (markError) throw new Error(markError.message)
  return { state: { ...typed, version: typed.version + 1 }, rows, token }
}

async function refreshState(token: string, version: number, lastError: string | null) {
  const admin = createAdminClient()
  const [foundResult, completedResult, failedResult, pendingResult] = await Promise.all([
    admin.from("slope_properties").select("slope_id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("slope_scan_queue").select("slope_id", { count: "exact", head: true }).eq("status", "completed"),
    admin.from("slope_scan_queue").select("slope_id", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("slope_scan_queue").select("slope_id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
  ])
  const countError = foundResult.error || completedResult.error || failedResult.error || pendingResult.error
  if (countError) throw new Error(countError.message)
  const finishedAt = new Date().toISOString()
  const { error } = await admin
    .from("slope_scan_state")
    .update({
      status: (pendingResult.count || 0) > 0 ? "running" : "completed",
      processed_count: (completedResult.count || 0) + (failedResult.count || 0),
      found_count: foundResult.count || 0,
      failed_count: failedResult.count || 0,
      last_batch_finished_at: finishedAt,
      last_error: lastError,
      lock_token: null,
      lock_until: null,
      version: version + 1,
      updated_at: finishedAt,
    })
    .eq("id", 1)
    .eq("lock_token", token)
  if (error) throw new Error(error.message)
}

export async function processSlopeScanBatch(requestedBatchSize = SLOPE_DEFAULT_BATCH_SIZE) {
  const batchSize = Math.min(100, Math.max(1, Math.floor(requestedBatchSize)))
  const claim = await claimBatch(batchSize)
  if (!claim) return { processed: 0, found: 0, failed: 0, lockedOrStopped: true }
  const admin = createAdminClient()
  try {
    const results = await scanWithWorkerPool(claim.rows)
    const found = results.filter((result): result is Extract<ScannedUrl, { kind: "found" }> => result.kind === "found")
    const failures = results.filter((result): result is Exclude<ScannedUrl, { kind: "found" }> => result.kind !== "found")

    if (found.length) {
      const { error } = await admin.from("slope_properties").upsert(found.map((result) => result.property), { onConflict: "slope_id" })
      if (error) throw new Error(`Salvataggio strutture: ${error.message}`)
      for (const result of found) {
        const { error: queueError } = await admin
          .from("slope_scan_queue")
          .update({ status: "completed", attempts: result.row.attempts + 1, last_error: null, next_attempt_at: null, updated_at: new Date().toISOString() })
          .eq("slope_id", result.row.slope_id)
        if (queueError) throw new Error(queueError.message)
      }
    }

    for (const result of failures) {
      const attempts = result.row.attempts + 1
      const delayMinutes = attempts >= 4 ? 24 * 60 : 5 * 2 ** Math.max(0, attempts - 1)
      const nextAttemptAt = new Date(Date.now() + delayMinutes * 60_000).toISOString()
      const { error: queueError } = await admin
        .from("slope_scan_queue")
        .update({ status: "failed", attempts, last_error: result.error.slice(0, 1000), next_attempt_at: nextAttemptAt, updated_at: new Date().toISOString() })
        .eq("slope_id", result.row.slope_id)
      if (queueError) throw new Error(queueError.message)
      if (result.kind === "missing") {
        await admin
          .from("slope_properties")
          .update({ is_active: false, source_http_status: result.httpStatus, last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("slope_id", result.row.slope_id)
      }
    }

    const firstFailure = failures[0]
    await refreshState(claim.token, claim.state.version, firstFailure ? `${firstFailure.row.slope_id}: ${firstFailure.error}` : null)
    return { processed: results.length, found: found.length, failed: failures.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore scansione sconosciuto"
    await admin
      .from("slope_scan_queue")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .in("slope_id", claim.rows.map((row) => row.slope_id))
      .eq("status", "processing")
    await admin
      .from("slope_scan_state")
      .update({ last_error: message.slice(0, 1000), lock_token: null, lock_until: null, version: claim.state.version + 1, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .eq("lock_token", claim.token)
    throw error
  }
}

export async function enqueueSlopeUrls(inputs: string[], source = "manual") {
  const accepted = new Map<string, {
    slope_id: string
    booking_url: string
    status: string
    attempts: number
    source: string
    last_error: null
    next_attempt_at: null
    updated_at: string
  }>()
  const rejected: string[] = []
  const now = new Date().toISOString()
  for (const input of inputs) {
    const canonical = canonicalSlopeBookingUrl(input)
    if (!canonical) {
      if (input.trim()) rejected.push(input.trim().slice(0, 200))
      continue
    }
    accepted.set(canonical.slopeId, {
      slope_id: canonical.slopeId,
      booking_url: canonical.bookingUrl,
      status: "pending",
      attempts: 0,
      source,
      last_error: null,
      next_attempt_at: null,
      updated_at: now,
    })
  }
  if (!accepted.size) return { accepted: 0, rejected }
  const admin = createAdminClient()
  const { error } = await admin.from("slope_scan_queue").upsert(Array.from(accepted.values()), { onConflict: "slope_id" })
  if (error) throw new Error(error.message)
  const { data: state, error: stateReadError } = await admin.from("slope_scan_state").select("version").eq("id", 1).single()
  if (stateReadError) throw new Error(stateReadError.message)
  const { error: stateError } = await admin
    .from("slope_scan_state")
    .update({ status: "running", last_error: null, version: (state?.version || 0) + 1, updated_at: now })
    .eq("id", 1)
  if (stateError) throw new Error(stateError.message)
  return { accepted: accepted.size, rejected }
}
