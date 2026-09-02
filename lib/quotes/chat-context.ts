import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  calculateQuoteLine,
  formatQuoteAmount,
  isQuoteLineSelected,
  type QuoteLineItem,
  type SalesChannelQuote,
} from "@/lib/quotes/types"

export interface QuoteChatContext {
  /** Testo da aggiungere al prompt: descrive l'offerta al posto di "non ho informazioni". */
  prompt: string
  /** Intestatario del preventivo: serve a NON richiedere dati che abbiamo gia'. */
  clientName: string | null
  clientEmail: string | null
  quoteNumber: string | null
}

/**
 * Estrae il token da un percorso tipo `/preventivo/<token>`.
 *
 * Il percorso arriva dal client, quindi non e' una prova d'identita': il token
 * e' pero' la stessa credenziale che apre la pagina, per cui chi lo possiede
 * vede gia' il preventivo. Non si concede nulla in piu' di quanto sia gia'
 * visibile a schermo.
 */
export function extractQuoteToken(pathname: string | null | undefined): string | null {
  if (typeof pathname !== "string") return null
  const match = pathname.match(/^\/preventivo\/([A-Za-z0-9_-]{8,128})(?:\/|$)/)
  return match ? match[1] : null
}

function describeLine(item: QuoteLineItem, currency: string): string {
  const calc = calculateQuoteLine(item)
  const nome = item.name || item.description || "Voce"
  const parti = [`- ${nome}: ${formatQuoteAmount(calc.amount, currency)}`]

  if (item.billing_period && item.billing_period !== "one_time") {
    const periodi: Record<string, string> = {
      monthly: "al mese",
      quarterly: "a trimestre",
      yearly: "all'anno",
    }
    parti.push(periodi[item.billing_period] || item.billing_period)
  }
  if (item.optional) parti.push(isQuoteLineSelected(item) ? "(opzionale, inclusa)" : "(opzionale, esclusa)")
  if (item.trial_days) parti.push(`con ${item.trial_days} giorni di prova`)

  let riga = parti.join(" ")

  if (item.name && item.description && item.description !== item.name) {
    riga += `\n  Descrizione: ${item.description}`
  }
  if (item.features?.length) {
    riga += `\n  Comprende: ${item.features.join("; ")}`
  }
  if (item.support) {
    const s = item.support
    const dettagli = [
      s.level && `livello ${s.level}`,
      s.response_time && `risposta ${s.response_time}`,
      s.availability,
      s.onboarding && `avvio: ${s.onboarding}`,
      typeof s.training_hours === "number" && `formazione ${s.training_hours} ore`,
      s.channels?.length && `canali: ${s.channels.join(", ")}`,
    ].filter(Boolean)
    if (dettagli.length) riga += `\n  Assistenza: ${dettagli.join(", ")}`
  }
  if (item.discount) {
    const sconto =
      item.discount.type === "percentage"
        ? `${item.discount.value}%`
        : formatQuoteAmount(item.discount.value, currency)
    riga += `\n  Sconto applicato: ${sconto}${item.discount.reason ? ` (${item.discount.reason})` : ""}`
  }

  return riga
}

/**
 * Costruisce il contesto del preventivo per la chat.
 *
 * ATTENZIONE — cosa NON viene letto, di proposito:
 * `submitted_fields` contiene le credenziali che il cliente ci consegna
 * (vedi `decodeCredential` in lib/quotes/types.ts: id + password in chiaro).
 * Finirebbero nel prompt del modello e, da li', in una risposta in chat.
 * Anche `requested_fields` resta fuori: descrive quali credenziali chiediamo.
 * Qui si leggono SOLO i dati commerciali gia' visibili nella pagina.
 */
export async function buildQuoteChatContext(token: string): Promise<QuoteChatContext | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("sales_channel_quotes")
      .select(
        "quote_number, title, description, line_items, total_amount, deposit_amount, vat_included, currency, payment_terms, client_name, client_company, client_email, status, payment_status, expires_at, expired_at, accepted_at, paid_at",
      )
      .eq("token", token)
      .maybeSingle<Partial<SalesChannelQuote>>()

    if (error || !data) return null

    const currency = data.currency || "eur"
    const lineItems = (data.line_items || []) as QuoteLineItem[]
    const quotedProjects = Array.from(
      new Set(lineItems.map((item) => (item.project || "").trim().toLowerCase()).filter(Boolean)),
    )
    const quotedNames = Array.from(
      new Set(lineItems.map((item) => (item.name || "").trim()).filter(Boolean)),
    )

    const pagato = data.payment_status === "paid" || data.status === "paid"
    const scaduto = pagato
      ? false
      : Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at) < new Date() : false)

    const stato = pagato
      ? "pagato"
      : scaduto
        ? "decaduto (serve una riapertura da parte nostra)"
        : data.accepted_at
          ? "accettato, in attesa di pagamento"
          : "in attesa di accettazione"

    const righe: string[] = []
    righe.push(`Numero preventivo: ${data.quote_number || "non assegnato"}`)
    righe.push(`Intestato a: ${[data.client_name, data.client_company].filter(Boolean).join(" - ") || "non indicato"}`)
    righe.push(`Oggetto: ${data.title || "non indicato"}`)
    if (data.description) righe.push(`Descrizione: ${data.description}`)
    righe.push(`Stato attuale: ${stato}`)
    if (quotedProjects.length) righe.push(`Prodotti/progetti ammessi: ${quotedProjects.join(", ")}`)
    if (quotedNames.length) righe.push(`Nomi delle voci ammesse: ${quotedNames.join("; ")}`)

    if (lineItems.length) {
      righe.push("", "Voci del preventivo:")
      for (const item of lineItems) righe.push(describeLine(item, currency))
    }

    righe.push("")
    righe.push(`Totale: ${formatQuoteAmount(data.total_amount, currency)}`)
    righe.push(
      data.vat_included
        ? "Gli importi indicati sono IVA INCLUSA."
        : "Gli importi indicati sono IVA ESCLUSA (l'IVA va aggiunta).",
    )
    if (data.deposit_amount) righe.push(`Acconto previsto: ${formatQuoteAmount(data.deposit_amount, currency)}`)
    if (data.payment_terms) righe.push(`Condizioni di pagamento: ${data.payment_terms}`)
    if (data.expires_at && !pagato) {
      righe.push(`Valido fino al: ${new Date(data.expires_at).toLocaleDateString("it-IT")}`)
    }

    const prompt = `
=== PREVENTIVO CHE L'UTENTE STA GUARDANDO IN QUESTO MOMENTO ===
ISTRUZIONE PRIORITARIA: questa sezione e' la fonte di verita' per QUALSIASI
risposta relativa al preventivo e prevale su qualunque knowledge base generica
riportata prima nel prompt.

${righe.join("\n")}

REGOLE VINCOLANTI SU QUESTO PREVENTIVO:
- Interpreta domande brevi o generiche come "Perche conviene?", "Cosa e' incluso?",
  "Mensile o annuale?" e "Raccontami la proposta" come riferite ESCLUSIVAMENTE
  a questo preventivo e ai prodotti/progetti elencati qui sopra.
- NON menzionare, citare, proporre, confrontare o descrivere brand, prodotti,
  moduli o servizi che non compaiono nelle voci del preventivo. Se una knowledge
  base generica contiene altri prodotti 4BID, ignorali completamente.
- NON usare ne' mostrare come fonte URL relativi a prodotti che non compaiono
  nel preventivo. Per le risposte sul preventivo, la fonte primaria e' il
  preventivo stesso.
- L'utente e' gia' un cliente con un'offerta in mano: NON trattarlo come un
  contatto da acquisire e non chiedergli dati che sono gia' qui sopra.
- Rispondi nel merito citando le voci e gli importi reali.
- Se una cosa NON compare qui sopra (per esempio una voce non elencata),
  dillo chiaramente invece di dedurla: e' il team che deve confermarla.
- Non rivelare mai credenziali, password o dati di accesso.
=== FINE PREVENTIVO ===
`.trim()

    return {
      prompt,
      clientName: data.client_name || null,
      clientEmail: data.client_email || null,
      quoteNumber: data.quote_number || null,
    }
  } catch (e) {
    console.error("[v0] buildQuoteChatContext error:", e)
    return null
  }
}
