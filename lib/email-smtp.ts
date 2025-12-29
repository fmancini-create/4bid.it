import nodemailer from "nodemailer"
import { Resend } from "resend"

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: EmailOptions) {
  // Try Resend first (more reliable)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log("[v0] Attempting to send email via Resend to:", to)
      const resend = new Resend(process.env.RESEND_API_KEY)

      const { data, error } = await resend.emails.send({
        from: "4BID.IT <noreply@4bid.it>",
        to: [to],
        subject,
        html,
        replyTo: replyTo || "info@4bid.it",
      })

      if (error) {
        console.error("[v0] Resend error:", error)
        // Fall through to SMTP
      } else {
        console.log("[v0] Email sent successfully via Resend:", data?.id)
        return { success: true, messageId: data?.id }
      }
    } catch (resendError) {
      console.error("[v0] Resend exception:", resendError)
      // Fall through to SMTP
    }
  }

  // Fallback to SMTP
  try {
    console.log("[v0] Attempting to send email via SMTP to:", to)
    console.log(
      "[v0] SMTP Config - Host:",
      process.env.SMTP_HOST,
      "Port:",
      process.env.SMTP_PORT,
      "User:",
      process.env.SMTP_USER ? "SET" : "NOT SET",
    )

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("[v0] SMTP credentials not configured")
      return { success: false, error: "SMTP credentials not configured" }
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const info = await transporter.sendMail({
      from: `"4BID.IT" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      replyTo: replyTo || process.env.SMTP_FROM || process.env.SMTP_USER,
    })

    console.log("[v0] Email sent successfully via SMTP:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending email via SMTP:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
