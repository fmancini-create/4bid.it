import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { formatQuoteAmount, type SalesChannelQuote } from "./types"

// I font standard (Helvetica) usano l'encoding WinAnsi: alcuni caratteri prodotti
// da Intl.NumberFormat (narrow no-break space \u202f, no-break space \u00a0) o testi
// incollati (virgolette curve, trattini lunghi) NON sono rappresentabili e farebbero
// lanciare un'eccezione. Sanitizziamo tutto prima di disegnare.
function sanitize(text: string): string {
  return (text || "")
    .replace(/[\u202f\u00a0\u2007\u2009]/g, " ") // spazi unicode -> spazio normale
    .replace(/[\u2018\u2019\u2032]/g, "'") // apostrofi/virgolette curve singole
    .replace(/[\u201c\u201d\u2033]/g, '"') // virgolette curve doppie
    .replace(/[\u2013\u2014]/g, "-") // en/em dash -> trattino
    .replace(/\u2026/g, "...") // ellissi
    .replace(/\u20ac/g, "EUR ") // simbolo euro non sempre in WinAnsi -> label sicura
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xff]/g, "") // scarta tutto ciò che resta fuori da Latin-1
}

function amount(value: number | null | undefined, currency = "eur"): string {
  return sanitize(formatQuoteAmount(value, currency))
}

const A4 = { w: 595.28, h: 841.89 }
const MARGIN = 50
const CONTENT_W = A4.w - MARGIN * 2
const AMBER = rgb(0.96, 0.62, 0.04)
const DARK = rgb(0.1, 0.1, 0.1)
const GRAY = rgb(0.42, 0.45, 0.5)
const LIGHT = rgb(0.9, 0.91, 0.93)

// Spezza una stringa in righe che rientrano nella larghezza data.
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = []
  const paragraphs = sanitize(text).split(/\r?\n/)
  for (const para of paragraphs) {
    if (para.trim() === "") {
      out.push("")
      continue
    }
    const words = para.split(/\s+/)
    let line = ""
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        out.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) out.push(line)
  }
  return out
}

export async function generateQuotePdf(quote: SalesChannelQuote): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([A4.w, A4.h])
  let y = A4.h - MARGIN

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 40) {
      page = doc.addPage([A4.w, A4.h])
      y = A4.h - MARGIN
    }
  }

  const drawText = (
    text: string,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number } = {},
  ) => {
    const size = opts.size ?? 10
    const f = opts.font ?? font
    ensureSpace(size + 4)
    page.drawText(sanitize(text), { x: opts.x ?? MARGIN, y, size, font: f, color: opts.color ?? DARK })
    y -= size + 6
  }

  const drawParagraph = (text: string, size = 10, color = DARK) => {
    for (const line of wrapText(text, font, size, CONTENT_W)) {
      ensureSpace(size + 4)
      if (line !== "") {
        page.drawText(line, { x: MARGIN, y, size, font, color })
      }
      y -= size + 4
    }
  }

  // --- Intestazione ---
  page.drawRectangle({ x: 0, y: A4.h - 8, width: A4.w, height: 8, color: AMBER })
  drawText("4BID S.r.l.", { size: 18, font: bold })
  drawText("Ottimizzazione Canali di Vendita", { size: 10, color: GRAY })
  y -= 4
  drawText(sanitize(quote.title), { size: 15, font: bold })
  drawText(`Preventivo del ${new Date(quote.created_at).toLocaleDateString("it-IT")}`, { size: 9, color: GRAY })
  y -= 8

  // --- Dati intestatario ---
  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4.w - MARGIN, y }, thickness: 1, color: LIGHT })
  y -= 16
  drawText("Intestatario", { size: 11, font: bold, color: AMBER })
  if (quote.client_company) drawText(quote.client_company, { size: 10, font: bold })
  if (quote.client_name) drawText(quote.client_name)
  if (quote.client_vat) drawText(`P.IVA / C.F.: ${quote.client_vat}`, { color: GRAY })
  if (quote.client_address) drawParagraph(quote.client_address, 10, GRAY)
  if (quote.client_email) drawText(quote.client_email, { color: GRAY })
  y -= 8

  // --- Descrizione ---
  if (quote.description) {
    drawText("Descrizione", { size: 11, font: bold, color: AMBER })
    drawParagraph(quote.description, 10, DARK)
    y -= 6
  }

  // --- Righe di preventivo ---
  const items = Array.isArray(quote.line_items) ? quote.line_items : []
  if (items.length > 0) {
    drawText("Dettaglio", { size: 11, font: bold, color: AMBER })
    ensureSpace(20)
    // Header tabella
    page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 20, color: rgb(0.97, 0.97, 0.98) })
    page.drawText("Voce", { x: MARGIN + 8, y: y + 2, size: 9, font: bold, color: GRAY })
    const amtHeader = "Importo"
    page.drawText(amtHeader, {
      x: A4.w - MARGIN - 8 - bold.widthOfTextAtSize(amtHeader, 9),
      y: y + 2,
      size: 9,
      font: bold,
      color: GRAY,
    })
    y -= 22
    for (const it of items) {
      const descLines = wrapText(it.description || "", font, 10, CONTENT_W - 120)
      ensureSpace(descLines.length * 14 + 4)
      const rowTop = y
      descLines.forEach((line, idx) => {
        page.drawText(line, { x: MARGIN + 8, y: y - idx * 12, size: 10, font, color: DARK })
      })
      const amtText = amount(it.amount, quote.currency)
      page.drawText(amtText, {
        x: A4.w - MARGIN - 8 - font.widthOfTextAtSize(amtText, 10),
        y: rowTop,
        size: 10,
        font,
        color: DARK,
      })
      y -= descLines.length * 12 + 8
      page.drawLine({ start: { x: MARGIN, y: y + 2 }, end: { x: A4.w - MARGIN, y: y + 2 }, thickness: 0.5, color: LIGHT })
      y -= 4
    }
    y -= 4
  }

  // --- Totali ---
  const drawTotalRow = (label: string, value: string, strong = false) => {
    ensureSpace(18)
    const f = strong ? bold : font
    const size = strong ? 12 : 10
    page.drawText(label, { x: MARGIN, y, size, font: f, color: strong ? DARK : GRAY })
    page.drawText(value, {
      x: A4.w - MARGIN - f.widthOfTextAtSize(value, size),
      y,
      size,
      font: f,
      color: strong ? DARK : DARK,
    })
    y -= size + 8
  }

  if (quote.total_amount != null) {
    const vatLabel = quote.vat_included ? "(IVA inclusa)" : "(IVA esclusa)"
    drawTotalRow(`Totale ${vatLabel}`, amount(quote.total_amount, quote.currency), true)
  }
  if (quote.deposit_amount != null) {
    drawTotalRow("Acconto richiesto", amount(quote.deposit_amount, quote.currency))
  }
  y -= 4

  // --- Condizioni di pagamento ---
  if (quote.payment_terms) {
    drawText("Condizioni di pagamento", { size: 11, font: bold, color: AMBER })
    drawParagraph(quote.payment_terms, 10, DARK)
  }

  // --- Footer su ogni pagina ---
  const pages = doc.getPages()
  for (const p of pages) {
    p.drawText(
      sanitize("4BID S.r.l. - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI) - P.IVA 06241710489 - clienti@4bid.it"),
      { x: MARGIN, y: MARGIN - 20, size: 8, font, color: GRAY },
    )
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}
