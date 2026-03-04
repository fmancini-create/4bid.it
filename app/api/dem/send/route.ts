import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-smtp"
import { createAdminClient } from "@/lib/supabase/server-admin"

export type TipoContatto = "cliente" | "ex_cliente" | "potenziale" | "fornitore" | "rappresentante"

export interface DemRecipient {
  id?: string
  email: string
  nome: string
  cognome: string
  nomeAzienda: string
  tipoContatto: TipoContatto
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"

function applyTabs(template: string, r: DemRecipient): string {
  return template
    // HTML entity versions: TABCAMPO&lt;nome&gt;
    .replace(/TABCAMPO&lt;cognome&gt;/gi, r.cognome || "")
    .replace(/TABCAMPO&lt;nome azienda&gt;/gi, r.nomeAzienda || "")
    .replace(/TABCAMPO&lt;nome&gt;/gi, r.nome || "")
    .replace(/&lt;cognome&gt;/gi, r.cognome || "")
    .replace(/&lt;nome azienda&gt;/gi, r.nomeAzienda || "")
    .replace(/&lt;nome&gt;/gi, r.nome || "")
    // Plain text versions: TABCAMPO<nome>
    .replace(/TABCAMPO<cognome>/gi, r.cognome || "")
    .replace(/TABCAMPO<nome azienda>/gi, r.nomeAzienda || "")
    .replace(/TABCAMPO<nome>/gi, r.nome || "")
    .replace(/<cognome>/gi, r.cognome || "")
    .replace(/<nome azienda>/gi, r.nomeAzienda || "")
    .replace(/<nome>/gi, r.nome || "")
}

function injectTracking(html: string, campaignId: string, recipientId: string, email: string): string {
  const enc = encodeURIComponent(email)
  const rid = encodeURIComponent(recipientId)

  // Wrap tutti gli <a href="..."> con link di tracking (esclusi mailto: e già trackati)
  const tracked = html.replace(
    /<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*?)>/gi,
    (match, pre, url, post) => {
      if (url.includes("/api/dem/track/")) return match
      const trackUrl = `${BASE_URL}/api/dem/track/click?c=${campaignId}&r=${rid}&e=${enc}&u=${encodeURIComponent(url)}`
      return `<a ${pre}href="${trackUrl}"${post}>`
    }
  )

  // Aggiungi pixel di apertura prima di </body>
  const pixel = `<img src="${BASE_URL}/api/dem/track/open?c=${campaignId}&r=${rid}&e=${enc}" width="1" height="1" style="display:none;border:0;" alt="" />`
  return tracked.includes("</body>")
    ? tracked.replace("</body>", `${pixel}</body>`)
    : tracked + pixel
}

// GET: carica tutte le campagne con i loro destinatari
export async function GET() {
  const supabase = createAdminClient()
  const { data: campaigns, error } = await supabase
    .from("dem_campaigns")
    .select("*, dem_recipients(*)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns })
}

// POST: salva/aggiorna campagna + invia (o solo salva)
export async function POST(request: NextRequest) {
  try {
    const { campaignId, name, subject, htmlTemplate, recipients, testMode, saveOnly } = await request.json()
    const supabase = createAdminClient()

    // ── 1. Upsert campagna ──────────────────────────────────────────
    let campaign
    if (campaignId) {
      const { data, error } = await supabase
        .from("dem_campaigns")
        .update({ name, subject, html_template: htmlTemplate, updated_at: new Date().toISOString() })
        .eq("id", campaignId)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      campaign = data
    } else {
      const { data, error } = await supabase
        .from("dem_campaigns")
        .insert({ name: name || "Campagna " + new Date().toLocaleDateString("it-IT"), subject, html_template: htmlTemplate })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      campaign = data
    }

    // ── 2. Sync destinatari ──────────
    // Prepara la lista da inserire
    const toInsert = (recipients || [])
      .filter((r: DemRecipient) => r.email || r.nome || r.cognome || r.nomeAzienda)
      .map((r: DemRecipient) => ({
        campaign_id: campaign.id,
        email: (r.email || "").trim().toLowerCase(),
        nome: r.nome?.trim() || "",
        cognome: r.cognome?.trim() || "",
        nome_azienda: r.nomeAzienda?.trim() || "",
        tipo_contatto: r.tipoContatto || "potenziale",
      }))

    // Cancella i vecchi e inserisci i nuovi
    await supabase.from("dem_recipients").delete().eq("campaign_id", campaign.id)
    if (toInsert.length) {
      const { error: insertErr } = await supabase.from("dem_recipients").insert(toInsert)
      if (insertErr) {
        return NextResponse.json({ error: "Errore nel salvare i destinatari: " + insertErr.message }, { status: 500 })
      }
    }

    // ── 3. Se saveOnly, stop qui ─────────────────────────────────────
    if (saveOnly) {
      return NextResponse.json({ success: true, campaignId: campaign.id, saved: true })
    }

    // ── 4. Invio email ───────────────────────────────────────────────
    if (!subject || !htmlTemplate || !recipients?.length) {
      return NextResponse.json({ error: "Dati mancanti per l'invio" }, { status: 400 })
    }

    const SUPERADMIN_EMAIL = "f.mancini@4bid.it"
    const validRecipients: DemRecipient[] = recipients.filter((r: DemRecipient) => r.email?.includes("@"))
    // In test mode invia SEMPRE al superadmin, con i dati del primo destinatario per la preview delle variabili
    const testRecipient: DemRecipient = {
      ...(validRecipients[0] || { email: SUPERADMIN_EMAIL, nome: "Test", cognome: "Admin", nomeAzienda: "4BID", tipoContatto: "cliente" }),
      email: SUPERADMIN_EMAIL,
    }
    const targetRecipients = testMode ? [testRecipient] : validRecipients
    const results: { email: string; success: boolean; error?: string }[] = []

    // Recupera gli ID reali dei destinatari dal DB per il tracking
    const { data: dbRecipients } = await supabase
      .from("dem_recipients")
      .select("id, email")
      .eq("campaign_id", campaign.id)

    const recipientIdMap = new Map((dbRecipients || []).map((r: { id: string; email: string }) => [r.email, r.id]))

    for (const recipient of targetRecipients) {
      const recipientId = recipientIdMap.get(recipient.email.trim().toLowerCase()) || ""
      const personalizedHtml = injectTracking(
        applyTabs(htmlTemplate, recipient),
        campaign.id,
        recipientId,
        recipient.email.trim().toLowerCase()
      )

      const result = await sendEmail({
        to: recipient.email,
        subject: applyTabs(subject, recipient),
        html: personalizedHtml,
        replyTo: "info@4bid.it",
      })
      results.push({ email: recipient.email, success: result.success, error: result.error })

      // Aggiorna status nel DB
      await supabase
        .from("dem_recipients")
        .update({
          send_status: result.success ? "sent" : "failed",
          sent_at: result.success ? new Date().toISOString() : null,
          error_message: result.error || null,
        })
        .eq("campaign_id", campaign.id)
        .eq("email", recipient.email.trim().toLowerCase())

      if (!testMode) await new Promise((r) => setTimeout(r, 300))
    }

    const sent = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    // Aggiorna contatori campagna
    if (!testMode) {
      await supabase
        .from("dem_campaigns")
        .update({ status: "sent", sent_at: new Date().toISOString(), sent_count: sent, failed_count: failed })
        .eq("id", campaign.id)
    }

    return NextResponse.json({ success: true, campaignId: campaign.id, sent, failed, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore interno del server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
