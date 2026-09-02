import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"
import {
  BUSINESS_PLAN_SHARE_COOKIE,
  createBusinessPlanShareSession,
} from "@/lib/business-plan-share-session"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const password = typeof body.password === "string" ? body.password : ""
  const visitorName = typeof body.visitorName === "string" ? body.visitorName.trim() : ""
  const visitorEmail = typeof body.visitorEmail === "string" ? body.visitorEmail.trim().toLowerCase() : ""
  const visitorCompany = typeof body.visitorCompany === "string" ? body.visitorCompany.trim() : ""

  if (!password) return NextResponse.json({ error: "Password richiesta" }, { status: 400 })
  if (!visitorName) return NextResponse.json({ error: "Nome e cognome richiesti" }, { status: 400 })
  if (!EMAIL_RE.test(visitorEmail)) return NextResponse.json({ error: "Email valida richiesta" }, { status: 400 })

  const { data: share, error } = await supabase.from("business_plan_shares").select("*").eq("token", token).single()
  if (error || !share) return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 })
  }

  const isValid = await bcrypt.compare(password, share.password_hash)
  if (!isValid) return NextResponse.json({ error: "Password non corretta" }, { status: 401 })

  const now = new Date().toISOString()
  await supabase
    .from("business_plan_shares")
    .update({
      last_accessed_at: now,
      access_count: (share.access_count || 0) + 1,
      first_viewed_at: share.first_viewed_at || now,
      last_viewed_at: now,
      view_count: (share.view_count || 0) + 1,
    })
    .eq("id", share.id)

  await supabase.from("business_plan_share_events").insert({
    share_id: share.id,
    business_plan_id: share.business_plan_id,
    event_type: "page_viewed",
    recipient_email: visitorEmail,
    metadata: {
      authenticated: true,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_company: visitorCompany || null,
      invited_email: share.email || null,
      user_agent: request.headers.get("user-agent"),
    },
  })

  const session = createBusinessPlanShareSession({
    shareId: share.id,
    token,
    visitorName,
    visitorEmail,
    visitorCompany: visitorCompany || undefined,
  })

  const response = NextResponse.json({ success: true, businessPlanId: share.business_plan_id })
  response.cookies.set(BUSINESS_PLAN_SHARE_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/`,
    maxAge: 60 * 60 * 8,
  })
  return response
}
