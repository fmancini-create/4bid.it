import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/email-smtp"
import { createBusinessPlanShareSession } from "@/lib/business-plan-share-session"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let index = 0; index < 12; index += 1) password += chars.charAt(Math.floor(Math.random() * chars.length))
  return password
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

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const recipientName = typeof body.recipient_name === "string" ? body.recipient_name.trim() : ""
  const cc = typeof body.cc === "string" ? body.cc.trim() : ""
  const customMessage = typeof body.message === "string" ? body.message.trim() : ""

  if (!email) return NextResponse.json({ error: "Email obbligatoria" }, { status: 400 })

  const { data: plan } = await supabase
    .from("business_plans")
    .select("name, client_name, project_type")
    .eq("id", id)
    .single()

  const isBankDossier = plan?.project_type === "corporate_saas"
  if (!isBankDossier && !body.password) {
    return NextResponse.json({ error: "Email e password sono obbligatori" }, { status: 400 })
  }
  if (isBankDossier && !recipientName) {
    return NextResponse.json({ error: "Nome e cognome del destinatario obbligatori" }, { status: 400 })
  }
  if (isBankDossier && !customMessage) {
    return NextResponse.json({ error: "Messaggio obbligatorio" }, { status: 400 })
  }

  const password = String(body.password || randomPassword())
  const passwordHash = await bcrypt.hash(password, 10)
  const token = randomUUID()
  const shareValues = {
    business_plan_id: id,
    email,
    password_hash: passwordHash,
    token,
    can_edit: body.can_edit ?? false,
    can_download: body.can_download ?? true,
    expires_at: body.expires_at || null,
    access_count: 0,
    email_open_count: 0,
    view_count: 0,
  }

  const { data: existingShare, error: existingShareError } = await supabase
    .from("business_plan_shares")
    .select("id")
    .eq("business_plan_id", id)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingShareError) {
    return NextResponse.json({ error: existingShareError.message }, { status: 500 })
  }

  const shareQuery = existingShare
    ? supabase.from("business_plan_shares").update(shareValues).eq("id", existingShare.id).select().single()
    : supabase.from("business_plan_shares").insert(shareValues).select().single()

  const { data, error } = await shareQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const standardLink = `${baseUrl}/business-plan/${data.token}`
  const pixel = `${baseUrl}/api/business-plan/shared/${data.token}/track/open`
  const planName = plan?.client_name || plan?.name || "Business Plan"

  const bankEmailSession = isBankDossier
    ? createBusinessPlanShareSession(
        {
          shareId: data.id,
          token: data.token,
          visitorName: recipientName,
          visitorEmail: email,
        },
        60 * 60 * 24 * 14,
      )
    : null
  const emailLink = bankEmailSession
    ? `${baseUrl}/api/business-plan/shared/${data.token}/email-access?session=${encodeURIComponent(bankEmailSession)}`
    : standardLink

  const safePassword = escapeHtml(password)
  const messageHtml = escapeHtml(customMessage).replace(/\n/g, "<br />")

  const emailHtml = isBankDossier
    ? `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#1f2937"><div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;padding:34px;border:1px solid #e5e7eb"><div style="font-size:16px;line-height:1.65">${messageHtml}</div><p style="margin:30px 0 4px"><a href="${emailLink}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 26px;text-decoration:none;border-radius:8px;font-weight:bold">Apri il piano</a></p><img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0" /></div></body></html>`
    : `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#333"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:32px"><h2>${escapeHtml(planName)}</h2><p>Ti è stato condiviso l'accesso al preventivo/business plan.</p><p><strong>Password:</strong> <span style="font-family:monospace;font-size:20px;color:#f59e0b">${safePassword}</span></p><p style="margin:28px 0"><a href="${standardLink}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold">Visualizza preventivo</a></p><p style="font-size:13px;color:#777">Il link è personale. Le aperture dell'email e le visualizzazioni del documento possono essere registrate per finalità di gestione commerciale.</p><img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0" /></div></body></html>`

  let emailSent = false
  try {
    const emailResult = await sendEmail({
      to: email,
      ...(isBankDossier && cc ? { cc } : {}),
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
        metadata: isBankDossier
          ? { recipient_name: recipientName, cc: cc || null, dossier: "bank", personalized_message: true }
          : undefined,
      })
    }
  } catch (emailError) {
    console.error("[share] email exception", emailError)
  }

  if (isBankDossier && !emailSent) {
    return NextResponse.json({ error: "Il server email non ha confermato l'invio" }, { status: 502 })
  }

  return NextResponse.json({ ...data, link: standardLink, shareLink: standardLink, emailSent })
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
