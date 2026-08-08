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

export async function notifyAdminQuoteAccepted(quote: SalesChannelQuote, adminEmail: string) {
  const inner = `<h2>Preventivo accettato</h2><p>Il cliente <strong>${escapeHtml(quote.client_company || quote.client_name)}</strong> ha accettato il preventivo “<strong>${escapeHtml(quote.title)}</strong>”.</p><div class="info-box"><p><strong>Numero preventivo:</strong> ${escapeHtml(quote.quote_number || "—")}</p><p><strong>Accettato da:</strong> ${escapeHtml(quote.acceptance_name || "—")}</p><p><strong>Metodo di pagamento:</strong> ${quote.payment_method === "card" ? "Carta (Stripe)" : quote.payment_method === "bonifico" ? "Bonifico bancario" : "—"}</p><p><strong>Stato pagamento:</strong> ${escapeHtml(quote.payment_status || "—")}</p></div><p>I dati operativi compilati dal cliente sono disponibili nell'area amministrativa.</p>`
  return sendEmail({ to: adminEmail, subject: `Preventivo accettato: ${quote.client_company || quote.client_name}`, html: baseLayout("Preventivo accettato", inner) })
}
