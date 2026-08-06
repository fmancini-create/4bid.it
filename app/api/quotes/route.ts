import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteLine, calculateQuoteTotal, type QuoteLineItem } from "@/lib/quotes/types"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  let quoteNumber: string | null = null
  const { data: numData, error: numError } = await supabase.rpc("next_quote_number")
  if (numError) console.error("[quotes] next_quote_number error:", numError)
  else if (typeof numData === "string") quoteNumber = numData

  const lineItems = (Array.isArray(body.line_items) ? body.line_items : [])
    .map((item: QuoteLineItem) => calculateQuoteLine({
      ...item,
      id: item.id || randomUUID(),
      // The imported source data is intentionally retained as a contractual
      // snapshot, so future catalog changes do not rewrite an issued quote.
      catalog_snapshot: item.catalog_snapshot ?? {},
    }))

  const insert = {
    quote_number: quoteNumber,
    client_name: body.client_name ?? "",
    client_company: body.client_company ?? null,
    client_email: body.client_email ?? null,
    client_vat: body.client_vat ?? null,
    client_address: body.client_address ?? null,
    title: body.title || "Soluzioni e servizi 4Bid",
    description: body.description ?? null,
    payment_terms: body.payment_terms ?? null,
    line_items: lineItems,
    total_amount: calculateQuoteTotal(lineItems),
    deposit_amount: body.deposit_amount ?? null,
    vat_included: body.vat_included ?? true,
    currency: body.currency || "eur",
    requested_fields: Array.isArray(body.requested_fields) ? body.requested_fields : [],
    status: "draft",
    provisioning_status: "not_required",
    token: randomUUID(),
  }

  const { data, error } = await supabase.from("sales_channel_quotes").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
