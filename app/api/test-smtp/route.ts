import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-smtp"

export async function GET() {
  try {
    console.log("[v0] Testing SMTP credentials...")

    const result = await sendEmail({
      to: process.env.SMTP_USER || "clienti@4bid.it",
      subject: "Test SMTP - 4BID",
      html: "<h1>Test Email</h1><p>Se ricevi questa email, SMTP funziona correttamente!</p>",
    })

    return NextResponse.json({
      success: result.success,
      message: result.success ? "Email inviata con successo! Controlla la casella di posta." : "Errore invio email",
      error: result.error,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        passwordLength: process.env.SMTP_PASSWORD?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("[v0] Test SMTP error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          passwordLength: process.env.SMTP_PASSWORD?.length || 0,
        },
      },
      { status: 500 },
    )
  }
}
