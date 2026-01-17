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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: white; padding: 30px; text-align: center; border-bottom: 2px solid #f59e0b; }
        .header img { height: 60px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1a1a1a; margin-top: 0; }
        .info-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px; }
        .info-box p { margin: 12px 0; }
        .info-box strong { color: #1a1a1a; }
        .link-value { color: #3b82f6; word-break: break-all; }
        .password-value { font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #f59e0b; background: #fff; padding: 10px 15px; border: 2px dashed #f59e0b; border-radius: 4px; display: inline-block; margin-top: 8px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9fafb; color: #6b7280; padding: 25px; text-align: center; font-size: 13px; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75" alt="4BID" />
        </div>
        
        <div class="content">
          <h2>Business Plan Condiviso</h2>
          
          <p>Ti è stato condiviso l'accesso al business plan: <strong>${planName}</strong></p>
          
          <div class="info-box">
            <p><strong>Link di accesso:</strong></p>
            <p class="link-value">${link}</p>
            
            <p style="margin-top: 20px;"><strong>Password:</strong></p>
            <p><span class="password-value">${body.password}</span></p>
          </div>
          
          <p style="text-align: center;">
            <a href="${link}" class="button">Visualizza Business Plan</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Potrai consultare tutte le sezioni, le proiezioni finanziarie e lasciare commenti.
            ${body.can_download ? " È anche possibile scaricare il PDF." : ""}
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
