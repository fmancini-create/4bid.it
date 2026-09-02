import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { QuoteLineItem } from "@/lib/quotes/types"

type QuoteLineWithBadge = QuoteLineItem & { sales_badge?: string | null }

function normalizeBadge(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.replace(/\s+/g, " ").trim().slice(0, 42)
  return normalized || null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json().catch(() => ({}))
  const lineId = String(body?.line_id || "").trim()

  if (!lineId) return NextResponse.json({ error: "Riga preventivo non valida" }, { status: 400 })

  const { data: quote, error: readError } = await supabase
    .from("sales_channel_quotes")
    .select("id,status,accepted_at,line_items")
    .eq("id", id)
    .single()

  if (readError || !quote) return NextResponse.json({ error: readError?.message || "Preventivo non trovato" }, { status: 404 })
  if (quote.status === "paid" || quote.status === "accepted" || quote.accepted_at) {
    return NextResponse.json({ error: "Il preventivo è già stato accettato e non può essere modificato" }, { status: 409 })
  }

  const badge = normalizeBadge(body?.sales_badge)
  const lines = Array.isArray(quote.line_items) ? quote.line_items as QuoteLineWithBadge[] : []
  let found = false

  const nextLines = lines.map(line => {
    if (line.id !== lineId) return line
    found = true
    const next: QuoteLineWithBadge = { ...line }
    if (badge) next.sales_badge = badge
    else delete next.sales_badge
    return next
  })

  if (!found) return NextResponse.json({ error: "Voce del preventivo non trovata" }, { status: 404 })

  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .update({ line_items: nextLines, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,line_items,updated_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, badge, quote: data })
}
