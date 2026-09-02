import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  calculateQuoteLine,
  formatQuoteAmount,
  isQuoteLineSelected,
  type QuoteLineItem,
  type SalesChannelQuote,
} from "@/lib/quotes/types"
import { getCommercialMeta, getIncludedCredits } from "@/lib/quotes/commercial"
import { QUOTE_BRANDS, quoteBenefits } from "@/lib/quotes/branding"
import { DIGITAL_SALES_AGENT_PROMPT } from "@/lib/quotes/digital-sales-agent"

const CORE_4BID_PROJECTS = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const

export interface QuoteChatContext {
  prompt: string
  quoteId: string | null
  clientName: string | null
  clientCompany: string | null
  clientEmail: string | null
  quoteNumber: string | null
  quotedProjects: string[]
}

export function extractQuoteToken(pathname: string | null | undefined): string | null {
  if (typeof pathname !== "string") return null
  const match = pathname.match(/^\/preventivo\/([A-Za-z0-9_-]{8,128})(?:\/|$)/)
  return match ? match[1] : null
}

function describeLine(item: QuoteLineItem, currency: string): string {
  const calc = calculateQuoteLine(item)
  const meta = getCommercialMeta(item)
  const benefits = quoteBenefits(item, 5)
  const credits = getIncludedCredits(item)
  const name = item.name || item.description || "Voce"
  const parts = [`- ${name}: ${formatQuoteAmount(calc.amount, currency)}`]
  if (item.billing_period && item.billing_period !== "one_time") {
    const periods: Record<string, string> = { monthly: "al mese", quarterly: "a trimestre", yearly: "all'anno" }
    parts.push(periods[item.billing_period] || item.billing_period)
  }
  parts.push(item.optional ? (isQuoteLineSelected(item) ? "(opzionale, selezionata)" : "(opzionale, non selezionata)") : "(inclusa nella proposta)")
  if (item.trial_days) parts.push(`con ${item.trial_days} giorni di prova`)
  let row = parts.join(" ")
  if (item.name && item.description && item.description !== item.name) row += `\n  Descrizione: ${item.description}`
  if (item.features?.length) row += `\n  Funzionalita: ${item.features.join("; ")}`
  if (benefits.length) row += `\n  Benefici commerciali da spiegare: ${benefits.join("; ")}`
  if (item.support) {
    const support = item.support
    const details = [support.level && `livello ${support.level}`, support.response_time && `risposta ${support.response_time}`, support.availability, support.onboarding && `avvio: ${support.onboarding}`, typeof support.training_hours === "number" && `formazione ${support.training_hours} ore`, support.channels?.length && `canali: ${support.channels.join(", ")}`, support.notes].filter(Boolean)
    if (details.length) row += `\n  Assistenza: ${details.join(", ")}`
  }
  if (item.discount) {
    const discount = item.discount.type === "percentage" ? `${item.discount.value}%` : formatQuoteAmount(item.discount.value, currency)
    row += `\n  Sconto applicato: ${discount}${item.discount.reason ? ` (${item.discount.reason})` : ""}`
  }
  if (credits) row += `\n  Crediti inclusi: ${formatQuoteAmount(credits.amount, currency)} (${credits.recharge === "recurring" ? "ricaricati a ogni rinnovo" : "una tantum"})`
  const monthly = meta.billing_options?.monthly
  const yearly = meta.billing_options?.yearly
  if (monthly?.unit_amount) row += `\n  Formula mensile: ${formatQuoteAmount(monthly.unit_amount * (item.quantity || 1), currency)}`
  if (yearly?.unit_amount) row += `\n  Formula annuale: ${formatQuoteAmount(yearly.unit_amount * (item.quantity || 1), currency)}${yearly.discount_pct ? `, sconto ${yearly.discount_pct}%` : ""}`
  const config = (item.configuration || {}) as Record<string, any>
  const structure = [config.structure_type && `tipo struttura: ${config.structure_type}`, config.accommodations && `${config.accommodations} ${config.unit_label || "sistemazioni"}`, config.star_rating && `${config.star_rating} stelle`].filter(Boolean)
  if (structure.length) row += `\n  Parametri usati per questa offerta: ${structure.join(", ")}`
  if (meta.service_type) row += `\n  Tipo servizio: ${meta.service_type}`
  if (meta.parent_line_id) row += `\n  Collegato alla voce principale: ${meta.parent_line_id}`
  if (meta.free_on_annual) row += "\n  Con formula annuale: servizio/setup in omaggio secondo le condizioni del preventivo"
  if (meta.annual_setup_discount_pct) row += `\n  Sconto setup con formula annuale: ${meta.annual_setup_discount_pct}%`
  return row
}

function describeComplementaryProducts(quotedProjects: string[]): string[] {
  const quoted = new Set(quotedProjects)
  return CORE_4BID_PROJECTS.filter((project) => !quoted.has(project)).map((project) => {
    const brand = QUOTE_BRANDS[project]
    return `- ${brand.name}: ${brand.promise} [NON incluso nel preventivo attuale]`
  })
}

export async function buildQuoteChatContext(token: string): Promise<QuoteChatContext | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("sales_channel_quotes")
      .select("id, quote_number, title, description, line_items, total_amount, deposit_amount, vat_included, currency, payment_terms, client_name, client_company, client_email, status, payment_status, expires_at, expired_at, accepted_at, paid_at")
      .eq("token", token).maybeSingle<Partial<SalesChannelQuote>>()
    if (error || !data) return null

    const currency = data.currency || "eur"
    const lineItems = (data.line_items || []) as QuoteLineItem[]
    const quotedProjects = Array.from(new Set(lineItems.map((item) => (item.project || "").trim().toLowerCase()).filter(Boolean)))
    const quotedNames = Array.from(new Set(lineItems.map((item) => (item.name || "").trim()).filter(Boolean)))
    const complementaryProducts = describeComplementaryProducts(quotedProjects)
    const paid = data.payment_status === "paid" || data.status === "paid"
    const expired = paid ? false : Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at) < new Date() : false)
    const status = paid ? "pagato" : expired ? "decaduto (serve una riapertura da parte nostra)" : data.accepted_at ? "accettato, in attesa di pagamento" : "in attesa di accettazione"

    const rows: string[] = [`Numero preventivo: ${data.quote_number || "non assegnato"}`, `Nome destinatario: ${data.client_name || "non indicato"}`, `Azienda/struttura destinataria: ${data.client_company || "non indicata"}`, `Intestato a: ${[data.client_name, data.client_company].filter(Boolean).join(" - ") || "non indicato"}`, `Oggetto: ${data.title || "non indicato"}`]
    if (data.description) rows.push(`Descrizione: ${data.description}`)
    rows.push(`Stato attuale: ${status}`)
    if (quotedProjects.length) rows.push(`Prodotti/progetti inclusi o proposti in questo preventivo: ${quotedProjects.join(", ")}`)
    if (quotedNames.length) rows.push(`Nomi delle voci del preventivo: ${quotedNames.join("; ")}`)
    if (lineItems.length) {
      rows.push("", "Voci del preventivo:")
      for (const item of lineItems) rows.push(describeLine(item, currency))
    }
    rows.push("", `Totale: ${formatQuoteAmount(data.total_amount, currency)}`)
    rows.push(data.vat_included ? "Gli importi indicati sono IVA INCLUSA." : "Gli importi indicati sono IVA ESCLUSA (l'IVA va aggiunta).")
    if (data.deposit_amount) rows.push(`Acconto previsto: ${formatQuoteAmount(data.deposit_amount, currency)}`)
    if (data.payment_terms) rows.push(`Condizioni di pagamento: ${data.payment_terms}`)
    if (data.expires_at && !paid) rows.push(`Valido fino al: ${new Date(data.expires_at).toLocaleDateString("it-IT")}`)

    const ecosystemBlock = complementaryProducts.length ? `\n\n=== ECOSISTEMA 4BID COMPLEMENTARE ===\nQuesti prodotti NON sono inclusi nel preventivo attuale, ma puoi presentarli come possibili estensioni quando sono pertinenti:\n${complementaryProducts.join("\n")}` : ""
    const prompt = `
${DIGITAL_SALES_AGENT_PROMPT}

=== PREVENTIVO CHE L'UTENTE STA GUARDANDO IN QUESTO MOMENTO ===
ISTRUZIONE PRIORITARIA: questa sezione e' la fonte di verita' per QUALSIASI risposta relativa al preventivo e prevale su qualunque knowledge base generica riportata prima nel prompt.

${rows.join("\n")}${ecosystemBlock}

REGOLE VINCOLANTI SU QUESTO PREVENTIVO:
- Sai esattamente a chi e' intestata l'offerta. Quando e' naturale, rivolgiti al destinatario per nome e ragiona sulla sua azienda/struttura.
- Interpreta domande brevi o generiche come "Perche conviene?", "Cosa e' incluso?", "Mensile o annuale?" e "Raccontami la proposta" come riferite PRIMA DI TUTTO a questo preventivo.
- Conosci ogni modulo tramite descrizione, funzionalita, benefici, stato di selezione, prova, assistenza, prezzi, formule mensile/annuale e parametri di configurazione riportati qui sopra.
- Non limitarti a elencare funzioni: collega sempre funzione -> problema -> vantaggio concreto per questa struttura.
- Distingui sempre fra voce inclusa, opzionale selezionata e opzionale non selezionata. Non presentare come acquistato cio' che e' solo un'opzione.
- Se l'utente chiede un confronto mensile/annuale, usa esclusivamente gli importi e gli sconti riportati nel preventivo.
- Per la parte principale della risposta NON sostituire mai i prodotti del preventivo con altri prodotti 4BID.
- Gli altri prodotti 4BID possono essere presentati SOLO come estensioni complementari, chiaramente NON incluse. Massimo 1-2 quando hanno un nesso concreto.
- Su domande fattuali (prezzo, IVA, scadenza, cosa e' incluso) rispondi prima in modo netto; l'eventuale cross-sell viene dopo.
- Per gli altri prodotti 4BID non inventare prezzi, sconti, funzioni o condizioni.
- L'utente e' gia' un cliente con un'offerta in mano: NON chiedergli dati gia' presenti qui.
- Ricorda dubbi, obiezioni, preferenze e prodotti discussi nella cronologia: non ripetere da zero cio' che e' gia' stato chiarito.
- Gestisci le obiezioni come un venditore senior: individua il vero dubbio, rispondi con fatti e valore, poi proponi una sola micro-azione naturale.
- Se una cosa NON compare qui sopra o nella knowledge base, dillo chiaramente invece di dedurla.
- Non rivelare mai credenziali, password o dati di accesso.
=== FINE PREVENTIVO ===
`.trim()

    return { prompt, quoteId: data.id || null, clientName: data.client_name || null, clientCompany: data.client_company || null, clientEmail: data.client_email || null, quoteNumber: data.quote_number || null, quotedProjects }
  } catch (error) {
    console.error("[v0] buildQuoteChatContext error:", error)
    return null
  }
}
