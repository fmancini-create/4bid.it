import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-resend"
import { sanitizeHtml, sanitizeInput, isValidEmail } from "@/lib/security"

export async function POST(request: Request) {
  try {
    const { to, name, replyMessage } = await request.json()

    if (!to || !name || !replyMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!isValidEmail(to)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const safeTo = sanitizeInput(to, 255)
    const safeName = sanitizeInput(name, 100)
    const safeReply = sanitizeInput(replyMessage, 5000)

    const result = await sendEmail({
      transactional: true,
      to: safeTo,
      listUnsubscribe: false,
      subject: "Risposta alla tua richiesta - 4BID.IT",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #5B9BD5 0%, #4A90D9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .message { background: white; padding: 20px; border-left: 4px solid #5B9BD5; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>4BID.IT</h1>
                <p>Risposta alla tua richiesta</p>
              </div>
              <div class="content">
                <p>Ciao <strong>${sanitizeHtml(safeName)}</strong>,</p>
                <p>Grazie per averci contattato. Ecco la nostra risposta:</p>
                <div class="message">
                  ${sanitizeHtml(safeReply).replace(/\n/g, "<br>")}
                </div>
                <p>Se hai altre domande, non esitare a contattarci nuovamente.</p>
                <p>Cordiali saluti,<br><strong>Il Team 4BID.IT</strong></p>
                <div class="footer">
                  <p>4BID SRL - San Casciano in Val di Pesa (FI)<br>
                  P.IVA 06241710489 - clienti@4bid.it</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (!result.success) {
      throw new Error(result.error || "Invio email fallito")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending reply:", error)
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 })
  }
}
