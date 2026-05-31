import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

function personalizeTemplate(
  template: string,
  recipient: {
    nome?: string
    cognome?: string
    nome_azienda?: string
    email: string
  }
): string {
  return template
    .replace(/\{\{nome\}\}/gi, recipient.nome || "")
    .replace(/\{\{cognome\}\}/gi, recipient.cognome || "")
    .replace(/\{\{nome_azienda\}\}/gi, recipient.nome_azienda || "")
    .replace(/\{\{email\}\}/gi, recipient.email || "")
}

function addTracking(
  html: string,
  campaignId: string,
  recipientId: string,
  baseUrl: string
): string {
  const trackingPixel = `<img src="${baseUrl}/api/dem/track?t=open&c=${campaignId}&r=${recipientId}" width="1" height="1" style="display:none" alt="" />`

  const trackedHtml = html.replace(/href="(https?:\/\/[^"]+)"/gi, (match, url) => {
    const trackedUrl = `${baseUrl}/api/dem/track?t=click&c=${campaignId}&r=${recipientId}&u=${encodeURIComponent(url)}`
    return `href="${trackedUrl}"`
  })

  if (trackedHtml.includes("</body>")) {
    return trackedHtml.replace("</body>", `${trackingPixel}</body>`)
  }
  return trackedHtml + trackingPixel
}

interface ParsedAttachment {
  path: string
  filename: string
}

function extractAttachments(html: string): { html: string; attachments: ParsedAttachment[] } {
  const attachments: ParsedAttachment[] = []
  const cleaned = html.replace(/<!--\s*ATTACH:([^|>]+)\|([^>]+?)\s*-->/gi, (_m, path, filename) => {
    attachments.push({ path: String(path).trim(), filename: String(filename).trim() })
    return ""
  })
  return { html: cleaned, attachments }
}

async function fetchAttachment(
  baseUrl: string,
  att: ParsedAttachment
): Promise<{ filename: string; content: Buffer; contentType?: string } | null> {
  try {
    const url = att.path.startsWith("http")
      ? att.path
      : `${baseUrl}${att.path.startsWith("/") ? "" : "/"}${att.path}`
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`[v0] Allegato non scaricabile (${res.status}):`, url)
      return null
    }
    const arrayBuffer = await res.arrayBuffer()
    return {
      filename: att.filename,
      content: Buffer.from(arrayBuffer),
      contentType: res.headers.get("content-type") || undefined,
    }
  } catch (err) {
    console.error("[v0] Errore download allegato:", err)
    return null
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const body = await request.json()
    const { campaign_id, email } = body

    if (!campaign_id) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 })
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email di prova non valida" }, { status: 400 })
    }
    const testEmail = email.trim().toLowerCase()

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("dem_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })
    }

    // Determine base URL (used for attachments AND tracking)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : request.headers.get("origin") || "https://www.4bid.it")

    // Create or reuse a test recipient so opens/clicks can be tracked and shown in stats.
    // Reset its counters for a clean test. It is flagged tipo_contatto='test' and
    // marked as 'sent' so the real "Invia" (which only targets pending) won't resend it.
    const { data: existing } = await supabase
      .from("dem_recipients")
      .select("id")
      .eq("campaign_id", campaign_id)
      .eq("email", testEmail)
      .maybeSingle()

    let recipientId: string
    const baseFields = {
      nome: "Mario",
      cognome: "Rossi",
      nome_azienda: "Redazione di Prova",
      tipo_contatto: "test",
      send_status: "sent",
      sent_at: new Date().toISOString(),
      error_message: null,
      open_count: 0,
      click_count: 0,
      first_open_at: null,
      last_open_at: null,
      first_click_at: null,
    }

    if (existing) {
      recipientId = existing.id
      await supabase.from("dem_recipients").update(baseFields).eq("id", recipientId)
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("dem_recipients")
        .insert({ campaign_id, email: testEmail, ...baseFields })
        .select("id")
        .single()
      if (insertError || !inserted) {
        return NextResponse.json(
          { error: insertError?.message || "Impossibile creare il contatto di prova" },
          { status: 500 }
        )
      }
      recipientId = inserted.id
    }

    // Strip attachment markers and resolve the files
    const { html: templateWithoutMarkers, attachments: attachmentRefs } = extractAttachments(
      campaign.html_template
    )
    const resolvedAttachments: { filename: string; content: Buffer; contentType?: string }[] = []
    for (const ref of attachmentRefs) {
      const file = await fetchAttachment(baseUrl, ref)
      if (file) resolvedAttachments.push(file)
    }

    // Personalize + add tracking pixel/links tied to the test recipient
    const personalizedHtml = personalizeTemplate(templateWithoutMarkers, {
      nome: baseFields.nome,
      cognome: baseFields.cognome,
      nome_azienda: baseFields.nome_azienda,
      email: testEmail,
    })
    const trackedHtml = addTracking(personalizedHtml, campaign_id, recipientId, baseUrl)

    const result = await sendEmail({
      to: testEmail,
      subject: `[PROVA] ${campaign.subject}`,
      html: trackedHtml,
      attachments: resolvedAttachments.length > 0 ? resolvedAttachments : undefined,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invio di prova fallito" }, { status: 500 })
    }

    return NextResponse.json({ success: true, to: testEmail, tracked: true })
  } catch (error) {
    console.error("DEM send-test error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno del server" },
      { status: 500 }
    )
  }
}
