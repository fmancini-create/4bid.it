import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/email-smtp"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("business_plan_shares")
    .select("id, email, token, can_edit, can_download, expires_at, last_accessed_at, access_count, created_at")
    .eq("business_plan_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching shares:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log("[v0] Share POST - business_plan_id:", id)

  const supabase = createAdminClient()
  const body = await request.json()
  console.log("[v0] Share POST - body:", { email: body.email, hasPassword: !!body.password })

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email e password sono obbligatori" }, { status: 400 })
  }

  // Fetch business plan name for email
  const { data: plan } = await supabase.from("business_plans").select("name, client_name").eq("id", id).single()

  // Hash della password
  const passwordHash = await bcrypt.hash(body.password, 10)
  const token = randomUUID()

  console.log("[v0] Share POST - inserting with token:", token)

  const { data, error } = await supabase
    .from("business_plan_shares")
    .insert({
      business_plan_id: id,
      email: body.email,
      password_hash: passwordHash,
      token: token,
      can_edit: body.can_edit ?? false,
      can_download: body.can_download ?? true,
      expires_at: body.expires_at || null,
      access_count: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Share POST - error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] Share POST - success, share id:", data.id)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const link = `${baseUrl}/business-plan/${token}`

  const planName = plan?.client_name || plan?.name || "Business Plan"
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
        .button:hover { box-shadow: 0 6px 12px rgba(245, 158, 11, 0.4); }
        .info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px; font-size: 14px; }
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
          <h2>🎉 Business Plan Condiviso con Te</h2>
          
          <p>Ciao! Ti è stato condiviso l'accesso al business plan:</p>
          
          <div class="plan-name">${planName}</div>
          
          <div class="credentials">
            <p><strong>🔗 Link di accesso:</strong></p>
            <div class="credential-value">${link}</div>
            
            <p style="margin-top: 20px;"><strong>🔑 Password:</strong></p>
            <div class="credential-value" style="font-size: 18px; font-weight: bold; color: #f59e0b;">${body.password}</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${link}" class="button">📊 Visualizza Business Plan</a>
          </div>
          
          <div class="info">
            <strong>💡 Cosa puoi fare:</strong><br>
            • Visualizzare tutte le sezioni del business plan<br>
            • Consultare le proiezioni finanziarie dettagliate<br>
            • Lasciare commenti e feedback<br>
            ${body.can_download ? "• Scaricare il PDF del business plan" : ""}
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

  try {
    const emailResult = await sendEmail({
      to: body.email,
      subject: `Business Plan: ${planName} - Accesso Condiviso`,
      html: emailHtml,
    })

    if (emailResult.success) {
      console.log("[v0] Share email sent successfully to:", body.email)
    } else {
      console.error("[v0] Share email failed:", emailResult.error)
    }
  } catch (emailError) {
    console.error("[v0] Share email exception:", emailError)
  }

  return NextResponse.json({
    ...data,
    link,
    shareLink: link, // backwards compat
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const shareId = searchParams.get("shareId")

  if (!shareId) {
    return NextResponse.json({ error: "shareId è obbligatorio" }, { status: 400 })
  }

  const { error } = await supabase.from("business_plan_shares").delete().eq("id", shareId).eq("business_plan_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
