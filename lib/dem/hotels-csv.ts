import fs from "fs"
import path from "path"

const CSV_PATH = path.join(process.cwd(), "public", "dem", "hotels-italia.csv")

export interface HotelLocation {
  citta: string
  provincia: string
  regione: string
}

let locationCache: { mtimeMs: number; map: Map<string, HotelLocation> } | null = null

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

// Title-case a CSV città (stored uppercase, e.g. "CALCINAIA" -> "Calcinaia").
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s'-])([a-zà-ù])/g, (_, sep, ch) => sep + ch.toUpperCase())
}

/**
 * Builds (and caches) a lookup map from lowercased email to the hotel location
 * found in the source CSV. Used to enrich DEM recipients (which don't store the
 * city) with their località at query time, always in sync with the CSV.
 */
export function getLocationByEmail(): Map<string, HotelLocation> {
  let stat: fs.Stats
  try {
    stat = fs.statSync(CSV_PATH)
  } catch {
    return new Map()
  }
  if (locationCache && locationCache.mtimeMs === stat.mtimeMs) {
    return locationCache.map
  }

  const content = fs.readFileSync(CSV_PATH, "utf8")
  const lines = content.split(/\r?\n/)
  const map = new Map<string, HotelLocation>()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const c = parseCsvLine(line)
    const email = (c[0] || "").trim().toLowerCase()
    if (!email) continue
    map.set(email, {
      citta: titleCase((c[8] || "").trim()),
      provincia: (c[9] || "").trim().toUpperCase(),
      regione: (c[10] || "").trim(),
    })
  }

  locationCache = { mtimeMs: stat.mtimeMs, map }
  return map
}

/** Returns a short "Città (PROV)" label, or empty string if unknown. */
export function formatLocation(loc?: HotelLocation): string {
  if (!loc || !loc.citta) return ""
  return loc.provincia ? `${loc.citta} (${loc.provincia})` : loc.citta
}
