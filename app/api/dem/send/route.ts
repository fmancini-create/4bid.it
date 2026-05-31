import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-resend"

// Allow long-running sends: 2s throttle x many recipients can exceed the default timeout.
export const maxDuration = 300

const THROTTLE_DELAY_MS = 2000 // 2 seconds between emails to avoid SMTP rate limits

// Max emails per single invocation. With a 2s throttle and a 300s function timeout
// (~150 theoretical max), we keep a safe margin so the function never times out and
// leaves the campaign stuck in "sending". Large lists are sent over multiple clicks.
const DEFAULT_BATCH_LIMIT = 120

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
  // Add tracking pixel for opens
  const trackingPixel = `<img src="${baseUrl}/api/dem/track?t=open&c=${campaignId}&r=${recipientId}" width="1" height="1" style="display:none" alt="" />`

  // Replace links with tracked redirects
  const trackedHtml = html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (match, url) => {
      const trackedUrl = `${baseUrl}/api/dem/track?t=click&c=${campaignId}&r=${recipientId}&u=${encodeURIComponent(url)}`
      return `href="${trackedUrl}"`
    }
  )

  // Insert tracking pixel before </body> or at end
  if (trackedHtml.includes("</body>")) {
    return trackedHtml.replace("</body>", `${trackingPixel}</body>`)
  }
  return trackedHtml + trackingPixel
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface ParsedAttachment {
  path: string
  filename: string
}

// Extract attachment markers like:
// <!--ATTACH:/dem/file.pdf|Nome Visualizzato.pdf-->
// and return the cleaned html plus the list of attachments.
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
    const url = att.path.startsWith("http") ? att.path : `${baseUrl}${att.path.startsWith("/") ? "" : "/"}${att.path}`
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
    const { campaign_id, batch_size } = body

    if (!campaign_id) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 })
    }

    // Clamp the batch size to a safe range (never above the timeout-safe default)
    const batchLimit = Math.min(
      Math.max(1, Number(batch_size) || DEFAULT_BATCH_LIMIT),
      DEFAULT_BATCH_LIMIT
    )

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("dem_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })
    }

    if (campaign.status === "sending") {
      return NextResponse.json({ error: "Campagna gia' in fase di invio" }, { status: 400 })
    }

    // Count how many recipients are still pending (the whole queue)
    const { count: pendingTotal } = await supabase
      .from("dem_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id)
      .eq("send_status", "pending")

    // Get only the next batch of pending recipients (ordered for deterministic progress)
    const { data: recipients, error: recipientsError } = await supabase
      .from("dem_recipients")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("send_status", "pending")
      .order("created_at", { ascending: true })
      .limit(batchLimit)

    if (recipientsError || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Nessun destinatario in attesa" }, { status: 400 })
    }

    // Update campaign status to sending
    await supabase
      .from("dem_campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", campaign_id)

    // Determine base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : request.headers.get("origin") || "https://www.4bid.it")

    let sentCount = campaign.sent_count || 0
    let failedCount = campaign.failed_count || 0

    // Extract attachment markers from the template once, then download the files once
    const { html: templateWithoutMarkers, attachments: attachmentRefs } = extractAttachments(
      campaign.html_template
    )

    const resolvedAttachments: { filename: string; content: Buffer; contentType?: string }[] = []
    for (const ref of attachmentRefs) {
      const file = await fetchAttachment(baseUrl, ref)
      if (file) resolvedAttachments.push(file)
    }

    // Send emails with throttling
    for (const recipient of recipients) {
      try {
        // Personalize template (markers already stripped)
        const personalizedHtml = personalizeTemplate(templateWithoutMarkers, recipient)

        // Add tracking
        const trackedHtml = addTracking(personalizedHtml, campaign_id, recipient.id, baseUrl)

        // Send email
        const result = await sendEmail({
          to: recipient.email,
          subject: campaign.subject,
          html: trackedHtml,
          attachments: resolvedAttachments.length > 0 ? resolvedAttachments : undefined,
        })

        if (result.success) {
          sentCount++
          await supabase
            .from("dem_recipients")
            .update({
              send_status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", recipient.id)
        } else {
          failedCount++
          await supabase
            .from("dem_recipients")
            .update({
              send_status: "failed",
              error_message: result.error || "Errore sconosciuto",
            })
            .eq("id", recipient.id)
        }
      } catch (error) {
        failedCount++
        await supabase
          .from("dem_recipients")
          .update({
            send_status: "failed",
            error_message: error instanceof Error ? error.message : "Errore sconosciuto",
          })
          .eq("id", recipient.id)
      }

      // Update campaign counters periodically
      await supabase
        .from("dem_campaigns")
        .update({
          sent_count: sentCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign_id)

      // Throttle between emails
      await sleep(THROTTLE_DELAY_MS)
    }

    // How many recipients are still pending after this batch
    const remaining = Math.max(0, (pendingTotal || recipients.length) - recipients.length)

    // If there are still pending recipients, keep the campaign resumable (draft) so
    // the operator can send the next batch later (e.g. the next day for SMTP limits).
    // Otherwise the campaign is complete.
    let finalStatus: string
    if (remaining > 0) {
      finalStatus = "draft"
    } else {
      finalStatus = sentCount === 0 ? "failed" : "sent"
    }

    await supabase
      .from("dem_campaigns")
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign_id)

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      batch: recipients.length,
      remaining,
      done: remaining === 0,
    })
  } catch (error) {
    console.error("DEM send error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno del server" },
      { status: 500 }
    )
  }
}
