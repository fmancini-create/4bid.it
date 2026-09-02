import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/email-smtp"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = getBusinessPlanShareSession(request, token)
  if (!session) return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 })

  const supabase = createAdminClient()
  const body = await request.json()

  const emails = Array.from(
    new Set((Array.isArray(body.emails) ? body.emails : []).map((email: string) => email.trim().toLowerCase()).filter(Boolean)),
  ).filter((email) => EMAIL_RE.test(email))

  if (emails.length === 0) return NextResponse.json({ error: "Inserisci almeno un indirizzo email valido" }, { status: 400 })
  if (emails.length > 20) return NextResponse.json({ error: "Puoi inoltrare a massimo 20 destinatari per volta" }, { status: 400 })

  const { data: sourceShare, error } = await supabase
    .from("business_plan_shares")
    .select("*, business_plans(name, client_name)")
    .eq("token", token)
    .eq("id", session.shareId)
    .single()

  if (error || !sourceShare) return NextResponse.json({ error: "Condivisione non valida" }, { status: 404 })
  if (sourceShare.expires_at && new Date(sourceShare.expires_at) < new Date()) {
    return NextResponse.json({ error: "Questa condivisione è scaduta" }, { status: 410 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const planName = sourceShare.business_plans?.client_name || sourceShare.business_plans?.name || "Dossier 4BID"
  const results: Array<{ email: string; success: boolean }> = []

  for (const email of emails) {
    const password = randomUUID().replace(/-/g, "").slice(0, 10)
    const passwordHash = await bcrypt.hash(password, 10)
    const recipientToken = randomUUID()

    const { data: recipientShare, error: insertError } = await supabase
      .from("business_plan_shares")
      .upsert(
        {
          business_plan_id: sourceShare.business_plan_id,
          email,
          password_hash: passwordHash,
          token: recipientToken,
          can_edit: false,
          can_download: sourceShare.can_download ?? true,
          expires_at: sourceShare.expires_at || null,
          access_count: 0,
          email_open_count: 0,
          view_count: 0,
          forwarded_by_share_id: sourceShare.id,
        },
        { onConflict: "business_plan_id,email" },
      )
      .select("id, token")
      .single()

    if (insertError || !recipientShare) {
      results.push({ email, success: false })
      continue
    }

    const link = `${baseUrl}/business-plan/${recipientShare.token}`
    const pixel = `${baseUrl}/api/business-plan/shared/${recipientShare.token}/track/open`
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;background:#f5f5f5;padding:24px"><div style="max-width:600px;margin:auto;background:#fff;padding:32px;border-radius:10px"><h2>${planName}</h2><p>Ti è stato inoltrato un dossier riservato 4BID.</p><p><strong>Password di accesso:</strong> <span style="font-family:monospace;font-size:18px">${password}</span></p><p style="margin:28px 0"><a href="${link}" style="background:#f59e0b;color:#fff;padding:13px 22px;border-radius:6px;text-decoration:none;font-weight:bold">Visualizza dossier</a></p><p style="font-size:12px;color:#777">Il link è personale e permette di registrare le visualizzazioni del documento.</p><img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0" /></div></body></html>`

    const emailResult = await sendEmail({ to: email, subject: `${planName} - Dossier riservato`, html })
    const success = !!emailResult.success
    results.push({ email, success })

    if (success) {
      await supabase.from("business_plan_share_events").insert([
        {
          share_id: recipientShare.id,
          business_plan_id: sourceShare.business_plan_id,
          event_type: "forwarded",
          recipient_email: email,
          metadata: {
            forwarded_by_share_id: sourceShare.id,
            forwarded_by_name: session.visitorName,
            forwarded_by_email: session.visitorEmail,
            forwarded_by_company: session.visitorCompany || null,
          },
        },
        { share_id: recipientShare.id, business_plan_id: sourceShare.business_plan_id, event_type: "email_sent", recipient_email: email },
      ])
    }
  }

  return NextResponse.json({
    success: results.some((r) => r.success),
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).map((r) => r.email),
  })
}
