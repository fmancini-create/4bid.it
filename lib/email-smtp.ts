import nodemailer from "nodemailer"

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType?: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({ to, subject, html, replyTo, attachments }: EmailOptions) {
  console.log("[v0] sendEmail called - to:", to, "subject:", subject)

  try {
    console.log("[v0] Attempting to send email via Gmail SMTP to:", to)

    const smtpPort = Number.parseInt(process.env.SMTP_PORT || "465")
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465

    console.log("[v0] SMTP Config:")
    console.log("  - Host:", process.env.SMTP_HOST || "smtp.gmail.com")
    console.log("  - Port:", smtpPort)
    console.log("  - Secure:", smtpSecure)
    console.log("  - User:", process.env.SMTP_USER || "NOT SET")
    console.log(
      "  - Password:",
      process.env.SMTP_PASSWORD ? `SET (${process.env.SMTP_PASSWORD.length} chars)` : "NOT SET",
    )
    console.log("  - From:", process.env.SMTP_FROM || process.env.SMTP_USER || "NOT SET")

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("[v0] SMTP credentials not configured")
      return { success: false, error: "SMTP credentials not configured" }
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true,
      logger: true,
    })

    console.log("[v0] Testing SMTP connection...")
    await transporter.verify()
    console.log("[v0] SMTP connection successful")

    const info = await transporter.sendMail({
      from: `"4BID.IT" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      replyTo: replyTo || process.env.SMTP_FROM || process.env.SMTP_USER,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    })

    console.log("[v0] Email sent successfully via SMTP:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending email via SMTP:")
    console.error("  - Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("  - Error message:", error instanceof Error ? error.message : String(error))
    console.error("  - Full error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
