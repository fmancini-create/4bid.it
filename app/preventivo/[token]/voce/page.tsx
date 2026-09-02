import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { QuoteLineItem, SalesChannelQuote } from "@/lib/quotes/types"
import VoiceQuoteDemo from "./voice-quote-demo"

export const metadata = {
  title: "Anteprima assistente vocale preventivo | 4BID",
  robots: { index: false, follow: false },
}

export default async function QuoteVoicePreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("quote_number, title, description, line_items, total_amount, vat_included, currency, client_name, client_company, expires_at")
    .eq("token", token)
    .maybeSingle<Partial<SalesChannelQuote>>()

  if (error || !data) notFound()

  return (
    <VoiceQuoteDemo
      token={token}
      quoteNumber={data.quote_number || null}
      title={data.title || "La tua proposta 4BID"}
      description={data.description || null}
      clientName={data.client_name || null}
      clientCompany={data.client_company || null}
      lineItems={(data.line_items || []) as QuoteLineItem[]}
    />
  )
}
