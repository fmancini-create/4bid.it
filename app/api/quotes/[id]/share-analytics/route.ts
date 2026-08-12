import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Accesso riservato" }, { status: 401 })
  }
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data: quote, error: quoteError } = await supabase
    .from("sales_channel_quotes")
    .select("id, quote_number, title, client_name, client_company, client_email, first_viewed_at, last_viewed_at, view_count")
    .eq("id", id)
    .maybeSingle()

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  }

  const { data: shares, error } = await supabase
    .from("sales_channel_quote_shares")
    .select(
      "id, quote_id, recipient_email, forwarded_by_share_id, created_at, sent_at, send_count, first_email_opened_at, last_email_opened_at, email_open_count, first_viewed_at, last_viewed_at, view_count, last_error",
    )
    .eq("quote_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    const setupMissing = error.code === "42P01" || /sales_channel_quote_shares/i.test(error.message || "")
    return NextResponse.json(
      { error: setupMissing ? "Migration di tracciamento non ancora eseguita" : error.message },
      { status: setupMissing ? 503 : 500 },
    )
  }

  const rows = shares || []
  const sentRecipients = rows.filter((row) => (row.send_count || 0) > 0)
  const openedRecipients = rows.filter((row) => (row.email_open_count || 0) > 0)
  const viewedRecipients = rows.filter((row) => (row.view_count || 0) > 0)

  return NextResponse.json({
    quote,
    summary: {
      recipients: rows.length,
      sent: sentRecipients.length,
      opened: openedRecipients.length,
      viewed: viewedRecipients.length,
      openRate: sentRecipients.length ? Math.round((openedRecipients.length / sentRecipients.length) * 100) : 0,
      viewRate: sentRecipients.length ? Math.round((viewedRecipients.length / sentRecipients.length) * 100) : 0,
      totalEmailOpens: rows.reduce((sum, row) => sum + Number(row.email_open_count || 0), 0),
      totalPageViews: rows.reduce((sum, row) => sum + Number(row.view_count || 0), 0),
    },
    recipients: rows,
  })
}
