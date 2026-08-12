import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { SalesChannelQuote } from "@/lib/quotes/types"
import ForwardQuoteButton from "../../forward-quote-button"
import SharedQuoteReadOnlyView from "./shared-quote-read-only-view"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Preventivo condiviso 4BID",
  description: "Copia personale in sola consultazione di un preventivo 4BID.",
  robots: { index: false, follow: false },
}

export default async function SharedQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: share, error: shareError } = await supabase
    .from("sales_channel_quote_shares")
    .select("id, quote_id, recipient_email, first_viewed_at, view_count")
    .eq("token", token)
    .maybeSingle<{
      id: string
      quote_id: string
      recipient_email: string
      first_viewed_at: string | null
      view_count: number
    }>()

  if (shareError || !share) {
    if (shareError) console.error("[shared-quote] share lookup failed", shareError)
    notFound()
  }

  const { data: quote, error: quoteError } = await supabase
    .from("sales_channel_quotes")
    .select(
      "id, quote_number, created_at, title, description, payment_terms, contract_terms, comparison_tables, line_items, total_amount, deposit_amount, vat_included, currency, client_name, client_company, client_vat, client_address, status, payment_status, expires_at, expired_at",
    )
    .eq("id", share.quote_id)
    .maybeSingle<Partial<SalesChannelQuote>>()

  if (quoteError || !quote) {
    if (quoteError) console.error("[shared-quote] quote lookup failed", quoteError)
    notFound()
  }

  const alreadyPaid = quote.status === "paid" || quote.payment_status === "paid"
  const expired = alreadyPaid
    ? false
    : Boolean(quote.expired_at) || (quote.expires_at ? new Date(quote.expires_at) < new Date() : false)

  try {
    const now = new Date().toISOString()
    const requestHeaders = await headers()
    await supabase
      .from("sales_channel_quote_shares")
      .update({
        first_viewed_at: share.first_viewed_at || now,
        last_viewed_at: now,
        view_count: (share.view_count || 0) + 1,
        updated_at: now,
      })
      .eq("id", share.id)

    await supabase.from("sales_channel_quote_share_events").insert({
      share_id: share.id,
      quote_id: share.quote_id,
      event_type: "page_viewed",
      recipient_email: share.recipient_email,
      metadata: {
        user_agent: requestHeaders.get("user-agent") || null,
      },
    })
  } catch (error) {
    console.error("[shared-quote] view tracking failed", error)
  }

  return (
    <>
      <SharedQuoteReadOnlyView quote={quote} recipientEmail={share.recipient_email} expired={expired} />
      <ForwardQuoteButton token={token} />
    </>
  )
}
