import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Quotes GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  const insert = {
    client_name: body.client_name ?? "",
    client_company: body.client_company ?? null,
    client_email: body.client_email ?? null,
    client_vat: body.client_vat ?? null,
    client_address: body.client_address ?? null,
    title: body.title || "Ottimizzazione Canali di Vendita",
    description: body.description ?? null,
    payment_terms: body.payment_terms ?? null,
    line_items: Array.isArray(body.line_items) ? body.line_items : [],
    total_amount: body.total_amount ?? null,
    deposit_amount: body.deposit_amount ?? null,
    vat_included: body.vat_included ?? true,
    currency: body.currency || "eur",
    requested_fields: Array.isArray(body.requested_fields) ? body.requested_fields : [],
    status: "draft",
    // Generate the public token upfront so the quote page is reachable (for
    // preview) immediately, even before sending. Sending reuses this token.
    token: randomUUID(),
  }

  const { data, error } = await supabase.from("sales_channel_quotes").insert(insert).select().single()

  if (error) {
    console.error("[v0] Quotes POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
