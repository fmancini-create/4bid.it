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

  // La sessione va verificata QUI: `proxy.ts` protegge le pagine /admin ma non
  // le rotte /api. Senza questo controllo, chiunque conoscesse l'id di un
  // preventivo potrebbe farselo spedire indicando il proprio indirizzo fra i
  // destinatari in copia, allegato PDF compreso.
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

  // Prima della partenza le condizioni vengono riallineate ai progetti inclusi.
  // Se un progetto non ne ha nessuna (ne' fresca ne' gia' copiata) l'invio si
  // ferma: il cliente si troverebbe una casella che dichiara di aver letto
  // condizioni che non esistono a schermo.
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

  // Destinatari in copia. Se l'operatore non li indica nella richiesta si
  // riusano quelli gia' salvati sul preventivo, cosi' un secondo invio non
  // perde silenziosamente i collaboratori impostati la prima volta.
  const body = await request.json().catch(() => ({}))
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
    .select()
    .single<SalesChannelQuote>()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Errore aggiornamento" }, { status: 500 })
  }

  const result = await sendQuoteEmail(updated, link, copie.cc)
  if (!result.success) {
    return NextResponse.json({ error: `Invio email fallito: ${result.error}`, link }, { status: 500 })
  }

  // Le copie partono DOPO l'email al cliente e non possono farla fallire: se
  // un indirizzo di un collaboratore e' sbagliato, il preventivo resta inviato
  // e a schermo compare comunque l'avviso di cosa non e' partito.
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
