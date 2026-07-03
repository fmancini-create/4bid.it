import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createAdminClient()

  const { data: campaigns, error } = await supabase
    .from("dem_campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ campaigns })
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const { name, subject, html_template, track_opens, track_clicks, attach_as_link } =
      await request.json()

    if (!name || !subject || !html_template) {
      return NextResponse.json(
        { error: "Nome, oggetto e template sono obbligatori" },
        { status: 400 }
      )
    }

    const { data: campaign, error } = await supabase
      .from("dem_campaigns")
      .insert({
        name,
        subject,
        html_template,
        status: "draft",
        sent_count: 0,
        failed_count: 0,
        open_count: 0,
        click_count: 0,
        unique_opens: 0,
        unique_clicks: 0,
        // Opzioni deliverability (default sicuri se non specificate).
        track_opens: typeof track_opens === "boolean" ? track_opens : true,
        track_clicks: typeof track_clicks === "boolean" ? track_clicks : true,
        attach_as_link: typeof attach_as_link === "boolean" ? attach_as_link : false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID campagna mancante" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    // Azioni sulla coda destinatari:
    //  - "resume": riprende l'invio (paused -> pending), cosi i contatti tornano inviabili
    //  - "pause":  mette in pausa la coda (pending -> paused), blocca ogni nuovo invio
    if (body.queue_action === "resume" || body.queue_action === "pause") {
      const from = body.queue_action === "resume" ? "paused" : "pending"
      const to = body.queue_action === "resume" ? "pending" : "paused"
      const { count, error: queueError } = await supabase
        .from("dem_recipients")
        .update({ send_status: to }, { count: "exact" })
        .eq("campaign_id", id)
        .eq("send_status", from)

      if (queueError) {
        return NextResponse.json({ error: queueError.message }, { status: 500 })
      }
      updates.queueMoved = count || 0
    }

    // Opzioni deliverability modificabili anche a campagna gia' creata.
    if (typeof body.track_opens === "boolean") updates.track_opens = body.track_opens
    if (typeof body.track_clicks === "boolean") updates.track_clicks = body.track_clicks
    if (typeof body.attach_as_link === "boolean") updates.attach_as_link = body.attach_as_link

    // Toggle invio automatico a scaglioni (warm-up gestito dal cron dem-auto-send).
    if (typeof body.auto_send === "boolean") {
      updates.auto_send = body.auto_send
      // Riattivando da zero, azzera la data di avvio warm-up (riparte dal giorno 1).
      if (body.auto_send === true) {
        updates.auto_started_on = null
      }
    }

    // Estrae i campi non-colonna prima di aggiornare la tabella campagne.
    const queueMoved = (updates.queueMoved as number | undefined) ?? undefined
    delete updates.queueMoved

    if (Object.keys(updates).length === 0 && queueMoved === undefined) {
      return NextResponse.json({ error: "Nessun campo aggiornabile" }, { status: 400 })
    }

    // Se c'e' solo l'azione coda (nessun campo campagna), ritorna senza toccare dem_campaigns.
    if (Object.keys(updates).length === 0) {
      const { data: campaign } = await supabase.from("dem_campaigns").select("*").eq("id", id).single()
      return NextResponse.json({ campaign, queueMoved })
    }

    updates.updated_at = new Date().toISOString()

    const { data: campaign, error } = await supabase
      .from("dem_campaigns")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaign, queueMoved })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID campagna mancante" }, { status: 400 })
  }

  // Delete recipients first
  await supabase.from("dem_tracking_events").delete().eq("campaign_id", id)
  await supabase.from("dem_recipients").delete().eq("campaign_id", id)

  const { error } = await supabase.from("dem_campaigns").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
