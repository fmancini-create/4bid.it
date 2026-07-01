import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notifyAdminQuoteAccepted } from "@/lib/quotes/email"
import type { QuoteRequestedField, SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("token", token)
    .maybeSingle<SalesChannelQuote>()

  if (error || !quote) {
    return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  }
  if (quote.status === "paid") {
    return NextResponse.json({ error: "Preventivo già completato" }, { status: 409 })
  }
  if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
    return NextResponse.json({ error: "Questo preventivo è scaduto" }, { status: 410 })
  }

  const acceptanceName: string = (body.acceptance_name || "").trim()
  if (!acceptanceName) {
    return NextResponse.json({ error: "Il nome per l'accettazione è obbligatorio" }, { status: 400 })
  }
  if (!body.accepted) {
    return NextResponse.json({ error: "Devi accettare il preventivo e le condizioni" }, { status: 400 })
  }

  const paymentMethod = body.payment_method
  if (paymentMethod !== "bonifico" && paymentMethod !== "card") {
    return NextResponse.json({ error: "Metodo di pagamento non valido" }, { status: 400 })
  }

  // Validate requested fields
  const submitted: Record<string, string> = {}
  const requested = (quote.requested_fields || []) as QuoteRequestedField[]
  const incoming = (body.submitted_fields || {}) as Record<string, string>
  for (const field of requested) {
    const value = (incoming[field.key] ?? "").toString().trim()
    if (field.required && !value) {
      return NextResponse.json({ error: `Campo obbligatorio mancante: ${field.label}` }, { status: 400 })
    }
    submitted[field.key] = value
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null

  const nowIso = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase
    .from("sales_channel_quotes")
    .update({
      submitted_fields: submitted,
      submitted_at: nowIso,
      accepted_at: nowIso,
      acceptance_name: acceptanceName,
      acceptance_ip: ip,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "bonifico" ? "awaiting_transfer" : "pending",
      status: "accepted",
      updated_at: nowIso,
    })
    .eq("id", quote.id)
    .select()
    .single<SalesChannelQuote>()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Errore salvataggio" }, { status: 500 })
  }

  // Notify admin (best-effort)
  try {
    await notifyAdminQuoteAccepted(updated, SUPER_ADMIN_EMAIL)
  } catch (e) {
    console.error("[v0] notifyAdminQuoteAccepted error:", e)
  }

  return NextResponse.json({ success: true, payment_method: paymentMethod })
}
