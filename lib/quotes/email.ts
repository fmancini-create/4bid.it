import { sendEmail } from "@/lib/email-smtp"
import { formatQuoteAmount, type SalesChannelQuote } from "./types"
import { generateQuotePdf } from "./pdf"

const LOGO_URL = "https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75"

function baseLayout(title: string, inner: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .header { background: white; padding: 30px; text-align: center; border-bottom: 2px solid #f59e0b; }
      .header img { height: 60px; }
      .content { padding: 40px 30px; }
      .content h2 { color: #1a1a1a; margin-top: 0; }
      .info-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px; }
      .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      .footer { background: #f9fafb; color: #6b7280; padding: 25px; text-align: center; font-size: 13px; border-top: 1px solid #e5e7eb; }
      .footer p { margin: 5px 0; }
      .total { font-size: 20px; font-weight: bold; color: #1a1a1a; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="${LOGO_URL}" alt="4BID" />
      </div>
      <div class="content">
        ${inner}
      </div>
      <div class="footer">
        <p><strong>4BID S.r.l.</strong></p>
        <p>Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)</p>
        <p>P.IVA: 06241710489 | clienti@4bid.it | www.4bid.it</p>
      </div>
    </div>
  </body>
  </html>
  `
}

export async function sendQuoteEmail(quote: SalesChannelQuote, link: string) {
  const greetingName = quote.client_company || quote.client_name || "Gentile Cliente"
  const totalRow =
    quote.total_amount != null
      ? `<p class="total">Importo: ${formatQuoteAmount(quote.total_amount, quote.currency)} ${
          quote.vat_included ? "(IVA inclusa)" : "(IVA esclusa)"
        }</p>`
      : ""

  const numberLine = quote.quote_number
    ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Preventivo N. <strong>${quote.quote_number}</strong> del ${new Date(quote.created_at).toLocaleDateString("it-IT")}</p>`
    : ""

  const inner = `
    <h2>${quote.title}</h2>
    ${numberLine}
    <p>Gentile ${greetingName},</p>
    <p>le inviamo il preventivo per le attività di ottimizzazione dei canali di vendita.
    Per prendere visione dei dettagli, completare i dati necessari all'avvio delle attività
    e procedere con l'accettazione e il pagamento, clicchi sul pulsante qui sotto.</p>
    <div class="info-box">
      ${totalRow}
      <p style="margin:0;color:#6b7280;">Il preventivo è consultabile online in modo sicuro tramite link personale.</p>
    </div>
    <p style="text-align:center;">
      <a href="${link}" class="button">Visualizza e accetta il preventivo</a>
    </p>
    <p style="color:#6b7280;font-size:13px;">Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br>${link}</p>
  `

  // Allega il PDF del preventivo. Se la generazione fallisce, invia comunque
  // l'email (senza allegato) per non bloccare il flusso.
  let attachments: { filename: string; content: Buffer; contentType?: string }[] | undefined
  try {
    const pdf = await generateQuotePdf(quote)
    const safeName = (quote.client_company || quote.client_name || "preventivo")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
    attachments = [
      {
        filename: `preventivo-4bid-${safeName || "cliente"}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ]
  } catch (err) {
    console.error("[v0] Generazione PDF preventivo fallita, invio senza allegato:", err)
  }

  return sendEmail({
    to: quote.client_email!,
    subject: `Preventivo 4BID: ${quote.title}`,
    html: baseLayout(quote.title, inner),
    attachments,
  })
}

export async function sendQuoteReminderEmail(quote: SalesChannelQuote, link: string) {
  const greetingName = quote.client_company || quote.client_name || "Gentile Cliente"
  const totalRow =
    quote.total_amount != null
      ? `<p class="total">Importo: ${formatQuoteAmount(quote.total_amount, quote.currency)} ${
          quote.vat_included ? "(IVA inclusa)" : "(IVA esclusa)"
        }</p>`
      : ""

  const numberLine = quote.quote_number
    ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Preventivo N. <strong>${quote.quote_number}</strong> del ${new Date(quote.created_at).toLocaleDateString("it-IT")}</p>`
    : ""

  const inner = `
    <h2>${quote.title}</h2>
    ${numberLine}
    <p>Gentile ${greetingName},</p>
    <p>le ricordiamo che il preventivo per le attività di ottimizzazione dei canali di vendita
    è ancora in attesa di riscontro. Per procedere, la invitiamo a prendere visione dei dettagli,
    completare i dati necessari e accettarlo tramite il link qui sotto.</p>
    <div class="info-box">
      ${totalRow}
      <p style="margin:0;color:#6b7280;">Se ha già provveduto, può ignorare questo promemoria.</p>
    </div>
    <p style="text-align:center;">
      <a href="${link}" class="button">Visualizza e accetta il preventivo</a>
    </p>
    <p style="color:#6b7280;font-size:13px;">Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br>${link}</p>
  `

  return sendEmail({
    to: quote.client_email!,
    subject: `Promemoria - Preventivo 4BID: ${quote.title}`,
    html: baseLayout(quote.title, inner),
  })
}

export async function notifyAdminQuoteAccepted(quote: SalesChannelQuote, adminEmail: string) {
  const inner = `
    <h2>Preventivo accettato</h2>
    <p>Il cliente <strong>${quote.client_company || quote.client_name}</strong> ha accettato il preventivo
    "<strong>${quote.title}</strong>".</p>
    <div class="info-box">
      <p><strong>Numero preventivo:</strong> ${quote.quote_number || "—"}</p>
      <p><strong>Accettato da:</strong> ${quote.acceptance_name || "—"}</p>
      <p><strong>Metodo di pagamento scelto:</strong> ${
        quote.payment_method === "card" ? "Carta (Stripe)" : quote.payment_method === "bonifico" ? "Bonifico bancario" : "—"
      }</p>
      <p><strong>Stato pagamento:</strong> ${quote.payment_status || "—"}</p>
    </div>
    <p>I dati operativi compilati dal cliente sono disponibili nell'area amministrativa.</p>
  `
  return sendEmail({
    to: adminEmail,
    subject: `Preventivo accettato: ${quote.client_company || quote.client_name}`,
    html: baseLayout("Preventivo accettato", inner),
  })
}
