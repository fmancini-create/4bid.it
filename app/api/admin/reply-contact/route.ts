import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { to, name, replyMessage } = await request.json()

    if (!to || !name || !replyMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await resend.emails.send({
      from: "4BID.IT <noreply@4bid.it>",
      to: to,
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
                <p>Ciao <strong>${name}</strong>,</p>
                <p>Grazie per averci contattato. Ecco la nostra risposta:</p>
                <div class="message">
                  ${replyMessage.replace(/\n/g, "<br>")}
                </div>
                <p>Se hai altre domande, non esitare a contattarci nuovamente.</p>
                <p>Cordiali saluti,<br><strong>Il Team 4BID.IT</strong></p>
                <div class="footer">
                  <p>4BID.IT S.R.L. - ViaExample 123, 50100 Firenze (FI)<br>
                  P.IVA: 01234567890 - info@4bid.it</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending reply:", error)
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 })
  }
}
