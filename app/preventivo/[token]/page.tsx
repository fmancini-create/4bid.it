import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { QuoteLineItem, SalesChannelQuote } from "@/lib/quotes/types"
import QuoteView from "./quote-view"
import QuoteCommerceView from "./quote-commerce-view"
import type { Metadata } from "next"

const PREVENTIVO_TITLE = "Il tuo preventivo 4BID"
const PREVENTIVO_DESCRIPTION =
  "La tua proposta commerciale su misura: prodotti, prezzi, omaggi e condizioni. Aprila per configurarla e accettarla online."

export const metadata: Metadata = {
  title: PREVENTIVO_TITLE,
  description: PREVENTIVO_DESCRIPTION,
  robots: { index: false, follow: false },
  // OG dedicato al preventivo: cosi' su WhatsApp/social il titolo dice "il tuo
  // preventivo" invece del claim generico ereditato dal layout, e l'immagine ha
  // un URL nuovo (WhatsApp la riscarica da zero invece di riusare quella vecchia
  // in cache, che appariva ruotata).
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
      "id, quote_number, created_at, title, description, payment_terms, contract_terms, accepted_terms, comparison_tables, line_items, total_amount, deposit_amount, vat_included, currency, client_name, client_company, client_email, client_vat, client_address, requested_fields, submitted_fields, billing_details, submitted_at, accepted_at, acceptance_name, payment_method, payment_status, status, expires_at, expired_at, paid_at, first_viewed_at, view_count",
    )
    .eq("token", token)
    .maybeSingle<Partial<SalesChannelQuote>>()

  if (error || !data) {
    notFound()
  }

  // Registra l'apertura reale del cliente (non l'anteprima admin ?preview=1).
  // Best-effort: un errore di tracciamento non deve impedire la visualizzazione.
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

  // Decaduta se la scadenza e' passata oppure se un admin/il cron l'ha
  // dichiarata tale. Un preventivo gia' PAGATO non e' mai "scaduto": la
  // scadenza riguarda l'offerta, non il servizio acquistato, e mostrare
  // "scaduto" a chi ha pagato sarebbe falso.
  const alreadyPaid = data.payment_status === "paid" || data.status === "paid"
  const expired = alreadyPaid
    ? false
    : Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at) < new Date() : false)
  const lineItems = (data.line_items || []) as QuoteLineItem[]
  const structuredQuote = lineItems.some((item) =>
    Boolean(item.project || item.features?.length || item.discount || item.trial_days || item.support),
  )

  return structuredQuote ? (
    <QuoteCommerceView token={token} quote={data} expired={expired} />
  ) : (
    <QuoteView token={token} quote={data} expired={expired} />
  )
}
