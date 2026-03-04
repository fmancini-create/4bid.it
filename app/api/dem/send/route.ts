import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

const THROTTLE_DELAY_MS = 2000 // 2 seconds between emails to avoid SMTP rate limits

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

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const body = await request.json()
    const { campaign_id } = body

    if (!campaign_id) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 })
    }

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

    // Get pending recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("dem_recipients")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("send_status", "pending")

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

    // Send emails with throttling
    for (const recipient of recipients) {
      try {
        // Personalize template
        const personalizedHtml = personalizeTemplate(campaign.html_template, recipient)

        // Add tracking
        const trackedHtml = addTracking(personalizedHtml, campaign_id, recipient.id, baseUrl)

        // Send email
        const result = await sendEmail({
          to: recipient.email,
          subject: campaign.subject,
          html: trackedHtml,
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

    // Finalize campaign
    await supabase
      .from("dem_campaigns")
      .update({
        status: failedCount === recipients.length ? "failed" : "sent",
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
      total: recipients.length,
    })
  } catch (error) {
    console.error("DEM send error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno del server" },
      { status: 500 }
    )
  }
}
