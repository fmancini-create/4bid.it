import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { dependencyErrors } from "@/lib/quotes/commercial"
import { calculateQuoteLine, calculateQuoteTotal, type QuoteLineItem } from "@/lib/quotes/types"

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function validateTieredQuantity(item: QuoteLineItem): string | null {
  const config = objectValue(item.configuration)
  if (config.pricing_model !== "tiered_per_seat") return null
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const min = Math.max(1, Number(config.min_quantity) || 1)
  const rawMax = config.max_quantity
  const max = rawMax == null || rawMax === "" ? null : Math.max(min, Number(rawMax) || min)
  if (quantity < min || (max != null && quantity > max)) {
    const range = max == null ? `${min}+` : min === max ? `${min}` : `${min}-${max}`
    return `${item.name || item.description}: la fascia selezionata è valida per ${range} operatori, ma la quantità impostata è ${quantity}.`
  }
  return null
}

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
      catalog_snapshot: item.catalog_snapshot ?? {},
    }))

  const dependencyProblems = dependencyErrors(lineItems)
  if (dependencyProblems.length) {
    return NextResponse.json({ error: dependencyProblems[0], code: "INVALID_PRODUCT_DEPENDENCY" }, { status: 422 })
  }
  for (const item of lineItems) {
    const tierError = validateTieredQuantity(item)
    if (tierError) return NextResponse.json({ error: tierError, code: "INVALID_TIER_QUANTITY" }, { status: 422 })
  }

  const requestedExpiry = body.expires_at ? new Date(String(body.expires_at)) : null
  if (requestedExpiry && Number.isNaN(requestedExpiry.getTime())) {
    return NextResponse.json({ error: "Data di validità non valida" }, { status: 400 })
  }
  if (requestedExpiry && requestedExpiry.getTime() <= Date.now()) {
    return NextResponse.json({ error: "La scadenza del preventivo deve essere futura" }, { status: 400 })
  }
  const expiresAt = requestedExpiry?.toISOString() ?? new Date(Date.now() + 7 * 86400000).toISOString()
  const validDays = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))

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
    valid_days: validDays,
    expires_at: expiresAt,
    status: "draft",
    provisioning_status: "not_required",
    token: randomUUID(),
  }

  const { data, error } = await supabase.from("sales_channel_quotes").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
