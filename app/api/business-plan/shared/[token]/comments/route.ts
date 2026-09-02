import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

async function getAuthorizedShare(request: NextRequest, token: string) {
  const session = getBusinessPlanShareSession(request, token)
  if (!session) return { error: NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 }) }

  const supabase = createAdminClient()
  const { data: share, error } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, expires_at")
    .eq("token", token)
    .eq("id", session.shareId)
    .single()

  if (error || !share) return { error: NextResponse.json({ error: "Link non valido" }, { status: 404 }) }
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return { error: NextResponse.json({ error: "Link scaduto" }, { status: 410 }) }
  }

  return { supabase, share, session }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const auth = await getAuthorizedShare(request, token)
  if (auth.error) return auth.error

  const { data: comments, error } = await auth.supabase!
    .from("business_plan_comments")
    .select("*")
    .eq("business_plan_id", auth.share!.business_plan_id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(comments)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const auth = await getAuthorizedShare(request, token)
  if (auth.error) return auth.error

  const { section, content } = await request.json()
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Contenuto richiesto" }, { status: 400 })
  }

  const { data: comment, error } = await auth.supabase!
    .from("business_plan_comments")
    .insert({
      business_plan_id: auth.share!.business_plan_id,
      author_name: auth.session!.visitorName,
      author_email: auth.session!.visitorEmail,
      section: section || "general",
      content: content.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auth.supabase!.from("business_plan_share_events").insert({
    share_id: auth.share!.id,
    business_plan_id: auth.share!.business_plan_id,
    event_type: "comment_added",
    recipient_email: auth.session!.visitorEmail,
    metadata: {
      visitor_name: auth.session!.visitorName,
      visitor_company: auth.session!.visitorCompany || null,
      section: section || "general",
    },
  })

  return NextResponse.json(comment)
}
