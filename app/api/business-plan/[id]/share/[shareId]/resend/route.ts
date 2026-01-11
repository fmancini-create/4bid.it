import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

export async function POST(request: Request, { params }: { params: Promise<{ id: string; shareId: string }> }) {
  try {
    const { id: planId, shareId } = await params
    const supabase = createAdminClient()

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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
    const link = `${baseUrl}/business-plan/${share.token}`
    const planName = share.business_plans?.client_name || share.business_plans?.name || "Business Plan"

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 40px 20px; text-align: center; }
          .header img { height: 60px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1a1a1a; margin-top: 0; font-size: 24px; }
          .plan-name { font-size: 20px; font-weight: bold; color: #f59e0b; margin: 20px 0; }
          .credentials { background: #f9fafb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px; }
          .credentials p { margin: 10px 0; font-size: 14px; }
          .credentials strong { color: #1a1a1a; font-size: 16px; }
          .credential-value { font-family: 'Courier New', monospace; background: #fff; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3); }
          .info { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; font-size: 14px; }
          .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 13px; line-height: 1.8; }
          .footer strong { color: #f59e0b; }
          .footer a { color: #f59e0b; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${baseUrl}/4bid-colorful-logo-white.jpg" alt="4BID.IT" />
          </div>
          
          <div class="content">
            <h2>🔄 Link di Accesso Reinviato</h2>
            
            <p>Ti è stato reinviato il link per accedere al business plan:</p>
            
            <div class="plan-name">${planName}</div>
            
            <div class="credentials">
              <p><strong>🔗 Link di accesso:</strong></p>
              <div class="credential-value">${link}</div>
              
              <p style="margin-top: 20px;"><strong>🔑 Password:</strong></p>
              <div class="info">
                Usa la password che ti è stata inviata nella prima email di condivisione.<br>
                Se hai smarrito la password, contatta chi ti ha condiviso questo business plan.
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${link}" class="button">📊 Visualizza Business Plan</a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>4BID S.r.l.</strong></p>
            <p>Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)</p>
            <p>P.IVA: 06241710489</p>
            <p>📧 <a href="mailto:clienti@4bid.it">clienti@4bid.it</a> | 🌐 <a href="https://www.4bid.it">www.4bid.it</a></p>
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
