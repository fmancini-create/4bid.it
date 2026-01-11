import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

export async function POST(request: Request, { params }: { params: Promise<{ id: string; shareId: string }> }) {
  try {
    const { id: planId, shareId } = await params
    const supabase = createAdminClient()

    // Get share details
    const { data: share, error: shareError } = await supabase
      .from("business_plan_shares")
      .select("*, business_plans(name, client_name)")
      .eq("id", shareId)
      .eq("business_plan_id", planId)
      .single()

    if (shareError || !share) {
      console.error("[v0] Resend: share not found", shareError)
      return NextResponse.json({ error: "Condivisione non trovata" }, { status: 404 })
    }

    // Send email
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"}/business-plan/${share.token}`
    const planName = share.business_plans?.client_name || share.business_plans?.name || "Business Plan"

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Business Plan Condiviso</h1>
            </div>
            <div class="content">
              <p>Hai ricevuto nuovamente l'accesso al business plan: <strong>${planName}</strong></p>
              
              <div class="credentials">
                <p><strong>Link di accesso:</strong><br>${link}</p>
                <p><strong>Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${share.password}</code></p>
              </div>
              
              <p style="text-align: center;">
                <a href="${link}" class="button">Visualizza Business Plan</a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px;">Questo link è personale e non deve essere condiviso con altri.</p>
            </div>
            <div class="footer">
              <p><strong>4BID S.r.l.</strong><br>
              Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)<br>
              P.IVA: 06241710489</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResult = await sendEmail({
      to: share.email,
      subject: `Business Plan: ${planName} - Link Reinviato`,
      html: emailHtml,
    })

    if (!emailResult.success) {
      console.error("[v0] Resend: email failed", emailResult.error)
      return NextResponse.json({ error: "Errore nell'invio dell'email" }, { status: 500 })
    }

    console.log("[v0] Resend: email sent successfully to", share.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Resend error:", error)
    return NextResponse.json({ error: "Errore durante il reinvio" }, { status: 500 })
  }
}
