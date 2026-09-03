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
  const logoUrl = `${baseUrl}/logo.png`
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
  const safeRecipientName = escapeHtml(recipientName)
  const safePlanName = escapeHtml(planName)
  const messageHtml = escapeHtml(customMessage).replace(/\n/g, "<br />")

  const emailHtml = isBankDossier
    ? `<!doctype html>
<html lang="it">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>4BID — Dossier Banca & Investitori</title>
  </head>
  <body style="margin:0;padding:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif;color:#172033">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">4BID S.r.l. — Dossier Banca & Investitori · Business Plan 2027–2031</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef1f5">
      <tr>
        <td align="center" style="padding:28px 12px">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(15,23,42,.08)">
            <tr>
              <td style="padding:24px 32px;background:#ffffff;border-bottom:1px solid #e7eaf0">
                <img src="${logoUrl}" width="112" alt="4BID" style="display:block;width:112px;max-width:112px;height:auto;border:0" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;background:#111827;color:#ffffff">
                <div style="font-size:12px;line-height:18px;letter-spacing:1.6px;text-transform:uppercase;color:#e0b15c;font-weight:700">Documento riservato</div>
                <div style="margin-top:8px;font-size:28px;line-height:34px;font-weight:700">Dossier Banca &amp; Investitori</div>
                <div style="margin-top:8px;font-size:15px;line-height:23px;color:#cbd5e1">4BID S.r.l. · Business Plan e scenari economico-finanziari 2027–2031</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f7f8fa;border:1px solid #e5e7eb;border-radius:12px">
                  <tr>
                    <td style="padding:16px 18px;border-bottom:1px solid #e5e7eb">
                      <div style="font-size:11px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:#7c8493;font-weight:700">Destinatario</div>
                      <div style="margin-top:3px;font-size:15px;line-height:22px;font-weight:700;color:#172033">${safeRecipientName}</div>
                    </td>
                    <td style="padding:16px 18px;border-left:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
                      <div style="font-size:11px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:#7c8493;font-weight:700">Piano</div>
                      <div style="margin-top:3px;font-size:15px;line-height:22px;font-weight:700;color:#172033">2027–2031</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px">
                      <div style="font-size:11px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:#7c8493;font-weight:700">Società</div>
                      <div style="margin-top:3px;font-size:15px;line-height:22px;font-weight:700;color:#172033">4BID S.r.l.</div>
                    </td>
                    <td style="padding:16px 18px;border-left:1px solid #e5e7eb">
                      <div style="font-size:11px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:#7c8493;font-weight:700">Accesso</div>
                      <div style="margin-top:3px;font-size:15px;line-height:22px;font-weight:700;color:#172033">Personale e riservato</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 8px">
                <div style="font-size:16px;line-height:26px;color:#252f3f">${messageHtml}</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px 34px">
                <a href="${emailLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:16px;line-height:20px;font-weight:700;padding:15px 30px;border-radius:9px">Apri il piano</a>
                <div style="margin-top:14px;font-size:12px;line-height:18px;color:#7c8493">Il pulsante apre l'accesso personale al dossier condiviso.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:#f7f8fa;border-top:1px solid #e5e7eb">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:13px;line-height:21px;color:#525b6b">
                      <strong style="color:#172033">4BID SRL</strong><br />
                      Via Sorripa, 10 · 50026 San Casciano in Val di Pesa (FI)<br />
                      P.IVA 06241710489 · <a href="mailto:info@4bid.it" style="color:#172033;text-decoration:none">info@4bid.it</a> · <a href="https://4bid.it" style="color:#172033;text-decoration:none">www.4bid.it</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:14px;font-size:11px;line-height:17px;color:#8b93a1">Dossier destinato esclusivamente al destinatario indicato. Le aperture e le visualizzazioni possono essere registrate per la gestione della condivisione.</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px" />
        </td>
      </tr>
    </table>
  </body>
</html>`
    : `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#333"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:32px"><h2>${safePlanName}</h2><p>Ti è stato condiviso l'accesso al preventivo/business plan.</p><p><strong>Password:</strong> <span style="font-family:monospace;font-size:20px;color:#f59e0b">${safePassword}</span></p><p style="margin:28px 0"><a href="${standardLink}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold">Visualizza preventivo</a></p><p style="font-size:13px;color:#777">Il link è personale. Le aperture dell'email e le visualizzazioni del documento possono essere registrate per finalità di gestione commerciale.</p><img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0" /></div></body></html>`

  let emailSent = false
  try {
    const emailResult = await sendEmail({
      to: email,
      ...(isBankDossier && cc ? { cc } : {}),
      subject: isBankDossier ? "4BID S.r.l. — Dossier Banca & Investitori · Business Plan 2027–2031" : `Business Plan: ${planName} - Accesso Condiviso`,
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