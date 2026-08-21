import type { AuditProject } from "./types"

export const AUDIT_PROJECTS: AuditProject[] = [
  { slug: "hotel-accelerator", name: "Hotel Accelerator", repository: "fmancini-create/HotelAccelerator", branch: "main" },
  { slug: "manubot", name: "ManuBot", repository: "fmancini-create/v0-manu-bot", branch: "main" },
  { slug: "santaddeo", name: "Santaddeo", repository: "fmancini-create/santaddeo-V1", branch: "main" },
  { slug: "hotel-profit-ai", name: "Hotel Profit AI", repository: "fmancini-create/v0-hotel-profit-ai", branch: "main" },
  { slug: "4bid", name: "4 BID", repository: "fmancini-create/4bid.it", branch: "4bid", productUrl: "https://4bid.it" },
]

export function getAuditProject(slug: string) {
  return AUDIT_PROJECTS.find((project) => project.slug === slug)
}

