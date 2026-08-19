import * as cheerio from "cheerio"
import { createAdminClient } from "@/lib/supabase/server-admin"

export const SCIDOO_MIN_CODE = 1
export const SCIDOO_MAX_CODE = 5000
export const SCIDOO_DEFAULT_BATCH_SIZE = 60

const FETCH_TIMEOUT_MS = 12_000
const WORKER_CONCURRENCY = 5
const BOOKING_BASE_URL = "https://www.scidoo.com/preventivov2/"

type JsonRecord = Record<string, unknown>

export type ScidooProperty = {
  scidoo_code: number
  name: string
  email: string | null
  emails: string[]
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
  next_code: number
  max_code: number
  status: "running" | "paused" | "completed"
  scanned_count: number
  found_count: number
  failed_count: number
  lock_token: string | null
  lock_until: string | null
  version: number
}

type ScannedCode =
  | { kind: "found"; property: ScidooProperty }
  | { kind: "missing"; code: number; httpStatus: number }
  | { kind: "failed"; code: number; error: string }

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
    const normalized = /^www\./i.test(raw) ? `https://${raw}` : raw
    const url = new URL(normalized, baseUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString()
  } catch {
    return null
  }
}

function isScidooUrl(value: string | null): boolean {
  if (!value) return false
  try {
    return new URL(value).hostname.toLowerCase().endsWith("scidoo.com")
  } catch {
    return false
  }
}

function cleanEmail(value: string): string | null {
  const email = decodeURIComponent(value)
    .replace(/^mailto:/i, "")
    .split("?")[0]
    .trim()
    .toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function cleanPhone(value: string): string | null {
  const raw = decodeURIComponent(value).replace(/^tel:/i, "").trim()
  const leadingPlus = raw.startsWith("+")
  const digits = raw.replace(/\D/g, "")
  if (digits.length < 7 || digits.length > 16) return null
  return `${leadingPlus ? "+" : ""}${digits}`
}

function flattenJsonLd(input: unknown, output: JsonRecord[] = []): JsonRecord[] {
  if (Array.isArray(input)) {
    input.forEach((item) => flattenJsonLd(item, output))
    return output
  }
  if (!input || typeof input !== "object") return output

  const record = input as JsonRecord
  output.push(record)
  if (record["@graph"]) flattenJsonLd(record["@graph"], output)
  return output
}

function jsonString(record: JsonRecord | null, key: string): string | null {
  return record ? compact(record[key]) : null
}

function findLodgingSchema(records: JsonRecord[]): JsonRecord | null {
  const wanted = ["hotel", "lodgingbusiness", "resort", "bedandbreakfast", "hostel", "campground", "localbusiness"]
  return (
    records.find((record) => {
      const type = record["@type"]
      const types = Array.isArray(type) ? type : [type]
      return types.some((item) => typeof item === "string" && wanted.includes(item.toLowerCase()))
    }) || null
  )
}

function derivePropertyName(h1: string | null, title: string | null, schemaName: string | null): string | null {
  const candidates = [h1, schemaName, title]
  for (const candidate of candidates) {
    const cleaned = compact(candidate)
      ?.replace(/^Prenotazione\s+Online\s+(?:Ufficiale\s+)?di\s+/i, "")
      .replace(/^Online\s+(?:Official\s+)?Booking\s+(?:of\s+)?/i, "")
      .replace(/\s*[-|]\s*(?:Prenotazione\s+Online|Official\s+Online\s+Booking|Online\s+Booking).*$/i, "")
      .trim()
    const isGenericBookingLabel =
      /^Prenotazione\s+Online(?:\s+Ufficiale)?(?:\s+di)?$/i.test(cleaned || "") ||
      /^Online\s+(?:Official\s+)?Booking(?:\s+of)?$/i.test(cleaned || "") ||
      /^[\s\-|–—]+$/.test(cleaned || "")

    // I codici Scidoo inesistenti possono restituire comunque HTTP 200 con un
    // H1 generico ("Prenotazione Online di") e senza identità della struttura.
    // Non considerarli clienti evita falsi positivi pur mantenendo validi i
    // booking engine che espongono davvero il nome nell'H1, nel title o nel JSON-LD.
    if (cleaned && cleaned.length >= 2 && !isGenericBookingLabel && !/^scidoo$/i.test(cleaned)) return cleaned
  }
  return null
}

function scoreProperty(property: Omit<ScidooProperty, "data_quality">): number {
  let score = 0
  if (property.email) score += 25
  if (property.phone) score += 20
  if (property.website_url) score += 15
  if (property.city) score += 10
  if (property.address) score += 8
  if (property.postal_code) score += 4
  if (property.province) score += 4
  if (property.region) score += 4
  if (property.logo_url) score += 5
  if (property.facebook_url || property.instagram_url || property.whatsapp_url) score += 5
  return Math.min(100, score)
}

export function parseScidooProperty(code: number, html: string, httpStatus = 200): ScidooProperty | null {
  const bookingUrl = `${BOOKING_BASE_URL}?cod=${code}&lang=0`
  const $ = cheerio.load(html)
  const sourceTitle = compact($("title").first().text()) || compact($("meta[property='og:title']").attr("content"))
  const h1 = compact($("h1").first().text())

  const jsonLdRecords: JsonRecord[] = []
  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).html()
    if (!raw) return
    try {
      flattenJsonLd(JSON.parse(raw), jsonLdRecords)
    } catch {
      // Un blocco JSON-LD non valido non deve far fallire l'intero codice.
    }
  })
  const lodging = findLodgingSchema(jsonLdRecords)
  const addressRecord = lodging && lodging.address && typeof lodging.address === "object" ? (lodging.address as JsonRecord) : null
  const name = derivePropertyName(h1, sourceTitle, jsonString(lodging, "name"))

  const pageText = $("body").text().replace(/\s+/g, " ")
  const hasBookingMarker = /Prenotazione\s+Online|Online\s+(?:Official\s+)?Booking|booking\s+engine/i.test(
    `${h1 || ""} ${sourceTitle || ""} ${pageText.slice(0, 4000)}`,
  )
  if (!name || !hasBookingMarker || httpStatus < 200 || httpStatus >= 400) return null

  const emails: string[] = []
  $("a[href^='mailto:']").each((_, element) => {
    const email = cleanEmail($(element).attr("href") || "")
    if (email) emails.push(email)
  })
  const schemaEmail = jsonString(lodging, "email")
  if (schemaEmail) {
    const email = cleanEmail(schemaEmail)
    if (email) emails.push(email)
  }
  const emailMatches = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
  emailMatches.forEach((value) => {
    const email = cleanEmail(value)
    if (email && !email.endsWith("@example.com")) emails.push(email)
  })

  const phones: string[] = []
  $("a[href^='tel:']").each((_, element) => {
    const phone = cleanPhone($(element).attr("href") || "")
    if (phone) phones.push(phone)
  })
  const schemaPhone = jsonString(lodging, "telephone")
  if (schemaPhone) {
    const phone = cleanPhone(schemaPhone)
    if (phone) phones.push(phone)
  }
  const italianPhoneMatches = pageText.match(/(?:\+39|0039)\s*(?:\(?\d{2,4}\)?[\s./-]*){2,5}\d{2,4}/g) || []
  italianPhoneMatches.forEach((value) => {
    const phone = cleanPhone(value)
    if (phone) phones.push(phone)
  })

  const allLinks = unique(
    $("a[href]")
      .map((_, element) => absoluteUrl($(element).attr("href"), bookingUrl))
      .get(),
  )
  const facebookUrl = allLinks.find((url) => /(^|\.)facebook\.com$/i.test(new URL(url).hostname)) || null
  const instagramUrl = allLinks.find((url) => /(^|\.)instagram\.com$/i.test(new URL(url).hostname)) || null
  const whatsappUrl =
    allLinks.find((url) => /(^|\.)(wa\.me|whatsapp\.com)$/i.test(new URL(url).hostname)) || null

  const schemaUrl = absoluteUrl(jsonString(lodging, "url"), bookingUrl)
  const websiteCandidates = unique([
    schemaUrl,
    ...$("a[href]")
      .filter((_, element) => /web\s*site|sito\s*web|website/i.test($(element).text()))
      .map((_, element) => absoluteUrl($(element).attr("href"), bookingUrl))
      .get(),
    ...allLinks,
  ])
  const websiteUrl =
    websiteCandidates.find((url) => {
      if (isScidooUrl(url)) return false
      const host = new URL(url).hostname.toLowerCase()
      return !/(facebook|instagram|whatsapp|youtube|twitter|linkedin|tiktok)\.com$/.test(host) && host !== "wa.me"
    }) || null

  const logoUrl =
    absoluteUrl($("meta[property='og:image']").attr("content"), bookingUrl) ||
    absoluteUrl($("img[alt*='booking Engine'], img[alt*='Booking Engine']").first().attr("src"), bookingUrl) ||
    absoluteUrl(jsonString(lodging, "logo") || jsonString(lodging, "image"), bookingUrl)

  const now = new Date().toISOString()
  const addressRegion = jsonString(addressRecord, "addressRegion")
  const baseProperty: Omit<ScidooProperty, "data_quality"> = {
    scidoo_code: code,
    name,
    email: unique(emails)[0] || null,
    emails: unique(emails),
    phone: unique(phones)[0] || null,
    phones: unique(phones),
    website_url: websiteUrl,
    booking_url: bookingUrl,
    address: jsonString(addressRecord, "streetAddress"),
    postal_code: jsonString(addressRecord, "postalCode"),
    city: jsonString(addressRecord, "addressLocality"),
    province: addressRegion && addressRegion.length <= 3 ? addressRegion : null,
    region: addressRegion && addressRegion.length > 3 ? addressRegion : null,
    country:
      typeof addressRecord?.addressCountry === "object"
        ? compact((addressRecord.addressCountry as JsonRecord).name)
        : jsonString(addressRecord, "addressCountry"),
    facebook_url: facebookUrl,
    instagram_url: instagramUrl,
    whatsapp_url: whatsappUrl,
    logo_url: logoUrl,
    source_title: sourceTitle,
    source_http_status: httpStatus,
    contact_data: {
      schema_types: unique(
        jsonLdRecords.flatMap((record) => {
          const type = record["@type"]
          return Array.isArray(type) ? type.filter((item): item is string => typeof item === "string") : [compact(type)]
        }),
      ),
    },
    is_active: true,
    last_checked_at: now,
    updated_at: now,
  }

  return { ...baseProperty, data_quality: scoreProperty(baseProperty) }
}

async function fetchScidooCode(code: number): Promise<ScannedCode> {
  const bookingUrl = `${BOOKING_BASE_URL}?cod=${code}&lang=0`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(bookingUrl, {
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.6",
        "User-Agent": "4BID-Scidoo-Directory/1.0 (+https://www.4bid.it)",
      },
    })
    const html = await response.text()
    const property = parseScidooProperty(code, html, response.status)
    if (property) return { kind: "found", property }
    return { kind: "missing", code, httpStatus: response.status }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore di rete sconosciuto"
    return { kind: "failed", code, error: message }
  } finally {
    clearTimeout(timeout)
  }
}

async function scanWithWorkerPool(codes: number[]): Promise<ScannedCode[]> {
  const results: ScannedCode[] = []
  let cursor = 0

  async function worker() {
    while (cursor < codes.length) {
      const index = cursor++
      results[index] = await fetchScidooCode(codes[index])
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  await Promise.all(Array.from({ length: Math.min(WORKER_CONCURRENCY, codes.length) }, () => worker()))
  return results
}

async function claimBatch(batchSize: number): Promise<{ state: ScanState; start: number; end: number; token: string } | null> {
  const admin = createAdminClient()
  const { data: state, error } = await admin.from("scidoo_scan_state").select("*").eq("id", 1).single()
  if (error || !state) throw new Error(error?.message || "Stato scansione Scidoo non disponibile")

  const typed = state as ScanState
  if (typed.status !== "running" || typed.next_code > typed.max_code) return null
  if (typed.lock_until && new Date(typed.lock_until).getTime() > Date.now()) return null

  const start = typed.next_code
  const end = Math.min(typed.max_code, start + batchSize - 1)
  const token = crypto.randomUUID()
  const now = new Date()
  const lockUntil = new Date(now.getTime() + 4 * 60_000).toISOString()

  const { data: claimed, error: claimError } = await admin
    .from("scidoo_scan_state")
    .update({
      lock_token: token,
      lock_until: lockUntil,
      last_batch_started_at: now.toISOString(),
      last_error: null,
      version: typed.version + 1,
      updated_at: now.toISOString(),
    })
    .eq("id", 1)
    .eq("version", typed.version)
    .select("id")

  if (claimError) throw new Error(claimError.message)
  if (!claimed || claimed.length === 0) return null
  return { state: { ...typed, version: typed.version + 1 }, start, end, token }
}

export async function processScidooScanBatch(requestedBatchSize = SCIDOO_DEFAULT_BATCH_SIZE) {
  const batchSize = Math.min(150, Math.max(1, Math.floor(requestedBatchSize)))
  const claim = await claimBatch(batchSize)
  if (!claim) return { processed: 0, found: 0, failed: 0, lockedOrStopped: true }

  const admin = createAdminClient()
  const codes = Array.from({ length: claim.end - claim.start + 1 }, (_, index) => claim.start + index)

  try {
    const results = await scanWithWorkerPool(codes)
    const found = results.filter((result): result is Extract<ScannedCode, { kind: "found" }> => result.kind === "found")
    const missing = results.filter((result): result is Extract<ScannedCode, { kind: "missing" }> => result.kind === "missing")
    const failed = results.filter((result): result is Extract<ScannedCode, { kind: "failed" }> => result.kind === "failed")

    if (found.length > 0) {
      const { error } = await admin.from("scidoo_properties").upsert(
        found.map((result) => result.property),
        { onConflict: "scidoo_code" },
      )
      if (error) throw new Error(`Salvataggio strutture: ${error.message}`)
    }

    if (missing.length > 0) {
      const checkedAt = new Date().toISOString()
      const { error } = await admin
        .from("scidoo_properties")
        .update({ is_active: false, last_checked_at: checkedAt, updated_at: checkedAt })
        .in(
          "scidoo_code",
          missing.map((result) => result.code),
        )
      if (error) throw new Error(`Aggiornamento codici non attivi: ${error.message}`)
    }

    const { count, error: countError } = await admin
      .from("scidoo_properties")
      .select("scidoo_code", { count: "exact", head: true })
      .eq("is_active", true)
    if (countError) throw new Error(`Conteggio strutture: ${countError.message}`)

    const nextCode = claim.end + 1
    const completed = nextCode > claim.state.max_code
    const finishedAt = new Date().toISOString()
    const firstFailure = failed[0]
    const stateUpdate: Record<string, unknown> = {
      next_code: nextCode,
      scanned_count: claim.end,
      found_count: count || 0,
      failed_count: claim.state.failed_count + failed.length,
      last_batch_finished_at: finishedAt,
      last_error: firstFailure ? `Codice ${firstFailure.code}: ${firstFailure.error}` : null,
      lock_token: null,
      lock_until: null,
      version: claim.state.version + 1,
      updated_at: finishedAt,
    }
    if (completed) stateUpdate.status = "completed"

    const { error: stateError } = await admin
      .from("scidoo_scan_state")
      .update(stateUpdate)
      .eq("id", 1)
      .eq("lock_token", claim.token)
    if (stateError) throw new Error(`Aggiornamento avanzamento: ${stateError.message}`)

    return {
      processed: results.length,
      found: found.length,
      missing: missing.length,
      failed: failed.length,
      start: claim.start,
      end: claim.end,
      nextCode,
      completed,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore scansione sconosciuto"
    await admin
      .from("scidoo_scan_state")
      .update({
        last_error: message.slice(0, 1000),
        lock_token: null,
        lock_until: null,
        version: claim.state.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .eq("lock_token", claim.token)
    throw error
  }
}
