import type { QuoteLineItem } from "./types"

export type QuoteBrand = {
  name: string
  short: string
  logo?: string
  mark?: string
  promise: string
}

export const QUOTE_BRANDS: Record<string, QuoteBrand> = {
  hotelaccelerator: {
    name: "HotelAccelerator",
    short: "HA",
    logo: "/hotel-accelerator-logo.jpg",
    promise: "Un unico ecosistema per ridurre passaggi manuali e trasformare più richieste in opportunità gestibili.",
  },
  santaddeo: {
    name: "Santaddeo",
    short: "S",
    logo: "/santaddeo-logo.png",
    promise: "Decisioni tariffarie più rapide e basate sui dati, con più controllo su domanda, prezzi e ricavi.",
  },
  hotelprofitai: {
    name: "HotelProfitAI",
    short: "HP",
    logo: "/hotelprofit-ai-logo.png",
    promise: "Costi, margini e KPI finalmente leggibili: individua dove intervenire prima che il margine si perda.",
  },
  manubot: {
    name: "ManuBot",
    short: "M",
    logo: "/manubot-logo-new.png",
    mark: "/manubot-mark-new.png",
    promise: "Meno chat, fogli e telefonate: porta le attività operative in un flusso tracciabile, condiviso e più semplice da governare.",
  },
  consulting: {
    name: "4BID Consulting",
    short: "4B",
    logo: "/logo.png",
    promise: "Competenze operative e strategiche per trasformare i dati in decisioni e risultati misurabili.",
  },
  custom: {
    name: "4BID",
    short: "4B",
    logo: "/logo.png",
    promise: "Una soluzione costruita intorno alle esigenze reali della tua struttura.",
  },
}

export function quoteBrand(project?: string | null): QuoteBrand {
  return QUOTE_BRANDS[project || "custom"] || QUOTE_BRANDS.custom
}

export function quoteBenefits(item: Pick<QuoteLineItem, "features" | "project">, limit = 3): string[] {
  const features = (item.features || []).map(value => String(value).trim()).filter(Boolean)
  if (features.length) return features.slice(0, limit)
  const brand = quoteBrand(item.project)
  return [brand.promise]
}

export function salesDescription(project: string, current?: string | null): string {
  const clean = String(current || "").trim()
  const promise = quoteBrand(project).promise
  if (!clean) return promise
  if (clean.includes(promise)) return clean
  return `${promise} ${clean}`
}
