import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("business_plans").select("*").eq("id", id).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  console.log("[v0] Business Plan PUT - id:", id)
  console.log("[v0] Business Plan PUT - body keys:", Object.keys(body))
  console.log("[v0] Business Plan PUT - executive_summary length:", body.executive_summary?.length || 0)
  console.log("[v0] Business Plan PUT - market_analysis length:", body.market_analysis?.length || 0)

  // Rimuovi campi non modificabili
  delete body.id
  delete body.created_at
  delete body.created_by

  const { data, error } = await supabase.from("business_plans").update(body).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Business Plan PUT error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] Business Plan PUT - success, updated fields:", Object.keys(data || {}))

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from("business_plans").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
