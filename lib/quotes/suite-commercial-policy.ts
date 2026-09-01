import { isQuoteLineSelected, type QuoteLineItem } from "./types"

export const SUITE_PRODUCT_KEYS = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const
export type SuiteProductKey = (typeof SUITE_PRODUCT_KEYS)[number]

export type SuiteCommercialPolicy = {
  enabled: boolean
  discountPercent: number
  allowPromotionStacking: boolean
}

const POLICY_URL = process.env.SUITE_COMMERCIAL_POLICY_URL
  || "https://www.hotelaccelerator.com/api/public/suite-commercial-policy"

const NO_DISCOUNT: SuiteCommercialPolicy = {
  enabled: false,
  discountPercent: 0,
  allowPromotionStacking: false,
}

export async function getSuiteCommercialPolicy(): Promise<SuiteCommercialPolicy> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4_000)
  try {
    const response = await fetch(POLICY_URL, {
      cache: "no-store",
      signal: controller.signal,
      headers: { accept: "application/json" },
    })
    if (!response.ok) return NO_DISCOUNT
    const body = await response.json() as Record<string, unknown>
    const discountPercent = Math.min(100, Math.max(0, Number(body.discountPercent) || 0))
    return {
      enabled: body.enabled === true && discountPercent > 0,
      discountPercent,
      allowPromotionStacking: body.allowPromotionStacking === true,
    }
  } catch {
    // Fail closed: se il Core non risponde, non inventiamo né applichiamo sconti.
    return NO_DISCOUNT
  } finally {
    clearTimeout(timeout)
  }
}

export function selectedSuiteProducts(items: QuoteLineItem[]): Set<SuiteProductKey> {
  const products = new Set<SuiteProductKey>()
  for (const item of items) {
    if (!isQuoteLineSelected(item)) continue
    if (SUITE_PRODUCT_KEYS.includes(item.project as SuiteProductKey)) products.add(item.project as SuiteProductKey)
  }
  return products
}

/**
 * Il vantaggio si applica all'acquisto di un prodotto 4BID diverso da almeno
 * un prodotto già presente nella soluzione del cliente. Se il target è già
 * incluso, non si scontano ulteriormente i suoi moduli.
 */
export function crossSellDiscountForTarget(
  policy: SuiteCommercialPolicy,
  customerProducts: Set<SuiteProductKey>,
  targetProject: string | null | undefined,
) {
  if (!policy.enabled || !targetProject || !SUITE_PRODUCT_KEYS.includes(targetProject as SuiteProductKey)) return 0
  const target = targetProject as SuiteProductKey
  if (customerProducts.has(target)) return 0
  return [...customerProducts].some(product => product !== target) ? policy.discountPercent : 0
}
