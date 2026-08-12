import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

const PIXEL = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "base64")

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  try {
    const { data: share, error } = await supabase
      .from("sales_channel_quote_shares")
      .select("id, quote_id, recipient_email, first_email_opened_at, email_open_count")
      .eq("token", token)
      .maybeSingle<{
        id: string
        quote_id: string
        recipient_email: string
        first_email_opened_at: string | null
        email_open_count: number
      }>()

    if (error) {
      console.error("[quotes-share-open] lookup failed", error)
    } else if (share) {
      const now = new Date().toISOString()
      await supabase
        .from("sales_channel_quote_shares")
        .update({
          first_email_opened_at: share.first_email_opened_at || now,
          last_email_opened_at: now,
          email_open_count: (share.email_open_count || 0) + 1,
          updated_at: now,
        })
        .eq("id", share.id)

      await supabase.from("sales_channel_quote_share_events").insert({
        share_id: share.id,
        quote_id: share.quote_id,
        event_type: "email_opened",
        recipient_email: share.recipient_email,
        metadata: {
          user_agent: request.headers.get("user-agent") || null,
        },
      })
    }
  } catch (error) {
    console.error("[quotes-share-open] tracking failed", error)
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
