import { sendEmail } from "@/lib/email-smtp"
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

function baseLayout(inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f5f5f5;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{background:white;padding:30px;text-align:center;border-bottom:2px solid #f59e0b}.header img{height:60px}.content{padding:40px 30px}.info-box{background:#f9fafb;border:1px solid #e5e7eb;padding:20px;margin:20px 0;border-radius:6px}.button{display:inline-block;background:#f59e0b;color:white!important;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold}.footer{background:#f9fafb;color:#6b7280;padding:25px;text-align:center;font-size:13px;border-top:1px solid #e5e7eb}
  </style></head><body><div class="container"><div class="header"><img src="${LOGO_URL}" alt="4BID" /></div><div class="content">${inner}</div><div class="footer"><strong>4BID S.r.l.</strong><br/>Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)<br/>clienti@4bid.it</div></div></body></html>`
}

function deadline(value: string | null | undefined) {
  if (!value) return ""
  return new Date(value).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

export async function sendQuoteExpiryReminderEmail(quote: SalesChannelQuote, link: string) {
  const client = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const amount = quote.total_amount == null ? "" : `<p><strong>Importo:</strong> ${formatQuoteAmount(quote.total_amount, quote.currency)} ${quote.vat_included ? "IVA inclusa" : "IVA esclusa"}</p>`
  const inner = `<h2>Il preventivo scade domani</h2><p>Gentile ${client},</p><p>le ricordiamo che il preventivo <strong>${escapeHtml(quote.quote_number || quote.title)}</strong> resterà valido fino al <strong>${escapeHtml(deadline(quote.expires_at))}</strong>.</p><div class="info-box">${amount}<p style="margin-bottom:0">Se desidera procedere, può aprire il preventivo e completare l'accettazione entro la scadenza.</p></div><p style="text-align:center"><a href="${link}" class="button">Apri il preventivo</a></p>`
  return sendEmail({ to: quote.client_email!, subject: `Il tuo preventivo 4BID scade domani - ${quote.title}`, html: baseLayout(inner) })
}

export async function sendQuoteFeedbackRequestEmail(quote: SalesChannelQuote, feedbackLink: string) {
  const client = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const inner = `<h2>Ci aiuta a capire cosa non ha funzionato?</h2><p>Gentile ${client},</p><p>il preventivo <strong>${escapeHtml(quote.quote_number || quote.title)}</strong> è scaduto senza essere stato accettato.</p><p>Le chiediamo un feedback molto breve: ci aiuta a capire se il motivo è stato prezzo, tempi, priorità, caratteristiche della proposta o altro.</p><p style="text-align:center"><a href="${feedbackLink}" class="button">Lascia un feedback</a></p><p style="color:#6b7280;font-size:13px">La risposta richiede meno di un minuto e non comporta alcun impegno.</p>`
  return sendEmail({ to: quote.client_email!, subject: `Un breve feedback sul preventivo 4BID`, html: baseLayout(inner) })
}

export async function notifyAdminQuoteReactivationRequest(quote: SalesChannelQuote, adminEmail: string, adminLink: string) {
  const client = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const inner = `<h2>Richiesta di riattivazione preventivo</h2><p><strong>${client}</strong> ha chiesto di riattivare il preventivo <strong>${escapeHtml(quote.quote_number || quote.title)}</strong>.</p><div class="info-box"><p><strong>Scadenza precedente:</strong> ${escapeHtml(deadline(quote.expires_at) || "—")}</p><p style="margin-bottom:0"><strong>Email cliente:</strong> ${escapeHtml(quote.client_email || "—")}</p></div><p style="text-align:center"><a href="${adminLink}" class="button">Apri preventivi e modifica scadenza</a></p>`
  return sendEmail({ to: adminEmail, subject: `Riattivazione preventivo richiesta: ${quote.client_company || quote.client_name}`, html: baseLayout(inner) })
}

export async function notifyAdminQuoteFeedback(quote: SalesChannelQuote, adminEmail: string, reason: string, note: string) {
  const client = escapeHtml(quote.client_company || quote.client_name || "Cliente")
  const inner = `<h2>Feedback ricevuto su preventivo non accettato</h2><p><strong>${client}</strong> ha risposto alla richiesta di feedback sul preventivo <strong>${escapeHtml(quote.quote_number || quote.title)}</strong>.</p><div class="info-box"><p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>${note ? `<p><strong>Nota:</strong><br/>${escapeHtml(note)}</p>` : ""}</div>`
  return sendEmail({ to: adminEmail, subject: `Feedback preventivo: ${quote.client_company || quote.client_name}`, html: baseLayout(inner) })
}
