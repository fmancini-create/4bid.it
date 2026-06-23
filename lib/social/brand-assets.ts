/**
 * Resolver di immagini per i post social.
 *
 * REGOLA FONDAMENTALE: i post NON devono mai usare immagini generate dall'AI
 * (in passato il modello, vedendo "Santaddeo" -> "Santa", generava Babbo Natale).
 * Si usano SEMPRE gli asset reali presenti in public/ (loghi / og-image ufficiali).
 *
 * In base al link della campagna o al testo del topic si sceglie il brand giusto.
 */

export type BrandKey =
  | "santaddeo"
  | "hotelprofitai"
  | "manubot"
  | "hotelaccelerator"
  | "mypetsenseai"
  | "ecomobility"
  | "autoexel"
  | "risparmio"
  | "4bid"

type BrandAsset = {
  key: BrandKey
  /** path pubblico dell'asset reale (servito da public/) */
  asset: string
  /** parole chiave nel topic/notes che indicano questo brand */
  keywords: string[]
  /** frammenti di dominio nel link_url che indicano questo brand */
  domains: string[]
}

// Ordine: i brand di prodotto vanno PRIMA del default "4bid" (holding).
const BRANDS: BrandAsset[] = [
  {
    key: "santaddeo",
    asset: "/santaddeo-logo.png",
    keywords: ["santaddeo", "sant'addeo", "sant addeo"],
    domains: ["santaddeo.com", "santaddeo"],
  },
  {
    key: "hotelprofitai",
    asset: "/hotelprofit-ai-logo.png",
    keywords: ["hotelprofit", "hotel profit", "hotelprofitai"],
    domains: ["hotelprofitai.com", "hotelprofit"],
  },
  {
    key: "manubot",
    asset: "/manubot-logo.jpg",
    keywords: ["manubot", "governante", "housekeeping", "manutenzion"],
    domains: ["manubot.it", "manubot"],
  },
  {
    key: "hotelaccelerator",
    asset: "/hotel-accelerator-logo.jpg",
    keywords: ["hotelaccelerator", "hotel accelerator", "accelerator"],
    domains: ["hotelaccelerator.com", "hotelaccelerator"],
  },
  {
    key: "mypetsenseai",
    asset: "/mypetsenseai-logo.png",
    keywords: ["mypetsense", "pet sense", "petsense", "mypetsenseai", "animali domestici"],
    domains: ["mypetsenseai.com", "mypetsense", "petsense"],
  },
  {
    key: "ecomobility",
    asset: "/ecomobility-logo.png",
    keywords: ["ecomobility", "eco mobility", "ricarica", "colonnine", "charging", "mobilità elettrica"],
    domains: ["ecomobility"],
  },
  {
    key: "autoexel",
    asset: "/autoexel-logo.png",
    keywords: ["autoexel", "auto exel"],
    domains: ["autoexel"],
  },
  {
    key: "risparmio",
    asset: "/risparmio-compulsivo-logo.png",
    keywords: ["risparmio compulsivo", "risparmio"],
    domains: ["risparmiocompulsivo", "risparmio-compulsivo"],
  },
  {
    key: "4bid",
    asset: "/og-image-4bid.jpg",
    keywords: ["4bid", "4 bid"],
    domains: ["4bid.it", "4bid"],
  },
]

const DEFAULT_BRAND = BRANDS.find((b) => b.key === "4bid")!

function siteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.4bid.it"
  return raw.replace(/\/+$/, "")
}

/** Trasforma un path pubblico (/foo.png) in URL assoluto, richiesto da Facebook/LinkedIn. */
export function toAbsoluteAssetUrl(assetPath: string): string {
  if (/^https?:\/\//i.test(assetPath)) return assetPath
  return `${siteBaseUrl()}${assetPath.startsWith("/") ? "" : "/"}${assetPath}`
}

/**
 * Sceglie il brand in base a link_url (priorità) e poi al testo di topic/notes.
 * Default: 4bid (holding) se nulla corrisponde.
 */
export function resolveBrand(input: {
  linkUrl?: string | null
  topic?: string | null
  notes?: string | null
}): BrandAsset {
  const link = (input.linkUrl || "").toLowerCase()
  if (link) {
    for (const b of BRANDS) {
      if (b.domains.some((d) => link.includes(d))) return b
    }
  }
  const haystack = `${input.topic || ""} ${input.notes || ""}`.toLowerCase()
  if (haystack.trim()) {
    for (const b of BRANDS) {
      if (b.keywords.some((k) => haystack.includes(k))) return b
    }
  }
  return DEFAULT_BRAND
}

/**
 * Ritorna l'URL ASSOLUTO dell'asset reale (logo/og-image) da usare nel post.
 * Mai un'immagine AI. Mai un'immagine inventata.
 */
export function resolveBrandImageUrl(input: {
  linkUrl?: string | null
  topic?: string | null
  notes?: string | null
}): string {
  const brand = resolveBrand(input)
  return toAbsoluteAssetUrl(brand.asset)
}
