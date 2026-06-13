import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import {
  COMMERCIAL_STATUSES,
  FUNNEL_EVENT_BY_STATUS,
  TERMINAL_COMMERCIAL_STATUSES,
} from "@/lib/dem/warm"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

const ALLOWED_STATUSES = new Set<string>([...COMMERCIAL_STATUSES, "non_interessato"])

// Transizioni di stato commerciale + log evento funnel. Applica lo stop automatico
// quando lo stato e' terminale (es. demo prenotata ferma la sequenza).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body
    if (!id || !status || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "id e stato valido obbligatori" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: recipient, error: loadErr } = await admin
      .from("dem_followup_recipients")
      .select("*")
      .eq("id", id)
      .single()
    if (loadErr || !recipient) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 })
    }

    const nowIso = new Date().toISOString()
    const isTerminal = TERMINAL_COMMERCIAL_STATUSES.has(status)
    const updates: Record<string, unknown> = {
      commercial_status: status,
      updated_at: nowIso,
    }
    // Stati terminali fermano la sequenza (responded = non ricontattare).
    if (isTerminal) updates.responded = true
    if (status === "demo_prenotata" && !recipient.demo_booked_at) {
      updates.demo_booked_at = nowIso
    }

    const { error: updErr } = await admin
      .from("dem_followup_recipients")
      .update(updates)
      .eq("id", id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // Log evento funnel (event_type e' text: nessuna migrazione necessaria).
    const eventType = FUNNEL_EVENT_BY_STATUS[status]
    if (eventType) {
      await admin.from("dem_tracking_events").insert({
        campaign_id: recipient.original_campaign_id,
        recipient_id: recipient.original_recipient_id,
        email: recipient.email,
        event_type: eventType,
        url: null,
      })
    }

    return NextResponse.json({ ok: true, status, stopped: isTerminal })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}
