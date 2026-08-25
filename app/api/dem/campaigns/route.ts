import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { rifiutaSeNonAutorizzato } from "@/lib/dem/autorizzazione"
import { checkEmailProviderHealth, pauseAllDemForProvider } from "@/lib/dem/provider-health"

// `request` va dichiarato anche qui: senza parametro la guardia non potrebbe
// leggere le intestazioni. Prima questa GET restituiva a CHIUNQUE, senza alcun
// cookie, id / oggetto / template HTML di tutte le campagne - cioe' proprio gli
// identificativi che servono per far partire un invio dalla rotta /send.
export async function GET(request: NextRequest) {
  const rifiuto = await rifiutaSeNonAutorizzato(request)
  if (rifiuto) return rifiuto

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
  const rifiuto = await rifiutaSeNonAutorizzato(request)
  if (rifiuto) return rifiuto

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
  const rifiuto = await rifiutaSeNonAutorizzato(request)
  if (rifiuto) return rifiuto

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID campagna mancante" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.auto_send === true) {
      const { data: currentCampaign } = await supabase
        .from("dem_campaigns")
        .select("campaign_kind")
        .eq("id", id)
        .single()
      if (currentCampaign?.campaign_kind === "warm_followup") {
        return NextResponse.json(
          { error: "Le campagne figlie sono gestite dal cron dei solleciti e non possono usare l'invio automatico freddo." },
          { status: 409 },
        )
      }
    }

    // Riattivare o rimuovere una sospensione mentre Resend non risponde
    // ricreerebbe immediatamente l'incidente. La verifica e' priva di invii.
    if (body.auto_send === true || body.auto_paused_reason === null) {
      const health = await checkEmailProviderHealth()
      if (!health.healthy) {
        const reason = await pauseAllDemForProvider(supabase, health)
        await supabase
          .from("dem_campaigns")
          .update({ auto_send: false, auto_paused_reason: reason, updated_at: new Date().toISOString() })
          .eq("id", id)
        return NextResponse.json(
          { error: reason, code: "provider_unavailable", statusCode: health.statusCode },
          { status: 503 },
        )
      }
    }

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

    // Filtro "invia solo alla fascia sicura". Va dichiarato QUI perche' questa
    // rotta accetta un elenco chiuso di campi: senza questa riga la casella in
    // pagina verrebbe scartata in silenzio e sembrerebbe non funzionare.
    if (typeof body.send_only_safe === "boolean") updates.send_only_safe = body.send_only_safe

    // Toggle invio automatico a scaglioni (warm-up gestito dal cron dem-auto-send).
    if (typeof body.auto_send === "boolean") {
      updates.auto_send = body.auto_send
      // Riattivando da zero, azzera la data di avvio warm-up (riparte dal giorno 1).
      if (body.auto_send === true) {
        updates.auto_started_on = null
        // Azzera anche il motivo dell'eventuale sospensione automatica per
        // rimbalzi. Va fatto QUI e non solo dal client: questa rotta accetta un
        // elenco chiuso di campi, quindi un `auto_paused_reason` inviato dalla
        // pagina verrebbe scartato in silenzio e l'avviso resterebbe visibile su
        // una campagna in funzione.
        updates.auto_paused_reason = null
      }
    }

    // Rimozione esplicita della sospensione SENZA riaccendere l'automatico.
    // Serve una via d'uscita: ora l'invio manuale rifiuta le campagne sospese, e
    // senza questo l'unico modo di riprendere sarebbe attivare l'invio
    // automatico, cioe' un effetto piu' ampio di quello voluto.
    if (body.auto_paused_reason === null) {
      updates.auto_paused_reason = null
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
  // La piu' distruttiva del gruppo: cancella campagna, destinatari ed eventi di
  // tracciamento. Era raggiungibile senza credenziali.
  const rifiuto = await rifiutaSeNonAutorizzato(request)
  if (rifiuto) return rifiuto

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
