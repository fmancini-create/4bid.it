import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getFederatedCatalog } from "@/lib/quotes/catalog"
import { isEcosystemOffer, markEcosystemOffer } from "@/lib/quotes/ecosystem"
import { buildEcosystemCatalogLine, canonicalEcosystemCatalogItems, quoteLineFamily } from "@/lib/quotes/ecosystem-catalog"
import { isQuoteLineSelected, type QuoteLineItem } from "@/lib/quotes/types"
import {
  crossSellDiscountForTarget,
  getSuiteCommercialPolicy,
  selectedSuiteProducts,
} from "@/lib/quotes/suite-commercial-policy"
import EcosystemBrowser from "./ecosystem-browser"

export const metadata: Metadata = {
  title: "Amplia il preventivo · Ecosistema 4BID",
  robots: { index: false, follow: false },
}

export default async function QuoteEcosystemPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("status,accepted_at,expires_at,expired_at,currency,line_items")
    .eq("token", token)
    .maybeSingle()

  if (error || !data) notFound()

  const lines = Array.isArray(data.line_items) ? data.line_items as QuoteLineItem[] : []
  const includedItems = lines.filter(isQuoteLineSelected)
  const customerProducts = selectedSuiteProducts(includedItems)
  const policy = await getSuiteCommercialPolicy()
  const preparedOffers = lines
    .filter(isEcosystemOffer)
    .map(line => markEcosystemOffer(
      line,
      crossSellDiscountForTarget(policy, customerProducts, line.project),
    ))
  const occupiedFamilies = new Set(lines.map(line => `${line.project}:${quoteLineFamily(line)}`))

  let discoveredOffers: QuoteLineItem[] = []
  try {
    const catalog = await getFederatedCatalog()
    discoveredOffers = canonicalEcosystemCatalogItems(catalog)
      .filter(item => !occupiedFamilies.has(`${item.project}:${item.billing_family || item.source_id || item.id.replace(/:(monthly|yearly)$/i, "")}`))
      .map(item => buildEcosystemCatalogLine(
        item,
        undefined,
        crossSellDiscountForTarget(policy, customerProducts, item.project),
      ))
  } catch (cause) {
    console.error("[quotes] Public ecosystem catalog unavailable", cause)
  }

  const offers = [...preparedOffers, ...discoveredOffers]
  const expired = Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at) < new Date() : false)
  const locked = data.status === "paid" || data.status === "accepted" || Boolean(data.accepted_at) || expired

  return (
    <>
      {policy.enabled ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-950">
          <strong>Vantaggio cliente 4BID · -{policy.discountPercent}%</strong>{" "}
          {customerProducts.size > 0
            ? "su un nuovo prodotto 4BID diverso da quelli già presenti nella tua soluzione. Il vantaggio è già applicato ai prezzi idonei qui sotto."
            : "sul prossimo prodotto per chi è già cliente di almeno una piattaforma 4BID. La regola è unica per Santaddeo, HotelAccelerator, HotelProfitAI e ManuBot."}
        </div>
      ) : null}
      <EcosystemBrowser
        token={token}
        offers={offers}
        includedItems={includedItems}
        currency={data.currency || "eur"}
        locked={locked}
      />
    </>
  )
}
