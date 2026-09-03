import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { randomUUID } from "crypto"
import { sendQuoteEmail } from "@/lib/quotes/email"
import { parseCopyRecipients, sendQuoteCopies } from "@/lib/quotes/copy-recipients"
import type { SalesChannelQuote } from "@/lib/quotes/types"
import { mergeContractTerms, missingTermsProjects, parseContractTerms, quoteTermsProjects, termsLabel } from "@/lib/quotes/terms"
import { fetchContractTerms } from "@/lib/quotes/terms-fetch"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Accesso riservato: effettua l'accesso." }, { status: 401 })

  const supabase = createAdminClient()

  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("id", id)
    .single<SalesChannelQuote>()

  if (error || !quote) {
    return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  }
  if (!quote.client_email) {
    return NextResponse.json({ error: "Email cliente mancante: impostala prima di inviare" }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const requestedRecipient =
    body && typeof body === "object" && typeof (body as any).client_email === "string"
      ? (body as any).client_email.trim().toLowerCase()
      : ""
  const savedRecipient = quote.client_email.trim().toLowerCase()

  // Blocco di sicurezza: il destinatario mostrato all'operatore deve coincidere
  // con quello realmente salvato nel DB al momento dell'invio. Se la pagina ha
  // dati obsoleti o un salvataggio non e' ancora arrivato, NON spediamo nulla.
  if (!requestedRecipient || requestedRecipient !== savedRecipient) {
    return NextResponse.json(
      {
        error: `Invio bloccato: il destinatario visualizzato non coincide con quello salvato. Ricarica il preventivo e verifica l'email prima di inviare.`,
        code: "RECIPIENT_MISMATCH",
      },
      { status: 409 },
    )
  }

  const freshTerms = await fetchContractTerms(quoteTermsProjects(quote.line_items))
  const contractTerms = mergeContractTerms(parseContractTerms(quote.contract_terms), freshTerms)
  const missing = missingTermsProjects(quote.line_items || [], contractTerms)
  if (missing.length) {
    const dettaglio = contractTerms.failures.map(f => `${f.label}: ${f.error}`).join("; ")
    return NextResponse.json({
      error: `Condizioni contrattuali non disponibili per ${missing.map(termsLabel).join(", ")}. Riprova fra poco o rimuovi i prodotti di quel progetto.`,
      detail: dettaglio || null,
      code: "TERMS_UNAVAILABLE",
    }, { status: 502 })
  }

  const richiesteCopie = body && typeof body === "object" && ("cc" in body || "bcc" in body)
  const copie = parseCopyRecipients(
    richiesteCopie ? { cc: (body as any).cc, bcc: (body as any).bcc } : { cc: quote.copy_cc, bcc: quote.copy_bcc },
    quote.client_email,
  )
  if (copie.errors.length) {
    return NextResponse.json({ error: copie.errors[0], errors: copie.errors }, { status: 400 })
  }

  const token = quote.token || randomUUID()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const link = `${baseUrl}/preventivo/${token}`

  const { data: updated, error: updateError } = await supabase
    .from("sales_channel_quotes")
    .update({
      contract_terms: contractTerms,
      token,
      copy_cc: copie.cc,
      copy_bcc: copie.bcc,
      status: quote.status === "draft" ? "sent" : quote.status,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("client_email", quote.client_email)
    .select()
    .single<SalesChannelQuote>()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Errore aggiornamento" }, { status: 500 })
  }

  const result = await sendQuoteEmail(updated, link, copie.cc)
  if (!result.success) {
    return NextResponse.json({ error: `Invio email fallito: ${result.error}`, link }, { status: 500 })
  }

  const esitoCopie = await sendQuoteCopies(updated, copie.cc, copie.bcc)
  if (esitoCopie.fallite.length) {
    console.error("[quotes] copie non inviate:", esitoCopie.fallite)
  }

  return NextResponse.json({
    success: true,
    link,
    copies: { sent: esitoCopie.inviate, failed: esitoCopie.fallite },
  })
}
