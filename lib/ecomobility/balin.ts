/**
 * Balin.app API client.
 * Docs: https://developers.balin.app/
 *
 * Auth: Basic base64(email:api_token)
 * Rate limit: 1 req/s.
 * Range limits:
 *  - positionsHistory: max 1 day window, up to 30 days in past
 *  - tripPositionsHistory: max 90 days window (NON QUECLINK)
 */

const BASE_URL = "https://api.balin.app/external_api/v1"

let lastCallAt = 0
const MIN_INTERVAL_MS = 1100 // safety > 1 req/s

function authHeader(): string {
  const email = process.env.BALIN_EMAIL
  const token = process.env.BALIN_API_TOKEN
  if (!email || !token) {
    throw new Error("BALIN_EMAIL or BALIN_API_TOKEN missing in environment")
  }
  const b64 = Buffer.from(`${email}:${token}`).toString("base64")
  return `Basic ${b64}`
}

async function throttle() {
  const now = Date.now()
  const wait = lastCallAt + MIN_INTERVAL_MS - now
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCallAt = Date.now()
}

async function balinRequest<T = any>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: any,
  retry = 1,
): Promise<T> {
  await throttle()
  const url = `${BASE_URL}${path}`
  const init: RequestInit = {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  }
  if (body !== undefined) init.body = JSON.stringify(body)

  const res = await fetch(url, init)
  if (res.status === 429 && retry > 0) {
    await new Promise((r) => setTimeout(r, 2000))
    return balinRequest(method, path, body, retry - 1)
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Balin ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// === Resource types ===

export interface BalinDevice {
  id: number
  imei: string
  name?: string
  model?: string // FMB920, FMB020, ATRACK_AK1, ATRACK_AL1, FMC920, QUECLINK_*
  is_connected?: boolean
  moving?: boolean
  is_moving?: boolean
  battery_voltage?: number // QUECLINK only -> in mV (range ~3300-4200)
  device_battery_voltage?: number // backup battery on some models
  odometer?: number // meters
  speed?: number // km/h
  last_position?: BalinPosition
}

export interface BalinPosition {
  type?: number
  // 1=GPS, 2=power_on, 3=power_off, 4=trip_start, 5=stop, 6=move,
  // 7=idle, 8/9 input1, 10/11 output1
  latitude: number
  longitude: number
  altitude?: number
  speed?: number
  heading?: number
  recorded_at?: string // ISO8601
  battery_voltage?: number
}

export interface BalinShareLink {
  id?: string
  url?: string
  expires_at?: string
  imei?: string
}

// === Endpoints ===

export async function listDevices(): Promise<BalinDevice[]> {
  const data = await balinRequest<any>("GET", "/devices")
  // L'API ritorna { devices: [...] } oppure direttamente un array
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.devices)) return data.devices
  if (Array.isArray(data?.data)) return data.data
  return []
}

export async function getDevice(imei: string): Promise<BalinDevice | null> {
  const data = await balinRequest<any>("GET", `/device/${encodeURIComponent(imei)}`)
  if (!data) return null
  return data.device || data.data || data
}

export async function getPositionsHistory(
  imei: string,
  fromIso: string,
  toIso: string,
): Promise<BalinPosition[]> {
  const qs = `?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
  const data = await balinRequest<any>("GET", `/positionsHistory/${encodeURIComponent(imei)}${qs}`)
  if (Array.isArray(data)) return data
  return data?.positions || data?.data || []
}

export async function getTripPositionsHistory(
  imei: string,
  fromIso: string,
  toIso: string,
): Promise<BalinPosition[]> {
  const qs = `?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
  const data = await balinRequest<any>(
    "GET",
    `/tripPositionsHistory/${encodeURIComponent(imei)}${qs}`,
  )
  if (Array.isArray(data)) return data
  return data?.positions || data?.data || []
}

export async function createShareLink(
  imei: string,
  expiresAt: Date,
): Promise<BalinShareLink> {
  const data = await balinRequest<any>("POST", "/link_condivisione", {
    imei,
    expires_at: expiresAt.toISOString(),
  })
  return data?.link || data?.data || data || {}
}

export async function deleteShareLink(linkId: string): Promise<void> {
  await balinRequest<void>("DELETE", `/link_condivisione/${encodeURIComponent(linkId)}`)
}

export async function getShareLink(linkId: string): Promise<BalinShareLink | null> {
  const data = await balinRequest<any>("GET", `/link_condivisione/${encodeURIComponent(linkId)}`)
  return data?.link || data?.data || data || null
}

// === Helpers ===

/**
 * Mappa battery_voltage (mV) -> percentuale 0-100 per QUECLINK.
 * Range tipico: 3300mV (0%) - 4200mV (100%).
 */
export function voltageToPercent(mv: number | null | undefined): number | null {
  if (mv == null || isNaN(Number(mv))) return null
  const v = Number(mv)
  // Alcuni device ritornano già in volt (3.3-4.2), normalizziamo
  const milli = v < 100 ? v * 1000 : v
  const min = 3300
  const max = 4200
  const pct = Math.round(((milli - min) / (max - min)) * 100)
  return Math.max(0, Math.min(100, pct))
}

export function isQueclink(model?: string | null): boolean {
  if (!model) return false
  return /queclink/i.test(model)
}

export function metersToKm(m: number | null | undefined): number | null {
  if (m == null) return null
  return Math.round((Number(m) / 1000) * 100) / 100
}
