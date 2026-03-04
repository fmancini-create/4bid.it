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
