import { randomUUID } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteLine, calculateQuoteTotal, type QuoteLineItem } from "@/lib/quotes/types"
import { dependencyErrors } from "@/lib/quotes/commercial"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("sales_channel_quotes").select("*").eq("id", id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

const EDITABLE_FIELDS = [
  "client_name", "client_company", "client_email", "client_vat", "client_address",
  "title", "description", "payment_terms", "deposit_amount", "vat_included", "currency",
  "requested_fields", "expires_at",
] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const { data: current, error: readError } = await supabase.from("sales_channel_quotes").select("status").eq("id", id).single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 })
  if (current.status === "paid") return NextResponse.json({ error: "Un preventivo pagato è congelato e non può essere modificato" }, { status: 409 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of EDITABLE_FIELDS) if (key in body) update[key] = body[key]

  if ("expires_at" in body && body.expires_at) {
    const expiry = new Date(String(body.expires_at))
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) return NextResponse.json({ error: "La scadenza deve essere una data futura" }, { status: 400 })
    update.expires_at = expiry.toISOString()
  }

  if (Array.isArray(body.line_items)) {
    const lines = body.line_items.map((item: QuoteLineItem) => calculateQuoteLine({ ...item, id: item.id || randomUUID(), catalog_snapshot: item.catalog_snapshot ?? {} }))
    const dependencies = dependencyErrors(lines)
    if (dependencies.length) return NextResponse.json({ error: dependencies[0], dependency_errors: dependencies }, { status: 422 })
    update.line_items = lines
    update.total_amount = calculateQuoteTotal(lines)
  }

  const { data, error } = await supabase.from("sales_channel_quotes").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: current } = await supabase.from("sales_channel_quotes").select("status").eq("id", id).single()
  if (current?.status === "paid") return NextResponse.json({ error: "Un preventivo pagato non può essere eliminato" }, { status: 409 })
  const { error } = await supabase.from("sales_channel_quotes").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
