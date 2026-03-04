import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: EmailOptions) {
  try {
    const smtpPort = Number.parseInt(process.env.SMTP_PORT || "465")
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return { success: false, error: "Credenziali SMTP non configurate (SMTP_USER / SMTP_PASSWORD)" }
    }

    console.log("[v0] SMTP_HOST:", process.env.SMTP_HOST)
    console.log("[v0] SMTP_PORT:", smtpPort)
    console.log("[v0] SMTP_SECURE:", smtpSecure)
    console.log("[v0] SMTP_USER:", process.env.SMTP_USER)
    console.log("[v0] SMTP_FROM:", process.env.SMTP_FROM)
    console.log("[v0] SMTP_PASSWORD length:", process.env.SMTP_PASSWORD?.length)

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    await transporter.verify()

    const info = await transporter.sendMail({
      from: `"4BID.IT" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      replyTo: replyTo || process.env.SMTP_FROM || process.env.SMTP_USER,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto"
    return { success: false, error: message }
  }
}
