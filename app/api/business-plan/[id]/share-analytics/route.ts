import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: shares, error } = await supabase
    .from("business_plan_shares")
    .select("id, email, created_at, email_opened_at, email_open_count, first_viewed_at, last_viewed_at, view_count, last_accessed_at, access_count, forwarded_by_share_id")
    .eq("business_plan_id", id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = shares || []
  return NextResponse.json({
    summary: {
      recipients: rows.length,
      emailOpened: rows.filter((s) => (s.email_open_count || 0) > 0).length,
      viewed: rows.filter((s) => (s.view_count || 0) > 0 || (s.access_count || 0) > 0).length,
      forwarded: rows.filter((s) => !!s.forwarded_by_share_id).length,
    },
    recipients: rows,
  })
}
