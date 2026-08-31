import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
)

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("sales_channel_quotes")
    .select("id, feedback_email_open_count")
    .eq("token", token)
    .maybeSingle()

  if (data?.id) {
    const now = new Date().toISOString()
    await supabase
      .from("sales_channel_quotes")
      .update({
        feedback_email_opened_at: now,
        feedback_email_open_count: Number(data.feedback_email_open_count || 0) + 1,
        updated_at: now,
      })
      .eq("id", data.id)
  }

  return new NextResponse(GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
