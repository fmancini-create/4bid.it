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
    promise: "Tutto il tuo hotel in un unico posto: meno lavoro manuale e più richieste trasformate in prenotazioni.",
  },
  santaddeo: {
    name: "Santaddeo",
    short: "S",
    logo: "/santaddeo-logo.png",
    promise: "Prezzi decisi con i dati, non a intuito: più controllo su domanda, ADR e ricavi ogni giorno dell'anno.",
  },
  hotelprofitai: {
    name: "HotelProfitAI",
    short: "HP",
    logo: "/hotelprofit-ai-logo.png",
    promise: "Scopri dove si perde margine prima che sia tardi: costi, margini e KPI finalmente chiari.",
  },
  manubot: {
    name: "ManuBot",
    short: "M",
    logo: "/manubot-logo-new.png",
    mark: "/manubot-mark-new.png",
    promise: "Basta chat, fogli e telefonate: ogni attività in un flusso ordinato, tracciabile e semplice da governare.",
  },
  consulting: {
    name: "4BID Consulting",
    short: "4B",
    logo: "/logo.png",
    promise: "Competenze operative e strategiche che trasformano i tuoi dati in decisioni e risultati misurabili.",
  },
  custom: {
    name: "4BID",
    short: "4B",
    logo: "/logo.png",
    promise: "Una soluzione costruita davvero intorno alle esigenze della tua struttura.",
  },
}

export function quoteBrand(project?: string | null): QuoteBrand {
  return QUOTE_BRANDS[project || "custom"] || QUOTE_BRANDS.custom
}

export type QuoteBrandAccent = {
  // Classi Tailwind STATICHE (letterali): necessarie perche' Tailwind non
  // rileva classi costruite dinamicamente. Ogni software ha un colore proprio
  // per riconoscere a colpo d'occhio a quale prodotto appartiene una voce.
  border: string
  chip: string
  label: string
}

const QUOTE_BRAND_ACCENTS: Record<string, QuoteBrandAccent> = {
  hotelaccelerator: { border: "border-blue-400 bg-blue-50/40", chip: "bg-blue-100 text-blue-800 border border-blue-200", label: "text-blue-700" },
  santaddeo: { border: "border-amber-400 bg-amber-50/40", chip: "bg-amber-100 text-amber-800 border border-amber-200", label: "text-amber-700" },
  hotelprofitai: { border: "border-emerald-400 bg-emerald-50/40", chip: "bg-emerald-100 text-emerald-800 border border-emerald-200", label: "text-emerald-700" },
  manubot: { border: "border-violet-400 bg-violet-50/40", chip: "bg-violet-100 text-violet-800 border border-violet-200", label: "text-violet-700" },
  consulting: { border: "border-slate-300 bg-slate-50/60", chip: "bg-slate-100 text-slate-700 border border-slate-200", label: "text-slate-600" },
  custom: { border: "border-slate-300 bg-slate-50/60", chip: "bg-slate-100 text-slate-700 border border-slate-200", label: "text-slate-600" },
}

export function quoteBrandAccent(project?: string | null): QuoteBrandAccent {
  return QUOTE_BRAND_ACCENTS[project || "custom"] || QUOTE_BRAND_ACCENTS.custom
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
