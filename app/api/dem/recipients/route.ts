import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

type Supa = ReturnType<typeof createAdminClient>

// Legge una colonna per intero, a pagine.
//
// TRAPPOLA: PostgREST restituisce al massimo 1.000 righe per query. I disiscritti
// oggi sono 1.267: una `select` semplice ne avrebbe scaricati 1.000 e i restanti
// 267 sarebbero rientrati fra i destinatari SENZA alcun errore visibile.
async function leggiTutteLeEmail(
  query: (da: number, a: number) => PromiseLike<{ data: { email: string | null }[] | null; error: unknown }>
): Promise<string[]> {
  const out: string[] = []
  const passo = 1000
  for (let da = 0; ; da += passo) {
    const { data, error } = await query(da, da + passo - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    for (const r of data) if (r.email) out.push(r.email.trim().toLowerCase())
    if (data.length < passo) break
  }
  return out
}

// Insieme degli indirizzi da NON contattare mai piu':
//  - chi si e' disiscritto (obbligo di legge, vale per tutte le campagne)
//  - gli indirizzi inesistenti o che ci hanno segnalato come spam: continuare a
//    scrivergli danneggia la reputazione del mittente e fa finire in spam anche
//    le email dei destinatari validi
async function caricaSoppressi(supabase: Supa): Promise<{
  soppressi: Set<string>
  disiscritti: number
  nonRecapitabili: number
}> {
  const disiscritti = await leggiTutteLeEmail((da, a) =>
    supabase.from("dem_unsubscribes").select("email").range(da, a)
  )
  const nonRecapitabili = await leggiTutteLeEmail((da, a) =>
    supabase
      .from("dem_recipients")
      .select("email")
      .in("send_status", ["bounced", "complained", "unsubscribed"])
      .range(da, a)
  )
  return {
    soppressi: new Set([...disiscritti, ...nonRecapitabili]),
    disiscritti: new Set(disiscritti).size,
    nonRecapitabili: new Set(nonRecapitabili).size,
  }
}

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

    // Chi si e' disiscritto (o e' irraggiungibile) va escluso QUI, al momento del
    // caricamento. Prima il controllo esisteva solo in fase di invio: i disiscritti
    // venivano comunque caricati e mostrati fra i destinatari, cosi' i numeri in
    // dashboard erano gonfiati e ogni conteggio manuale era fuorviante.
    const { soppressi, disiscritti, nonRecapitabili } = await caricaSoppressi(supabase)

    let scartatiPerDisiscrizione = 0
    const newRecipients = recipients
      .filter((r: { email: string }) => {
        if (!r.email || !r.email.includes("@")) return false
        const email = r.email.trim().toLowerCase()
        if (existingEmails.has(email)) return false
        if (soppressi.has(email)) {
          scartatiPerDisiscrizione++
          return false
        }
        return true
      })
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
        {
          error:
            scartatiPerDisiscrizione > 0
              ? `Nessun destinatario da aggiungere: ${scartatiPerDisiscrizione} esclusi perche' disiscritti o non raggiungibili, gli altri erano duplicati o non validi`
              : "Nessun nuovo destinatario da aggiungere (tutti duplicati o invalidi)",
          added: 0,
          esclusi_disiscritti: scartatiPerDisiscrizione,
        },
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
      // `duplicates` contava anche i disiscritti, che duplicati non sono: teniamo
      // i due numeri distinti, altrimenti l'esclusione resta invisibile.
      duplicates: recipients.length - newRecipients.length - scartatiPerDisiscrizione,
      esclusi_disiscritti: scartatiPerDisiscrizione,
      lista_soppressione: { disiscritti, non_recapitabili: nonRecapitabili },
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
