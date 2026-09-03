import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/email-smtp"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

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
  const recipientName = typeof body.recipient_name === "string" ? body.recipient_name.trim() : ""
  const { data: plan } = await supabase
    .from("business_plans")
    .select("name, client_name, project_type")
    .eq("id", id)
    .single()
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
  const isBankDossier = plan?.project_type === "corporate_saas"
  const safePassword = escapeHtml(String(body.password))
  const safeName = escapeHtml(recipientName)
  const salutation = safeName ? `<p>Buongiorno ${safeName},</p>` : ""

  const emailHtml = isBankDossier
    ? `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#1f2937"><div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;padding:34px;border:1px solid #e5e7eb"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#b7791f;font-weight:bold">4BID S.r.l.</div><h2 style="margin:8px 0 18px">Dossier Banca &amp; Investitori</h2>${salutation}<p>Filippo Mancini ti ha condiviso il dossier riservato 4BID, con piano industriale, scenari economico-finanziari e presentazione interattiva.</p><p>Per accedere utilizza la password personale qui sotto.</p><div style="margin:22px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Password</div><div style="font-family:monospace;font-size:22px;font-weight:bold;margin-top:4px">${safePassword}</div></div><p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:bold">Apri il dossier</a></p><p style="font-size:13px;color:#64748b">All'accesso verranno richiesti nome e cognome, email e società. Il link è personale; aperture e visualizzazioni possono essere registrate per la gestione della condivisione.</p><img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0" /></div></body></html>`
    : `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#333"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:32px"><h2>${escapeHtml(planName)}</h2><p>Ti è stato condiviso l'accesso al preventivo/business plan.</p><p><strong>Password:</strong> <span style="font-family:monospace;font-size:20px;color:#f59e0b">${safePassword}</span></p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold">Visualizza preventivo</a></p><p style="font-size:13px;color:#777">Il link è personale. Le aperture dell'email e le visualizzazioni del documento possono essere registrate per finalità di gestione commerciale.</p><img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0" /></div></body></html>`

  let emailSent = false
  try {
    const emailResult = await sendEmail({
      to: email,
      subject: isBankDossier ? "4BID S.r.l. — Dossier Banca & Investitori" : `Business Plan: ${planName} - Accesso Condiviso`,
      html: emailHtml,
    })
    emailSent = Boolean(emailResult.success)
    if (emailSent) {
      await supabase.from("business_plan_share_events").insert({
        share_id: data.id,
        business_plan_id: id,
        event_type: "email_sent",
        recipient_email: email,
        metadata: isBankDossier && recipientName ? { recipient_name: recipientName, dossier: "bank" } : undefined,
      })
    }
  } catch (emailError) {
    console.error("[share] email exception", emailError)
  }

  return NextResponse.json({ ...data, link, shareLink: link, emailSent })
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
