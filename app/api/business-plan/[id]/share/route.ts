import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/email-smtp"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("business_plan_shares")
    .select("id, email, token, can_edit, can_download, expires_at, last_accessed_at, access_count, email_opened_at, email_open_count, first_viewed_at, last_viewed_at, view_count, forwarded_by_share_id, created_at")
    .eq("business_plan_id", id)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()
  if (!body.email || !body.password) return NextResponse.json({ error: "Email e password sono obbligatori" }, { status: 400 })

  const email = String(body.email).trim().toLowerCase()
  const { data: plan } = await supabase.from("business_plans").select("name, client_name").eq("id", id).single()
  const passwordHash = await bcrypt.hash(body.password, 10)
  const token = randomUUID()

  const { data, error } = await supabase
    .from("business_plan_shares")
    .upsert({ business_plan_id: id, email, password_hash: passwordHash, token, can_edit: body.can_edit ?? false, can_download: body.can_download ?? true, expires_at: body.expires_at || null, access_count: 0, email_open_count: 0, view_count: 0 }, { onConflict: "business_plan_id,email" })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const link = `${baseUrl}/business-plan/${data.token}`
  const pixel = `${baseUrl}/api/business-plan/shared/${data.token}/track/open`
  const planName = plan?.client_name || plan?.name || "Business Plan"
  const emailHtml = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#333"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:32px"><h2>${planName}</h2><p>Ti è stato condiviso l'accesso al preventivo/business plan.</p><p><strong>Password:</strong> <span style="font-family:monospace;font-size:20px;color:#f59e0b">${body.password}</span></p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold">Visualizza preventivo</a></p><p style="font-size:13px;color:#777">Il link è personale. Le aperture dell'email e le visualizzazioni del documento possono essere registrate per finalità di gestione commerciale.</p><img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0" /></div></body></html>`

  try {
    const emailResult = await sendEmail({ to: email, subject: `Business Plan: ${planName} - Accesso Condiviso`, html: emailHtml })
    if (emailResult.success) {
      await supabase.from("business_plan_share_events").insert({ share_id: data.id, business_plan_id: id, event_type: "email_sent", recipient_email: email })
    }
  } catch (emailError) {
    console.error("[share] email exception", emailError)
  }

  return NextResponse.json({ ...data, link, shareLink: link })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const shareId = new URL(request.url).searchParams.get("shareId")
  if (!shareId) return NextResponse.json({ error: "shareId è obbligatorio" }, { status: 400 })
  const { error } = await supabase.from("business_plan_shares").delete().eq("id", shareId).eq("business_plan_id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
