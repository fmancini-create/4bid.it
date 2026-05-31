import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const { campaign_id, recipients } = await request.json()

    if (!campaign_id || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "campaign_id e recipients sono obbligatori" },
        { status: 400 }
      )
    }

    // Validate campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from("dem_campaigns")
      .select("id, status")
      .eq("id", campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })
    }

    // Get existing recipients to avoid duplicates
    const { data: existing } = await supabase
      .from("dem_recipients")
      .select("email")
      .eq("campaign_id", campaign_id)

    const existingEmails = new Set((existing || []).map((r) => r.email.toLowerCase()))

    // Filter out duplicates
    const newRecipients = recipients
      .filter(
        (r: { email: string }) =>
          r.email && r.email.includes("@") && !existingEmails.has(r.email.toLowerCase())
      )
      .map((r: { email: string; nome?: string; cognome?: string; nome_azienda?: string; tipo_contatto?: string }) => ({
        campaign_id,
        email: r.email.trim().toLowerCase(),
        nome: r.nome || null,
        cognome: r.cognome || null,
        nome_azienda: r.nome_azienda || null,
        tipo_contatto: r.tipo_contatto || null,
        send_status: "pending",
        open_count: 0,
        click_count: 0,
      }))

    if (newRecipients.length === 0) {
      return NextResponse.json(
        { error: "Nessun nuovo destinatario da aggiungere (tutti duplicati o invalidi)", added: 0 },
        { status: 400 }
      )
    }

    // Insert in batches of 100
    let added = 0
    for (let i = 0; i < newRecipients.length; i += 100) {
      const batch = newRecipients.slice(i, i + 100)
      const { error } = await supabase.from("dem_recipients").insert(batch)
      if (error) {
        console.error("Error inserting recipients batch:", error)
      } else {
        added += batch.length
      }
    }

    return NextResponse.json({
      added,
      duplicates: recipients.length - newRecipients.length,
      total: newRecipients.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const { id, email, nome, cognome, nome_azienda, tipo_contatto } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id del destinatario obbligatorio" }, { status: 400 })
    }

    if (email !== undefined && (!email || !email.includes("@"))) {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 })
    }

    // Load the recipient to know its campaign and current status
    const { data: recipient, error: loadError } = await supabase
      .from("dem_recipients")
      .select("id, campaign_id, send_status")
      .eq("id", id)
      .single()

    if (loadError || !recipient) {
      return NextResponse.json({ error: "Destinatario non trovato" }, { status: 404 })
    }

    // If email is changing, make sure it does not collide with another recipient of the same campaign
    if (email !== undefined) {
      const normalized = email.trim().toLowerCase()
      const { data: dup } = await supabase
        .from("dem_recipients")
        .select("id")
        .eq("campaign_id", recipient.campaign_id)
        .eq("email", normalized)
        .neq("id", id)
        .maybeSingle()

      if (dup) {
        return NextResponse.json(
          { error: "Esiste gia' un altro destinatario con questa email in questa campagna" },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, string | null> = {}
    if (email !== undefined) updates.email = email.trim().toLowerCase()
    if (nome !== undefined) updates.nome = nome || null
    if (cognome !== undefined) updates.cognome = cognome || null
    if (nome_azienda !== undefined) updates.nome_azienda = nome_azienda || null
    if (tipo_contatto !== undefined) updates.tipo_contatto = tipo_contatto || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("dem_recipients")
      .update(updates)
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ updated: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id del destinatario obbligatorio" }, { status: 400 })
    }

    const { error } = await supabase.from("dem_recipients").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}
