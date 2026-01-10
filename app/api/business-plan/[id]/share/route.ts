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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header img { height: 50px; }
        .card { background: #f9f9f9; border-radius: 8px; padding: 24px; margin: 20px 0; }
        .credentials { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; margin: 16px 0; }
        .credentials p { margin: 8px 0; }
        .credentials strong { color: #1a1a1a; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://4bid.it/logo.png" alt="4BID.IT" />
        </div>
        
        <h2>Business Plan Condiviso</h2>
        
        <p>Ti è stato condiviso l'accesso al business plan:</p>
        
        <div class="card">
          <h3 style="margin-top: 0;">${planName}</h3>
          
          <div class="credentials">
            <p><strong>Link:</strong> <a href="${link}">${link}</a></p>
            <p><strong>Password:</strong> ${body.password}</p>
          </div>
          
          <a href="${link}" class="button">Visualizza Business Plan</a>
        </div>
        
        <p>Potrai visualizzare tutte le sezioni del business plan, le proiezioni finanziarie e lasciare commenti.</p>
        
        <div class="footer">
          <p><strong>4BID S.r.l.</strong></p>
          <p>Via Dalmazia, 51 - 72017 Ostuni (BR)</p>
          <p>P.IVA: 02664480745</p>
          <p>Tel: +39 347 968 8586 | Email: info@4bid.it</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await sendEmail({
      to: body.email,
      subject: `Business Plan: ${planName} - Accesso Condiviso`,
      html: emailHtml,
    })
    console.log("[v0] Share email sent successfully to:", body.email)
  } catch (emailError) {
    console.error("[v0] Share email error:", emailError)
    // Non blocchiamo se l'email fallisce
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
