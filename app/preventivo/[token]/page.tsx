import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { SalesChannelQuote } from "@/lib/quotes/types"
import QuoteView from "./quote-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Preventivo 4BID",
  robots: { index: false, follow: false },
}

export default async function PreventivoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select(
      "id, quote_number, created_at, title, description, payment_terms, line_items, total_amount, deposit_amount, vat_included, currency, client_name, client_company, client_vat, client_address, requested_fields, submitted_fields, billing_details, submitted_at, accepted_at, acceptance_name, payment_method, payment_status, status, expires_at",
    )
    .eq("token", token)
    .maybeSingle<Partial<SalesChannelQuote>>()

  if (error || !data) {
    notFound()
  }

  const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false

  return (
    <QuoteView token={token} quote={data} expired={expired} />
  )
}
