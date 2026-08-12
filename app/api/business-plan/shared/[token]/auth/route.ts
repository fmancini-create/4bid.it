import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const body = await request.json()
  if (!body.password) return NextResponse.json({ error: "Password richiesta" }, { status: 400 })

  const { data: share, error } = await supabase.from("business_plan_shares").select("*").eq("token", token).single()
  if (error || !share) return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) return NextResponse.json({ error: "Link scaduto" }, { status: 410 })

  const isValid = await bcrypt.compare(body.password, share.password_hash)
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
    recipient_email: share.email,
    metadata: { authenticated: true },
  })

  return NextResponse.json({ success: true, businessPlanId: share.business_plan_id })
}
