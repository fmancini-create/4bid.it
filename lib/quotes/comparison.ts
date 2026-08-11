import type { QuoteProject, QuoteLineItem } from "./types"

/** I 4 prodotti che possono avere una tabella comparativa. */
export type ComparisonProduct = "santaddeo" | "manubot" | "hotelprofitai" | "hotelaccelerator"

export const COMPARISON_PRODUCTS: ComparisonProduct[] = ["santaddeo", "manubot", "hotelprofitai", "hotelaccelerator"]

export const COMPARISON_PRODUCT_LABELS: Record<ComparisonProduct, string> = {
  santaddeo: "Santaddeo",
  manubot: "ManuBot",
  hotelprofitai: "HotelProfitAI",
  hotelaccelerator: "HotelAccelerator",
}

/** Valore di cella che va reso come spunta (invece che come testo). */
export const CHECK_VALUE = "check"

export function isCheckValue(value: string | undefined | null): boolean {
  return String(value ?? "").trim().toLowerCase() === CHECK_VALUE
}

export interface ComparisonColumn {
  /** Chiave stabile usata nelle celle delle righe. */
  key: string
  /** Intestazione mostrata al cliente. */
  label: string
  /** La colonna del nostro prodotto: evidenziata. */
  highlight?: boolean
}

export interface ComparisonRow {
  label: string
  /** Mappa chiave-colonna -> valore ("check" per la spunta, altrimenti testo). */
  cells: Record<string, string>
}

/** Tabella "master" gestita in admin (una per prodotto). */
export interface ProductComparisonTable {
  product: ComparisonProduct
  title: string
  headers: ComparisonColumn[]
  rows: ComparisonRow[]
  footer_note: string
  source_url?: string | null
  enabled?: boolean
  updated_at?: string | null
}

/** Snapshot salvato nel singolo preventivo (copia editabile della master). */
export interface QuoteComparisonTable {
  product: ComparisonProduct
  title: string
  headers: ComparisonColumn[]
  rows: ComparisonRow[]
  footer_note: string
  /** Se true la tabella viene mostrata al cliente in questo preventivo. */
  enabled: boolean
}

function normalizeColumns(input: unknown): ComparisonColumn[] {
  if (!Array.isArray(input)) return []
  return input
    .map((c: any) => ({
      key: String(c?.key ?? "").trim(),
      label: String(c?.label ?? "").trim(),
      highlight: !!c?.highlight,
    }))
    .filter((c) => c.key)
}

function normalizeRows(input: unknown): ComparisonRow[] {
  if (!Array.isArray(input)) return []
  return input.map((r: any) => {
    const cells: Record<string, string> = {}
    if (r?.cells && typeof r.cells === "object") {
      for (const [k, v] of Object.entries(r.cells)) cells[String(k)] = String(v ?? "")
    }
    return { label: String(r?.label ?? "").trim(), cells }
  })
}

/** Normalizza una master proveniente dal DB o da un endpoint prodotto. */
export function normalizeMasterTable(product: ComparisonProduct, raw: any): ProductComparisonTable {
  return {
    product,
    title: String(raw?.title ?? "").trim(),
    headers: normalizeColumns(raw?.headers),
    rows: normalizeRows(raw?.rows),
    footer_note: String(raw?.footer_note ?? raw?.footerNote ?? "").trim(),
    source_url: raw?.source_url ?? raw?.sourceUrl ?? null,
    enabled: raw?.enabled !== false,
    updated_at: raw?.updated_at ?? null,
  }
}

/** Crea lo snapshot per il preventivo a partire dalla master. */
export function masterToQuoteTable(master: ProductComparisonTable, enabled = true): QuoteComparisonTable {
  return {
    product: master.product,
    title: master.title,
    headers: master.headers,
    rows: master.rows,
    footer_note: master.footer_note,
    enabled,
  }
}

/** Normalizza lo snapshot salvato nel preventivo (difensivo verso dati vecchi/rotti). */
export function normalizeQuoteTables(input: unknown): QuoteComparisonTable[] {
  if (!Array.isArray(input)) return []
  const out: QuoteComparisonTable[] = []
  for (const t of input as any[]) {
    const product = String(t?.product ?? "") as ComparisonProduct
    if (!COMPARISON_PRODUCTS.includes(product)) continue
    out.push({
      product,
      title: String(t?.title ?? "").trim(),
      headers: normalizeColumns(t?.headers),
      rows: normalizeRows(t?.rows),
      footer_note: String(t?.footer_note ?? "").trim(),
      enabled: t?.enabled !== false,
    })
  }
  return out
}

/** Prodotti (fra i 4 con tabella) effettivamente presenti tra le voci del preventivo. */
export function productsInQuote(lineItems: QuoteLineItem[] | undefined | null): ComparisonProduct[] {
  const found = new Set<ComparisonProduct>()
  for (const item of lineItems ?? []) {
    const p = item?.project as QuoteProject | undefined
    if (p && COMPARISON_PRODUCTS.includes(p as ComparisonProduct)) found.add(p as ComparisonProduct)
  }
  return COMPARISON_PRODUCTS.filter((p) => found.has(p))
}
