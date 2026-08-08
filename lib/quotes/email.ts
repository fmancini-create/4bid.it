import { sendEmail } from "@/lib/email-smtp"
import type { BookingOption } from "@/lib/booking-options"
import { QUOTE_BANK_DETAILS, quoteTransferReason } from "./bank"
import { formatQuoteAmount, type SalesChannelQuote } from "./types"

const LOGO_URL = "https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75"

function escapeHtml(value: string | null | undefined): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function baseLayout(title: string, inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f5f5f5;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{background:white;padding:30px;text-align:center;border-bottom:2px solid #f59e0b}.header img{height:60px}.content{padding:40px 30px}.content h2{color:#1a1a1a;margin-top:0}.info-box{background:#f9fafb;border:1px solid #e5e7eb;padding:20px;margin:20px 0;border-radius:6px}.button{display:inline-block;background:#f59e0b;color:white!important;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin:10px 4px}.button.secondary{background:#fff;color:#111827!important;border:1px solid #d1d5db}.footer{background:#f9fafb;color:#6b7280;padding:25px;text-align:center;font-size:13px;border-top:1px solid #e5e7eb}.footer p{margin:5px 0}.total{font-size:20px;font-weight:bold;color:#1a1a1a}
  </style></head><body><div class="container"><div class="header"><img src="${LOGO_URL}" alt="4BID" /></div><div class="content">${inner}</div><div class="footer"><p><strong>4BID S.r.l.</strong></p><p>Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)</p><p>P.IVA: 06241710489 | clienti@4bid.it | www.4bid.it</p></div></div></body></html>`
}

function authoredDescription(quote: SalesChannelQuote) {
  const value = quote.description?.trim()
  if (!value) return ""
  return `<div style="white-space:pre-wrap;margin:14px 0 18px;">${escapeHtml(value)}</div>`
}

export async function sendQuoteEmail(quote: SalesChannelQuote, link: string) {
  const greetingName = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const totalRow = quote.total_amount != null
    ? `<p class="total">Importo: ${formatQuoteAmount(quote.total_amount, quote.currency)} ${quote.vat_included ? "(IVA inclusa)" : "(IVA esclusa)"}</p>`
    : ""
  const numberLine = quote.quote_number
    ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Preventivo N. <strong>${escapeHtml(quote.quote_number)}</strong> del ${new Date(quote.created_at).toLocaleDateString("it-IT")}</p>`
    : ""
  const downloadLink = `${link.replace(/\/$/, "")}/pdf`
  const inner = `
    <h2>${escapeHtml(quote.title)}</h2>${numberLine}
    <p>Gentile ${greetingName},</p>
    ${authoredDescription(quote)}
    <p>La proposta completa è disponibile nella sua area riservata online. Da lì può consultare i dettagli, scegliere le opzioni disponibili e procedere all'accettazione.</p>
    <div class="info-box">${totalRow}<p style="margin:0;color:#6b7280;">Per garantire tracciabilità e mostrare sempre la versione aggiornata, il preventivo viene gestito online.</p></div>
    <p style="text-align:center;"><a href="${link}" class="button">Visualizza e accetta il preventivo</a><a href="${downloadLink}" class="button secondary">Scarica preventivo</a></p>
    <p style="color:#6b7280;font-size:13px;">Link personale: ${link}</p>`
  return sendEmail({ to: quote.client_email!, subject: `Preventivo 4BID: ${quote.title}`, html: baseLayout(quote.title, inner) })
}

export async function sendQuoteReminderEmail(quote: SalesChannelQuote, link: string) {
  const greetingName = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const totalRow = quote.total_amount != null ? `<p class="total">Importo: ${formatQuoteAmount(quote.total_amount, quote.currency)} ${quote.vat_included ? "(IVA inclusa)" : "(IVA esclusa)"}</p>` : ""
  const numberLine = quote.quote_number ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Preventivo N. <strong>${escapeHtml(quote.quote_number)}</strong> del ${new Date(quote.created_at).toLocaleDateString("it-IT")}</p>` : ""
  const inner = `<h2>${escapeHtml(quote.title)}</h2>${numberLine}<p>Gentile ${greetingName},</p>${authoredDescription(quote)}<p>Le ricordiamo che la proposta è ancora disponibile online e in attesa di riscontro.</p><div class="info-box">${totalRow}<p style="margin:0;color:#6b7280;">Se ha già provveduto, può ignorare questo promemoria.</p></div><p style="text-align:center;"><a href="${link}" class="button">Apri il preventivo</a></p>`
  return sendEmail({ to: quote.client_email!, subject: `Promemoria - Preventivo 4BID: ${quote.title}`, html: baseLayout(quote.title, inner) })
}

function formatDeadline(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

function amountLine(quote: SalesChannelQuote): string {
  if (quote.total_amount == null) return ""
  return `<p class="total">Importo: ${formatQuoteAmount(quote.total_amount, quote.currency)} ${quote.vat_included ? "(IVA inclusa)" : "(IVA esclusa)"}</p>`
}

function quoteNumberLine(quote: SalesChannelQuote): string {
  if (!quote.quote_number) return ""
  return `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Preventivo N. <strong>${escapeHtml(quote.quote_number)}</strong> del ${new Date(quote.created_at).toLocaleDateString("it-IT")}</p>`
}

/** Istruzioni di pagamento coerenti col metodo scelto dal cliente. */
function paymentInstructions(quote: SalesChannelQuote, link: string): string {
  if (quote.payment_method === "bonifico") {
    const reason = quoteTransferReason(quote.quote_number, quote.token || "")
    return `<div class="info-box"><p style="margin:0 0 10px;"><strong>Pagamento con bonifico bancario</strong></p>
      <p style="margin:4px 0;"><strong>Beneficiario:</strong> ${escapeHtml(QUOTE_BANK_DETAILS.holder)}</p>
      <p style="margin:4px 0;"><strong>Banca:</strong> ${escapeHtml(QUOTE_BANK_DETAILS.bank)}</p>
      <p style="margin:4px 0;"><strong>IBAN:</strong> ${escapeHtml(QUOTE_BANK_DETAILS.iban)}</p>
      ${reason ? `<p style="margin:4px 0;"><strong>Causale:</strong> ${escapeHtml(reason)}</p>` : ""}
      <p style="margin:10px 0 0;color:#6b7280;">Dopo il bonifico riceverà conferma da parte nostra.</p></div>`
  }
  return `<div class="info-box"><p style="margin:0 0 10px;"><strong>Pagamento con carta</strong></p>
    <p style="margin:0;color:#6b7280;">Il pagamento non risulta ancora completato. Può concluderlo dalla sua pagina personale del preventivo.</p></div>
    <p style="text-align:center;"><a href="${link}" class="button">Completa il pagamento</a></p>`
}

/**
 * Conferma di accettazione al CLIENTE, con invito a pagare entro la scadenza.
 * Prima esisteva solo l'avviso all'admin: chi accettava non riceveva nulla e
 * non sapeva ne' che l'accettazione fosse arrivata, ne' entro quando pagare.
 */
export async function sendQuoteAcceptedEmail(quote: SalesChannelQuote, link: string) {
  const greetingName = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const deadline = formatDeadline(quote.expires_at)
  const deadlineBlock = deadline
    ? `<p>Per rendere operativa la proposta le chiediamo di completare il pagamento <strong>entro il ${deadline}</strong>. Oltre tale data l'offerta e le condizioni economiche indicate decadono e sarà necessario concordare una nuova proposta.</p>`
    : `<p>Per rendere operativa la proposta le chiediamo di completare il pagamento nei prossimi giorni.</p>`
  const inner = `<h2>Abbiamo ricevuto la sua accettazione</h2>${quoteNumberLine(quote)}
    <p>Gentile ${greetingName},</p>
    <p>confermiamo di aver registrato l'accettazione del preventivo “<strong>${escapeHtml(quote.title)}</strong>” a nome di <strong>${escapeHtml(quote.acceptance_name || quote.client_name || "")}</strong>. La copia delle condizioni accettate resta disponibile nella sua pagina personale.</p>
    ${amountLine(quote)}
    ${deadlineBlock}
    ${paymentInstructions(quote, link)}
    <p style="color:#6b7280;font-size:13px;">Link personale: ${link}</p>`
  return sendEmail({
    to: quote.client_email!,
    subject: `Accettazione ricevuta - Preventivo ${quote.quote_number || ""} ${quote.title}`.trim(),
    html: baseLayout("Accettazione ricevuta", inner),
  })
}

/**
 * Sollecito di PAGAMENTO dopo l'accettazione. Distinto dal promemoria di
 * accettazione: qui il cliente ha gia' detto di si', manca solo il pagamento.
 */
export async function sendQuotePaymentReminderEmail(
  quote: SalesChannelQuote,
  link: string,
  options: { finalNotice?: boolean } = {},
) {
  const greetingName = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const deadline = formatDeadline(quote.expires_at)
  const urgency = options.finalNotice
    ? deadline
      ? `<p><strong>Ultimo avviso:</strong> l'offerta scade domani, ${deadline}. Se il pagamento non viene completato entro tale data, le condizioni economiche indicate decadono.</p>`
      : `<p><strong>Ultimo avviso:</strong> l'offerta è in scadenza. Se il pagamento non viene completato, le condizioni economiche indicate decadono.</p>`
    : deadline
      ? `<p>Le ricordiamo che il pagamento risulta ancora da completare. L'offerta resta valida <strong>fino al ${deadline}</strong>.</p>`
      : `<p>Le ricordiamo che il pagamento risulta ancora da completare.</p>`
  const inner = `<h2>${options.finalNotice ? "L'offerta scade domani" : "Pagamento in attesa"}</h2>${quoteNumberLine(quote)}
    <p>Gentile ${greetingName},</p>
    <p>ha accettato il preventivo “<strong>${escapeHtml(quote.title)}</strong>”, la ringraziamo.</p>
    ${urgency}
    ${amountLine(quote)}
    ${paymentInstructions(quote, link)}
    <p style="color:#6b7280;font-size:13px;">Se ha già provveduto al pagamento, può ignorare questo messaggio.</p>`
  return sendEmail({
    to: quote.client_email!,
    subject: options.finalNotice
      ? `Ultimo avviso: l'offerta scade domani - ${quote.title}`
      : `Pagamento in attesa - Preventivo ${quote.quote_number || ""} ${quote.title}`.trim(),
    html: baseLayout("Pagamento in attesa", inner),
  })
}

/**
 * Conferma di PAGAMENTO al cliente, con prenotazione della call di avvio per
 * ogni modulo acquistato (stessi calendari di /prenota-demo).
 */
export async function sendQuotePaidEmail(quote: SalesChannelQuote, bookings: BookingOption[]) {
  const greetingName = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const bookingBlocks = bookings.map(option => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
      <p style="margin:0 0 2px;font-weight:bold;color:#1a1a1a;">Avvio configurazione — ${escapeHtml(option.productName)}</p>
      <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">${escapeHtml(option.subtitle || "")} · ${option.durationMin} min · Google Meet</p>
      <a href="${option.scheduleUrl}" class="button" style="margin:0;">Scegli data e ora</a>
    </td></tr>`).join("")
  const bookingSection = bookings.length
    ? `<h3 style="margin-top:30px;">Prenoti le call di avvio</h3>
       <p>Può scegliere subito data e orario per ciascun servizio acquistato, secondo la sua disponibilità:</p>
       <table style="width:100%;border-collapse:collapse;">${bookingBlocks}</table>`
    : ""
  const inner = `<h2>Pagamento confermato</h2>${quoteNumberLine(quote)}
    <p>Gentile ${greetingName},</p>
    <p>abbiamo ricevuto il pagamento del preventivo “<strong>${escapeHtml(quote.title)}</strong>”. Grazie per la fiducia.</p>
    <div class="info-box"><p style="margin:0;">Nei prossimi giorni sarà contattato dal team 4BID per avviare la configurazione dei servizi.</p></div>
    ${bookingSection}
    <p style="margin-top:24px;">Se preferisce essere ricontattato telefonicamente, ci scriva a <a href="mailto:${QUOTE_BANK_DETAILS.paymentEmail}">${QUOTE_BANK_DETAILS.paymentEmail}</a> indicando recapito e fascia oraria preferita.</p>`
  return sendEmail({
    to: quote.client_email!,
    subject: `Pagamento confermato - ${quote.title}`,
    html: baseLayout("Pagamento confermato", inner),
  })
}

/** Avviso al superadmin sullo stato del pagamento dopo l'accettazione. */
export async function notifyAdminQuotePaymentStatus(
  quote: SalesChannelQuote,
  adminEmail: string,
  kind: "paid" | "reminded" | "expired",
) {
  const client = escapeHtml(quote.client_company || quote.client_name || "—")
  const method = quote.payment_method === "card" ? "Carta (Stripe)" : quote.payment_method === "bonifico" ? "Bonifico bancario" : "—"
  const heading = kind === "paid" ? "Pagamento ricevuto" : kind === "expired" ? "Offerta decaduta per mancato pagamento" : "Sollecito di pagamento inviato"
  const body = kind === "paid"
    ? `<p>Il cliente <strong>${client}</strong> ha <strong>pagato</strong> il preventivo “<strong>${escapeHtml(quote.title)}</strong>”. Da avviare la configurazione: il cliente ha ricevuto i link per prenotare le call.</p>`
    : kind === "expired"
      ? `<p>Il cliente <strong>${client}</strong> aveva accettato il preventivo “<strong>${escapeHtml(quote.title)}</strong>” ma <strong>non ha pagato</strong> entro la scadenza. L'offerta è decaduta e il pagamento è bloccato: può riaprirla dall'area amministrativa assegnando una nuova scadenza.</p>`
      : `<p>Il cliente <strong>${client}</strong> non ha ancora pagato il preventivo “<strong>${escapeHtml(quote.title)}</strong>”. È stato inviato un sollecito automatico.</p>`
  const inner = `<h2>${heading}</h2>${body}
    <div class="info-box">
      <p><strong>Numero preventivo:</strong> ${escapeHtml(quote.quote_number || "—")}</p>
      <p><strong>Importo:</strong> ${quote.total_amount != null ? formatQuoteAmount(quote.total_amount, quote.currency) : "—"}</p>
      <p><strong>Metodo di pagamento:</strong> ${method}</p>
      <p><strong>Stato pagamento:</strong> ${escapeHtml(quote.payment_status || "—")}</p>
      <p><strong>Accettato il:</strong> ${quote.accepted_at ? new Date(quote.accepted_at).toLocaleString("it-IT") : "—"}</p>
      <p><strong>Scadenza offerta:</strong> ${formatDeadline(quote.expires_at) || "non impostata"}</p>
    </div>`
  const subject = kind === "paid"
    ? `Pagamento ricevuto: ${quote.client_company || quote.client_name}`
    : kind === "expired"
      ? `Offerta decaduta (non pagata): ${quote.client_company || quote.client_name}`
      : `Sollecito pagamento inviato: ${quote.client_company || quote.client_name}`
  return sendEmail({ to: adminEmail, subject, html: baseLayout(heading, inner) })
}

export async function notifyAdminQuoteAccepted(quote: SalesChannelQuote, adminEmail: string) {
  const inner = `<h2>Preventivo accettato</h2><p>Il cliente <strong>${escapeHtml(quote.client_company || quote.client_name)}</strong> ha accettato il preventivo “<strong>${escapeHtml(quote.title)}</strong>”.</p><div class="info-box"><p><strong>Numero preventivo:</strong> ${escapeHtml(quote.quote_number || "—")}</p><p><strong>Accettato da:</strong> ${escapeHtml(quote.acceptance_name || "—")}</p><p><strong>Metodo di pagamento:</strong> ${quote.payment_method === "card" ? "Carta (Stripe)" : quote.payment_method === "bonifico" ? "Bonifico bancario" : "—"}</p><p><strong>Stato pagamento:</strong> ${escapeHtml(quote.payment_status || "—")}</p></div><p>I dati operativi compilati dal cliente sono disponibili nell'area amministrativa.</p>`
  return sendEmail({ to: adminEmail, subject: `Preventivo accettato: ${quote.client_company || quote.client_name}`, html: baseLayout("Preventivo accettato", inner) })
}
