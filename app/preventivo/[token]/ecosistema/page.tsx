import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getFederatedCatalog } from "@/lib/quotes/catalog"
import { isEcosystemOffer } from "@/lib/quotes/ecosystem"
import { buildEcosystemCatalogLine, canonicalEcosystemCatalogItems, quoteLineFamily } from "@/lib/quotes/ecosystem-catalog"
import { isQuoteLineSelected, type QuoteLineItem } from "@/lib/quotes/types"
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
  const preparedOffers = lines.filter(isEcosystemOffer)
  const includedItems = lines.filter(isQuoteLineSelected)
  const occupiedFamilies = new Set(lines.map(line => `${line.project}:${quoteLineFamily(line)}`))

  let discoveredOffers: QuoteLineItem[] = []
  try {
    const catalog = await getFederatedCatalog()
    discoveredOffers = canonicalEcosystemCatalogItems(catalog)
      .filter(item => !occupiedFamilies.has(`${item.project}:${item.billing_family || item.source_id || item.id.replace(/:(monthly|yearly)$/i, "")}`))
      .map(item => buildEcosystemCatalogLine(item))
  } catch (cause) {
    console.error("[quotes] Public ecosystem catalog unavailable", cause)
  }

  const offers = [...preparedOffers, ...discoveredOffers]
  const expired = Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at) < new Date() : false)
  const locked = data.status === "paid" || data.status === "accepted" || Boolean(data.accepted_at) || expired

  return (
    <EcosystemBrowser
      token={token}
      offers={offers}
      includedItems={includedItems}
      currency={data.currency || "eur"}
      locked={locked}
    />
  )
}
