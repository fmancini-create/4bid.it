/**
 * Invio del preventivo in copia a collaboratori e venditori.
 *
 * PERCHE' NON SI USANO I CAMPI CC/CCN DELL'EMAIL AL CLIENTE
 *
 * L'email al cliente contiene il suo link personale `/preventivo/<token>`.
 * La rotta di accettazione (`app/api/quotes/shared/[token]/accept/route.ts`)
 * chiede SOLO il token e un nome digitato a mano: nessuna verifica di
 * identita', nessun codice di conferma. Chiunque abbia quel link puo' quindi
 * accettare il preventivo, scegliere le opzioni e impegnare il cliente, e nel
 * registro resterebbe il nome che ha scritto lui.
 *
 * Mettere un collaboratore in CC su QUELLA email significherebbe consegnargli
 * il potere di firmare al posto del cliente, senza che nessuno se ne accorga.
 * Percio' le copie viaggiano come messaggio SEPARATO, con il PDF allegato e
 * SENZA alcun link contenente il token: il token non esce dalla casella del
 * cliente.
 *
 * La semantica del CC resta comunque onorata: gli indirizzi in copia VISIBILE
 * vengono dichiarati nell'email del cliente (vedi `sendQuoteEmail`), quelli in
 * copia nascosta no.
 */

import { sendEmail } from "@/lib/email-smtp"
import { generateQuotePdf } from "./pdf"
import { formatQuoteAmount, type SalesChannelQuote } from "./types"

/** Numero massimo di indirizzi per campo: oltre e' quasi certamente un errore. */
export const MAX_COPY_RECIPIENTS = 20

/**
 * Convalida formale di un indirizzo. Volutamente semplice: serve a scartare
 * refusi e tentativi di iniezione di intestazioni, non a stabilire se la
 * casella esista davvero.
 */
export function isValidEmail(value: string): boolean {
  const v = value.trim()
  if (!v || v.length > 254) return false
  // Un a capo o una virgola dentro un indirizzo permetterebbe di aggiungere
  // destinatari o intestazioni arbitrarie al messaggio SMTP.
  if (/[\r\n,;<>]/.test(v)) return false
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v)
}

export interface CopyRecipientsInput {
  cc?: unknown
  bcc?: unknown
}

export interface ParsedCopyRecipients {
  cc: string[]
  bcc: string[]
  errors: string[]
}

/**
 * Normalizza e convalida le due liste.
 *
 * Un indirizzo uguale a quello del cliente viene SCARTATO dalle copie: altrimenti
 * il cliente riceverebbe due email diverse dello stesso preventivo, una con il
 * link e una senza, e non saprebbe quale delle due fa fede.
 */
export function parseCopyRecipients(input: CopyRecipientsInput, clientEmail: string | null): ParsedCopyRecipients {
  const errors: string[] = []
  const cliente = (clientEmail || "").trim().toLowerCase()

  const normalizza = (raw: unknown, etichetta: string): string[] => {
    if (raw == null) return []
    const grezzi = Array.isArray(raw)
      ? raw.map((v) => String(v))
      : String(raw).split(/[\n,;]+/)

    const puliti: string[] = []
    const visti = new Set<string>()

    for (const g of grezzi) {
      const valore = g.trim()
      if (!valore) continue
      if (!isValidEmail(valore)) {
        errors.push(`${etichetta}: indirizzo non valido "${valore}"`)
        continue
      }
      const chiave = valore.toLowerCase()
      if (chiave === cliente) {
        errors.push(`${etichetta}: "${valore}" è l'indirizzo del cliente, che riceve già il preventivo`)
        continue
      }
      if (visti.has(chiave)) continue
      visti.add(chiave)
      puliti.push(valore)
    }

    if (puliti.length > MAX_COPY_RECIPIENTS) {
      errors.push(`${etichetta}: massimo ${MAX_COPY_RECIPIENTS} indirizzi`)
      return puliti.slice(0, MAX_COPY_RECIPIENTS)
    }
    return puliti
  }

  const cc = normalizza(input.cc, "Copia visibile")
  const bcc = normalizza(input.bcc, "Copia nascosta")

  // Chi e' gia' in copia visibile non va anche in copia nascosta: riceverebbe
  // due volte lo stesso messaggio.
  const inCc = new Set(cc.map((v) => v.toLowerCase()))
  const bccFiltrata = bcc.filter((v) => !inCc.has(v.toLowerCase()))

  return { cc, bcc: bccFiltrata, errors }
}

function escapeHtml(value: string | null | undefined): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/** Esportata perche' la verifica automatica possa controllare che il corpo
 *  non contenga MAI il token di accettazione. */
export function corpoCopia(quote: SalesChannelQuote, tipo: "cc" | "bcc"): string {
  const cliente = escapeHtml(quote.client_company || quote.client_name || "—")
  const importo =
    quote.total_amount != null
      ? `${formatQuoteAmount(quote.total_amount, quote.currency)} ${quote.vat_included ? "(IVA inclusa)" : "(IVA esclusa)"}`
      : "—"
  const numero = quote.quote_number ? escapeHtml(quote.quote_number) : "—"
  const avvisoRiservatezza =
    tipo === "bcc"
      ? `<p style="margin:0;color:#6b7280;font-size:13px;">Questa copia è stata inviata in <strong>copia nascosta</strong>: il cliente non sa che l'ha ricevuta.</p>`
      : `<p style="margin:0;color:#6b7280;font-size:13px;">Il cliente è stato informato che questa copia le è stata inviata.</p>`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f5f5f5;margin:0;padding:20px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Copia per conoscenza</p>
      <h2 style="margin:0 0 16px;color:#1a1a1a;">${escapeHtml(quote.title)}</h2>
      <p>È stato inviato un preventivo al cliente <strong>${cliente}</strong>. In allegato trova il PDF con la proposta completa.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;margin:20px 0;border-radius:6px;">
        <p style="margin:4px 0;"><strong>Numero preventivo:</strong> ${numero}</p>
        <p style="margin:4px 0;"><strong>Cliente:</strong> ${cliente}</p>
        <p style="margin:4px 0;"><strong>Importo:</strong> ${importo}</p>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;padding:16px;margin:20px 0;border-radius:6px;">
        <p style="margin:0 0 6px;"><strong>Questa copia non permette di accettare il preventivo.</strong></p>
        <p style="margin:0;color:#6b7280;font-size:13px;">Il link di accettazione è personale del cliente e non viene condiviso: solo lui può accettare la proposta e impegnare la sua azienda.</p>
      </div>
      ${avvisoRiservatezza}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;">4BID S.r.l. · clienti@4bid.it · www.4bid.it</p>
    </div>
  </body></html>`
}

export interface CopySendOutcome {
  inviate: number
  fallite: { email: string; errore: string }[]
}

/**
 * Invia le copie. Il PDF viene generato UNA sola volta e riusato.
 *
 * Gli indirizzi in copia visibile ricevono un unico messaggio e si vedono a
 * vicenda (e' cio' che distingue il CC); quelli in copia nascosta ricevono un
 * messaggio ciascuno, cosi' nessuno di loro puo' sapere chi altro e' in lista.
 */
export async function sendQuoteCopies(
  quote: SalesChannelQuote,
  cc: string[],
  bcc: string[],
): Promise<CopySendOutcome> {
  const esito: CopySendOutcome = { inviate: 0, fallite: [] }
  if (!cc.length && !bcc.length) return esito

  let allegato: { filename: string; content: Buffer; contentType: string } | undefined
  try {
    const pdf = await generateQuotePdf(quote)
    allegato = {
      filename: `Preventivo-${(quote.quote_number || "4BID").replace(/[^\w.-]/g, "_")}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    }
  } catch (e) {
    // Senza allegato la copia perde quasi tutto il suo valore, ma un messaggio
    // che avvisa dell'invio e' meglio del silenzio: si prosegue segnalandolo.
    console.error("[quotes] PDF per le copie non generato:", e)
  }

  const oggetto = `Copia preventivo ${quote.quote_number || ""} - ${quote.client_company || quote.client_name || ""}`.trim()

  if (cc.length) {
    const r = await sendEmail({
      to: cc.join(", "),
      subject: oggetto,
      html: corpoCopia(quote, "cc"),
      ...(allegato ? { attachments: [allegato] } : {}),
    })
    if (r.success) esito.inviate += cc.length
    else cc.forEach((e) => esito.fallite.push({ email: e, errore: r.error || "errore sconosciuto" }))
  }

  for (const indirizzo of bcc) {
    const r = await sendEmail({
      to: indirizzo,
      subject: oggetto,
      html: corpoCopia(quote, "bcc"),
      ...(allegato ? { attachments: [allegato] } : {}),
    })
    if (r.success) esito.inviate += 1
    else esito.fallite.push({ email: indirizzo, errore: r.error || "errore sconosciuto" })
  }

  return esito
}
