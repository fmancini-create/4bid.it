import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

const PIXEL = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "base64")

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: share } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, email, email_open_count")
    .eq("token", token)
    .single()

  if (share) {
    const now = new Date().toISOString()
    await supabase
      .from("business_plan_shares")
      .update({
        email_opened_at: now,
        email_open_count: (share.email_open_count || 0) + 1,
      })
      .eq("id", share.id)

    await supabase.from("business_plan_share_events").insert({
      share_id: share.id,
      business_plan_id: share.business_plan_id,
      event_type: "email_opened",
      recipient_email: share.email,
    })
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": PIXEL.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  })
}
