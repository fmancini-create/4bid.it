import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { authorizeHotelAccelerator } from "@/lib/quotes/integration-auth"
import { sendQuoteEmail } from "@/lib/quotes/email"
import { parseCopyRecipients, sendQuoteCopies } from "@/lib/quotes/copy-recipients"
import type { SalesChannelQuote } from "@/lib/quotes/types"
import { mergeContractTerms, missingTermsProjects, parseContractTerms, quoteTermsProjects, termsLabel } from "@/lib/quotes/terms"
import { fetchContractTerms } from "@/lib/quotes/terms-fetch"

const SOURCE_SYSTEM = "hotelaccelerator"

function publicUrl(token: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it").replace(/\/$/, "")
  return `${base}/preventivo/${token}`
}

export async function POST(request: NextRequest) {
  const auth = authorizeHotelAccelerator(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null) as Record<string, any> | null
  if (!body?.quote_id) return NextResponse.json({ error: "quote_id obbligatorio" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: quote, error } = await supabase.from("sales_channel_quotes")
    .select("*")
    .eq("id", body.quote_id)
    .eq("source_system", SOURCE_SYSTEM)
    .single<SalesChannelQuote>()
  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (!quote.client_email) return NextResponse.json({ error: "Email cliente mancante" }, { status: 400 })

  const freshTerms = await fetchContractTerms(quoteTermsProjects(quote.line_items))
  const contractTerms = mergeContractTerms(parseContractTerms(quote.contract_terms), freshTerms)
  const missing = missingTermsProjects(quote.line_items || [], contractTerms)
  if (missing.length) {
    return NextResponse.json({
      error: `Condizioni contrattuali non disponibili per ${missing.map(termsLabel).join(", ")}`,
      code: "TERMS_UNAVAILABLE",
    }, { status: 502 })
  }

  const copies = parseCopyRecipients(
    { cc: body.cc ?? quote.copy_cc, bcc: body.bcc ?? quote.copy_bcc },
    quote.client_email,
  )
  if (copies.errors.length) return NextResponse.json({ error: copies.errors[0], errors: copies.errors }, { status: 400 })

  const token = quote.token || randomUUID()
  const link = publicUrl(token)
  const { data: updated, error: updateError } = await supabase.from("sales_channel_quotes")
    .update({
      contract_terms: contractTerms,
      token,
      copy_cc: copies.cc,
      copy_bcc: copies.bcc,
      status: quote.status === "draft" ? "sent" : quote.status,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", quote.id)
    .select("*")
    .single<SalesChannelQuote>()
  if (updateError || !updated) return NextResponse.json({ error: updateError?.message || "Errore aggiornamento" }, { status: 500 })

  const result = await sendQuoteEmail(updated, link, copies.cc)
  if (!result.success) return NextResponse.json({ error: `Invio email fallito: ${result.error}`, public_url: link }, { status: 500 })

  const copyResult = await sendQuoteCopies(updated, copies.cc, copies.bcc)
  if (copyResult.fallite.length) console.error("[ha-quotes] copie non inviate:", copyResult.fallite)

  return NextResponse.json({
    success: true,
    quote_id: updated.id,
    quote_number: updated.quote_number,
    status: updated.status,
    sent_at: updated.sent_at,
    public_url: link,
    copies: { sent: copyResult.inviate, failed: copyResult.fallite },
  })
}
