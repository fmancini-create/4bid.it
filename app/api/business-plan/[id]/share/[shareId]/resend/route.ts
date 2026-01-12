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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: white; padding: 30px; text-align: center; border-bottom: 2px solid #f59e0b; }
          .header img { height: 50px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1a1a1a; margin-top: 0; }
          .info-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .info-box p { margin: 12px 0; }
          .info-box strong { color: #1a1a1a; }
          .link-value { color: #3b82f6; word-break: break-all; }
          .warning-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-top: 15px; font-size: 14px; color: #92400e; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f9fafb; color: #6b7280; padding: 25px; text-align: center; font-size: 13px; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${baseUrl}/4bid-colorful-logo.jpg" alt="4BID.IT" />
          </div>
          
          <div class="content">
            <h2>Link di Accesso Reinviato</h2>
            
            <p>Ti è stato reinviato il link per accedere al business plan: <strong>${planName}</strong></p>
            
            <div class="info-box">
              <p><strong>Link di accesso:</strong></p>
              <p class="link-value">${link}</p>
              
              <div class="warning-box">
                <strong>Password:</strong> Usa la password che ti è stata inviata nella prima email di condivisione.<br>
                Se l'hai smarrita, contatta chi ti ha condiviso questo business plan.
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${link}" class="button">Visualizza Business Plan</a>
            </p>
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
