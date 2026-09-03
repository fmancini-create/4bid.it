import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  BUSINESS_PLAN_SHARE_COOKIE,
  createBusinessPlanShareSession,
  verifyBusinessPlanShareSession,
} from "@/lib/business-plan-share-session"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const signedSession = new URL(request.url).searchParams.get("session") || undefined
  const invitation = verifyBusinessPlanShareSession(signedSession, token)

  if (!invitation) {
    return NextResponse.redirect(new URL(`/business-plan/${token}`, request.url))
  }

  const supabase = createAdminClient()
  const { data: share, error } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, email, expires_at, access_count, first_viewed_at, view_count")
    .eq("id", invitation.shareId)
    .eq("token", token)
    .single()

  if (error || !share) {
    return NextResponse.redirect(new URL(`/business-plan/${token}`, request.url))
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.redirect(new URL(`/business-plan/${token}`, request.url))
  }

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
    recipient_email: invitation.visitorEmail,
    metadata: {
      authenticated: true,
      source: "email_one_click",
      visitor_name: invitation.visitorName,
      visitor_email: invitation.visitorEmail,
      invited_email: share.email || null,
      user_agent: request.headers.get("user-agent"),
    },
  })

  const browserSession = createBusinessPlanShareSession({
    shareId: share.id,
    token,
    visitorName: invitation.visitorName,
    visitorEmail: invitation.visitorEmail,
    visitorCompany: invitation.visitorCompany,
  })

  const response = NextResponse.redirect(new URL(`/business-plan/${token}`, request.url))
  response.cookies.set(BUSINESS_PLAN_SHARE_COOKIE, browserSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
  return response
}
