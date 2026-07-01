import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { SalesChannelQuote } from "@/lib/quotes/types"

// Public GET: returns quote data needed to render the public page.
// Excludes internal-only columns; the submitted credentials are returned only so the
// client can see what they already entered (same person, same token).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select(
      "id, title, description, payment_terms, line_items, total_amount, deposit_amount, vat_included, currency, client_name, client_company, client_vat, client_address, requested_fields, submitted_fields, submitted_at, accepted_at, acceptance_name, payment_method, payment_status, status, expires_at",
    )
    .eq("token", token)
    .maybeSingle<Partial<SalesChannelQuote>>()

  if (error || !data) {
    return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Questo preventivo è scaduto" }, { status: 410 })
  }

  return NextResponse.json(data)
}
