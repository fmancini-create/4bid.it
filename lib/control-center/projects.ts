import type { AuditProject } from "./types"

export const AUDIT_PROJECTS: AuditProject[] = [
  // Repository attivi
  { slug: "hotel-accelerator", name: "Hotel Accelerator", repository: "fmancini-create/HotelAccelerator", branch: "main" },
  { slug: "manubot", name: "ManuBot", repository: "fmancini-create/v0-manu-bot", branch: "main" },
  { slug: "santaddeo", name: "Santaddeo", repository: "fmancini-create/santaddeo-V1", branch: "main" },
  { slug: "hotel-profit-ai", name: "Hotel Profit AI", repository: "fmancini-create/v0-hotel-profit-ai", branch: "main" },
  { slug: "4bid", name: "4 BID", repository: "fmancini-create/4bid.it", branch: "4bid", productUrl: "https://4bid.it" },
  { slug: "autoexel", name: "AutoExel", repository: "fmancini-create/v0-autoexel", branch: "main" },
  { slug: "mypetsenseai", name: "MyPetSenseAI", repository: "fmancini-create/v0-mypetsenseai-v2", branch: "MyPetSense" },
  { slug: "risparmio-compulsivo", name: "Risparmio Compulsivo", repository: "fmancini-create/v0-risparmio-compulsivo", branch: "main" },
  { slug: "villa-i-barronci", name: "Villa I Barronci", repository: "fmancini-create/VILLA-I-BARRONCI", branch: "main" },
  { slug: "daynext", name: "DayNext", repository: "fmancini-create/daynext-it", branch: "main" },
  { slug: "dev", name: "DEV", repository: "fmancini-create/DEV", branch: "main" },

  // Repository storici/archiviati: restano visibili e analizzabili dal Control Center.
  { slug: "mypetsenseai-legacy", name: "MyPetSenseAI (archivio)", repository: "fmancini-create/v0-my-pet-sense-ai", branch: "main" },
  { slug: "santaddeo-legacy", name: "Santaddeo (archivio)", repository: "fmancini-create/v0-santaddeo", branch: "SANTADDEO" },
  { slug: "4bid-legacy", name: "4 BID (archivio)", repository: "fmancini-create/v0-4-bid-it", branch: "4bid" },
]

export function getAuditProject(slug: string) {
  return AUDIT_PROJECTS.find((project) => project.slug === slug)
}
