import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notifyAdminQuoteFeedback } from "@/lib/quotes/lifecycle-email"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const REASONS: Record<string, string> = {
  price: "Prezzo",
  timing: "Tempistiche",
  priority: "Priorità cambiata",
  features: "La proposta non rispondeva alle esigenze",
  competitor: "Scelta di un'altra soluzione",
  internal: "Decisione interna / budget non approvato",
  other: "Altro",
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const body = await request.json().catch(() => ({})) as { reason?: string; note?: string }
  const reasonKey = String(body.reason || "")
  const reason = REASONS[reasonKey]
  const note = String(body.note || "").trim().slice(0, 2000)

  if (!reason) return NextResponse.json({ error: "Seleziona un motivo" }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("token", token)
    .maybeSingle<SalesChannelQuote & { feedback_received_at?: string | null }>()

  if (error || !data) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (data.accepted_at || data.status === "accepted" || data.status === "paid") {
    return NextResponse.json({ error: "Il preventivo risulta già accettato" }, { status: 409 })
  }

  const expired = data.expires_at ? new Date(data.expires_at).getTime() <= Date.now() : false
  if (!expired) return NextResponse.json({ error: "Il preventivo non è ancora scaduto" }, { status: 409 })
  if (data.feedback_received_at) return NextResponse.json({ ok: true, already_received: true })

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("sales_channel_quotes")
    .update({
      feedback_reason: reason,
      feedback_note: note || null,
      feedback_received_at: now,
      updated_at: now,
    })
    .eq("id", data.id)

  if (updateError) return NextResponse.json({ error: "Impossibile salvare il feedback" }, { status: 500 })

  const notified = await notifyAdminQuoteFeedback(data, SUPER_ADMIN_EMAIL, reason, note)
  return NextResponse.json({ ok: true, notified: notified.success })
}
