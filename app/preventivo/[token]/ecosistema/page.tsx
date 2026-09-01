import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { isEcosystemOffer } from "@/lib/quotes/ecosystem"
import type { QuoteLineItem } from "@/lib/quotes/types"
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

  const offers = (Array.isArray(data.line_items) ? data.line_items as QuoteLineItem[] : []).filter(isEcosystemOffer)
  const expired = Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at) < new Date() : false)
  const locked = data.status === "paid" || data.status === "accepted" || Boolean(data.accepted_at) || expired

  return <EcosystemBrowser token={token} offers={offers} currency={data.currency || "eur"} locked={locked} />
}
