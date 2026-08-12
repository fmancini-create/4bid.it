import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: share, error } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, email, first_viewed_at, view_count")
    .eq("token", token)
    .single()

  if (error || !share) {
    return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  }

  const now = new Date().toISOString()
  await supabase
    .from("business_plan_shares")
    .update({
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
  })

  return NextResponse.json({ success: true })
}
