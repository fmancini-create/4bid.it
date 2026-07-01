import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("sales_channel_quotes").select("*").eq("id", id).single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  return NextResponse.json(data)
}

const EDITABLE_FIELDS = [
  "client_name",
  "client_company",
  "client_email",
  "client_vat",
  "client_address",
  "title",
  "description",
  "payment_terms",
  "line_items",
  "total_amount",
  "deposit_amount",
  "vat_included",
  "currency",
  "requested_fields",
] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of EDITABLE_FIELDS) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Quote PATCH error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from("sales_channel_quotes").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
