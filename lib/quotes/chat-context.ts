import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  calculateQuoteLine,
  formatQuoteAmount,
  isQuoteLineSelected,
  type QuoteLineItem,
  type SalesChannelQuote,
} from "@/lib/quotes/types"
import { getCommercialMeta, getIncludedCredits } from "@/lib/quotes/commercial"
import { quoteBenefits } from "@/lib/quotes/branding"

export interface QuoteChatContext {
  /** Testo da aggiungere al prompt: descrive l'offerta al posto di "non ho informazioni". */
  prompt: string
  /** Intestatario del preventivo: serve a NON richiedere dati che abbiamo gia'. */
  clientName: string | null
  clientCompany: string | null
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
  const meta = getCommercialMeta(item)
  const benefits = quoteBenefits(item, 5)
  const credits = getIncludedCredits(item)
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
  if (item.optional) parti.push(isQuoteLineSelected(item) ? "(opzionale, selezionata)" : "(opzionale, non selezionata)")
  else parti.push("(inclusa nella proposta)")
  if (item.trial_days) parti.push(`con ${item.trial_days} giorni di prova`)

  let riga = parti.join(" ")

  if (item.name && item.description && item.description !== item.name) {
    riga += `\n  Descrizione: ${item.description}`
  }
  if (item.features?.length) {
    riga += `\n  Funzionalita: ${item.features.join("; ")}`
  }
  if (benefits.length) {
    riga += `\n  Benefici commerciali da spiegare: ${benefits.join("; ")}`
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
      s.notes,
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
  if (credits) {
    riga += `\n  Crediti inclusi: ${formatQuoteAmount(credits.amount, currency)} (${credits.recharge === "recurring" ? "ricaricati a ogni rinnovo" : "una tantum"})`
  }

  const monthly = meta.billing_options?.monthly
  const yearly = meta.billing_options?.yearly
  if (monthly?.unit_amount) {
    riga += `\n  Formula mensile: ${formatQuoteAmount(monthly.unit_amount * (item.quantity || 1), currency)}`
  }
  if (yearly?.unit_amount) {
    riga += `\n  Formula annuale: ${formatQuoteAmount(yearly.unit_amount * (item.quantity || 1), currency)}${yearly.discount_pct ? `, sconto ${yearly.discount_pct}%` : ""}`
  }

  const config = (item.configuration || {}) as Record<string, any>
  const struttura = config.structure_type
  const sistemazioni = config.accommodations
  const stelle = config.star_rating
  const unita = config.unit_label
  const dettagliStruttura = [
    struttura && `tipo struttura: ${struttura}`,
    sistemazioni && `${sistemazioni} ${unita || "sistemazioni"}`,
    stelle && `${stelle} stelle`,
  ].filter(Boolean)
  if (dettagliStruttura.length) riga += `\n  Parametri usati per questa offerta: ${dettagliStruttura.join(", ")}`

  if (meta.service_type) riga += `\n  Tipo servizio: ${meta.service_type}`
  if (meta.parent_line_id) riga += `\n  Collegato alla voce principale: ${meta.parent_line_id}`
  if (meta.free_on_annual) riga += `\n  Con formula annuale: servizio/setup in omaggio secondo le condizioni del preventivo`
  if (meta.annual_setup_discount_pct) riga += `\n  Sconto setup con formula annuale: ${meta.annual_setup_discount_pct}%`

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
    righe.push(`Nome destinatario: ${data.client_name || "non indicato"}`)
    righe.push(`Azienda/struttura destinataria: ${data.client_company || "non indicata"}`)
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
- Sai esattamente a chi e' intestata l'offerta. Quando e' naturale, rivolgiti al
  destinatario per nome e ragiona sulla sua azienda/struttura, senza ripetere il
  nome in ogni risposta e senza risultare artificiale.
- Interpreta domande brevi o generiche come "Perche conviene?", "Cosa e' incluso?",
  "Mensile o annuale?" e "Raccontami la proposta" come riferite ESCLUSIVAMENTE
  a questo preventivo e ai prodotti/progetti elencati qui sopra.
- Conosci ogni modulo tramite descrizione, funzionalita, benefici, stato di
  selezione, prova, assistenza, prezzi, formule mensile/annuale e parametri di
  configurazione riportati qui sopra. Usa questi dati per spiegare COSA fa,
  PERCHE' puo' essere utile a questa struttura e COME si inserisce nella proposta.
- Distingui sempre fra voce inclusa, opzionale selezionata e opzionale non
  selezionata. Non presentare come acquistato cio' che e' solo un'opzione.
- Se l'utente chiede un confronto mensile/annuale, usa esclusivamente gli importi
  e gli sconti riportati nel preventivo e spiega la differenza con chiarezza.
- NON menzionare, citare, proporre, confrontare o descrivere brand, prodotti,
  moduli o servizi che non compaiono nelle voci del preventivo. Se una knowledge
  base generica contiene altri prodotti 4BID, ignorali completamente.
- NON usare ne' mostrare come fonte URL relativi a prodotti che non compaiono
  nel preventivo. Per le risposte sul preventivo, la fonte primaria e' il
  preventivo stesso.
- L'utente e' gia' un cliente con un'offerta in mano: NON trattarlo come un
  contatto da acquisire e non chiedergli dati che sono gia' qui sopra.
- Interagisci come una consulente commerciale competente: rispondi prima alla
  domanda, poi eventualmente suggerisci il passo successivo pertinente. Niente
  risposte generiche, niente liste di marketing scollegate dall'offerta.
- Se una cosa NON compare qui sopra (per esempio una funzione non elencata),
  dillo chiaramente invece di dedurla: e' il team che deve confermarla.
- Non rivelare mai credenziali, password o dati di accesso.
=== FINE PREVENTIVO ===
`.trim()

    return {
      prompt,
      clientName: data.client_name || null,
      clientCompany: data.client_company || null,
      clientEmail: data.client_email || null,
      quoteNumber: data.quote_number || null,
    }
  } catch (e) {
    console.error("[v0] buildQuoteChatContext error:", e)
    return null
  }
}
