import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { QuoteLineItem, SalesChannelQuote } from "@/lib/quotes/types"
import { isEcosystemOffer, isEcosystemOfferSelected } from "@/lib/quotes/ecosystem"
import { ensureDependentServiceLines } from "@/lib/quotes/dependent-lines"
import ForwardQuoteButton from "../forward-quote-button"
import QuoteView from "./quote-view"
import QuoteCommerceView from "./quote-commerce-view"
import QuoteOneTimeInvestmentDetails from "./quote-one-time-investment-details"
import ReactivationRequest from "./reactivation-request"
import EcosystemInvite from "./ecosystem-invite"
import AnnualDiscountLabelFix from "./annual-discount-label-fix"
import QuoteSalesBadgeHydrator from "./quote-sales-badge-hydrator"
import VirtualQuoteIntro from "./virtual-quote-intro"
import CollapsibleTraditionalQuote from "./collapsible-traditional-quote"

const PREVENTIVO_TITLE = "Il tuo preventivo 4BID"
const PREVENTIVO_DESCRIPTION =
  "La tua proposta commerciale su misura: prodotti, prezzi, omaggi e condizioni. Aprila per configurarla e accettarla online."

export const metadata: Metadata = {
  title: PREVENTIVO_TITLE,
  description: PREVENTIVO_DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: PREVENTIVO_TITLE,
    description: PREVENTIVO_DESCRIPTION,
    type: "website",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [{ url: "/og-preventivo-4bid.png", width: 1024, height: 1024, alt: PREVENTIVO_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: PREVENTIVO_TITLE,
    description: PREVENTIVO_DESCRIPTION,
    images: ["/og-preventivo-4bid.png"],
  },
}

export default async function PreventivoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { token } = await params
  const { preview } = await searchParams
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select(
      "id, quote_number, created_at, title, description, payment_terms, contract_terms, accepted_terms, comparison_tables, line_items, total_amount, deposit_amount, vat_included, currency, presentation_mode, client_name, client_company, client_email, client_vat, client_address, requested_fields, submitted_fields, billing_details, submitted_at, accepted_at, acceptance_name, payment_method, payment_status, status, expires_at, expired_at, paid_at, first_viewed_at, view_count",
    )
    .eq("token", token)
    .maybeSingle<Partial<SalesChannelQuote>>()

  if (error || !data) {
    notFound()
  }

  if (preview !== "1" && data.id) {
    try {
      await supabase
        .from("sales_channel_quotes")
        .update({
          view_count: (data.view_count ?? 0) + 1,
          last_viewed_at: new Date().toISOString(),
          ...(data.first_viewed_at ? {} : { first_viewed_at: new Date().toISOString() }),
        })
        .eq("id", data.id)
    } catch (e) {
      console.error("[v0] quote view tracking error:", e)
    }
  }

  const alreadyPaid = data.payment_status === "paid" || data.status === "paid"
  const expired = alreadyPaid
    ? false
    : Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at) < new Date() : false)
  const lineItems = ensureDependentServiceLines((data.line_items || []) as QuoteLineItem[])
  const accepted = alreadyPaid || data.status === "accepted" || Boolean(data.accepted_at)
  const ecosystemOffers = lineItems.filter(isEcosystemOffer)
  const selectedEcosystemCount = ecosystemOffers.filter(item => isEcosystemOfferSelected(item, accepted)).length
  const visibleLineItems = lineItems.filter(item => !isEcosystemOffer(item) || isEcosystemOfferSelected(item, accepted))
  const displayQuote: Partial<SalesChannelQuote> = { ...data, line_items: visibleLineItems }
  const structuredQuote = visibleLineItems.some((item) =>
    Boolean(item.project || item.features?.length || item.discount || item.trial_days || item.support),
  )
  const quoteView = structuredQuote ? (
    <QuoteCommerceView token={token} quote={displayQuote} expired={expired} />
  ) : (
    <QuoteView token={token} quote={displayQuote} expired={expired} />
  )
  const virtual = data.presentation_mode === "virtual"
  const traditionalQuote = (
    <>
      {quoteView}
      {structuredQuote ? (
        <QuoteOneTimeInvestmentDetails
          items={visibleLineItems}
          currency={data.currency || "eur"}
          accepted={accepted}
        />
      ) : null}
      {!accepted && !expired ? (
        <EcosystemInvite token={token} offersCount={ecosystemOffers.length} selectedCount={selectedEcosystemCount} />
      ) : null}
      {expired && !alreadyPaid && <ReactivationRequest token={token} />}
    </>
  )

  return (
    <>
      <AnnualDiscountLabelFix />
      <QuoteSalesBadgeHydrator items={visibleLineItems} />
      {virtual ? (
        <>
          <VirtualQuoteIntro token={token} clientName={data.client_name} />
          <CollapsibleTraditionalQuote>{traditionalQuote}</CollapsibleTraditionalQuote>
        </>
      ) : traditionalQuote}
      <ForwardQuoteButton token={token} />
    </>
  )
}
