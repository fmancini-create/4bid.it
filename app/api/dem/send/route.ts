import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-resend"

// Allow long-running sends: throttle x many recipients can exceed the default timeout.
export const maxDuration = 300

// 600ms between emails: well under Resend's ~10 req/s limit, but gentle for
// cold-contact deliverability (no aggressive bursts).
const THROTTLE_DELAY_MS = 600

// Max emails per single invocation. With a 600ms throttle and a 300s function
// timeout (~500 theoretical max), we keep a safe margin so the function never
// times out and leaves the campaign stuck in "sending". For cold lists we also
// recommend sending a few hundred per day and ramping up gradually (warm-up).
const DEFAULT_BATCH_LIMIT = 250

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
  baseUrl: string,
  opts: { trackOpens: boolean; trackClicks: boolean }
): string {
  // Riscrittura link -> redirect tracciato SOLO se il click-tracking e' attivo.
  // Riscrivere ogni link su un dominio diverso dal mittente e' un forte segnale
  // di spam: per le campagne fredde conviene disattivarlo.
  let trackedHtml = html
  if (opts.trackClicks) {
    trackedHtml = html.replace(/href="(https?:\/\/[^"]+)"/gi, (match, url) => {
      const trackedUrl = `${baseUrl}/api/dem/track?t=click&c=${campaignId}&r=${recipientId}&u=${encodeURIComponent(url)}`
      return `href="${trackedUrl}"`
    })
  }

  // Pixel di apertura SOLO se il tracking aperture e' attivo.
  if (!opts.trackOpens) return trackedHtml

  const trackingPixel = `<img src="${baseUrl}/api/dem/track?t=open&c=${campaignId}&r=${recipientId}" width="1" height="1" style="display:none" alt="" />`
  if (trackedHtml.includes("</body>")) {
    return trackedHtml.replace("</body>", `${trackingPixel}</body>`)
  }
  return trackedHtml + trackingPixel
}

// Costruisce un box HTML con i link ai documenti (usato quando la campagna
// preferisce il LINK all'allegato reale: gli allegati su contatti freddi sono
// un forte segnale di spam, un link a un file ospitato e' molto piu' sicuro).
function buildAttachmentLinksHtml(attachments: ParsedAttachment[], baseUrl: string): string {
  if (attachments.length === 0) return ""
  const rows = attachments
    .map((a) => {
      const url = a.path.startsWith("http")
        ? a.path
        : `${baseUrl}${a.path.startsWith("/") ? "" : "/"}${a.path}`
      return `<tr><td style="padding:14px 18px;font-size:13px;color:#5a5a5a;">Documento: <a href="${url}" style="color:#1b2a4a;font-weight:bold;">${a.filename}</a></td></tr>`
    })
    .join("")
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f0;border:1px solid #ece5d6;border-radius:6px;margin:16px 0;"><tbody>${rows}</tbody></table>`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Encode an email as base64url so it travels cleanly inside the unsubscribe URL.
function encodeEmail(email: string): string {
  return Buffer.from(email, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function buildUnsubscribeUrl(baseUrl: string, email: string, campaignId: string): string {
  return `${baseUrl}/api/dem/unsubscribe?e=${encodeEmail(email)}&c=${campaignId}`
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

    // Campagna sospesa dal freno sui rimbalzi: NON si invia, nemmeno a mano.
    //
    // Il freno vive nel cron `dem-auto-send`, ma questa rotta e' un secondo
    // percorso verso lo stesso invio: senza questo controllo la sospensione
    // fermava l'automazione e lasciava il pulsante "Invia" perfettamente
    // funzionante, cioe' proteggeva solo la meta' dei modi di spedire.
    //
    // Rifiuto esplicito con il motivo, non silenzioso: chi preme deve sapere
    // perche' non e' partito nulla. Per riprendere si rimuove la sospensione in
    // modo consapevole (pulsante in pagina), dopo aver ripulito la lista.
    if (campaign.auto_paused_reason) {
      return NextResponse.json(
        {
          error: `Invio bloccato: la campagna e' sospesa per rimbalzi troppo alti. ${campaign.auto_paused_reason}`,
          paused: true,
        },
        { status: 409 },
      )
    }

    // Count how many recipients are still pending (the whole queue)
    const { count: pendingTotal } = await supabase
      .from("dem_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id)
      .eq("send_status", "pending")

    // Get only the next batch of pending recipients (ordered for deterministic progress)
    //
    // FILTRI DI VALIDAZIONE, applicati QUI e non nel ciclo di invio: scartare un
    // indirizzo dopo averlo estratto consumerebbe il lotto senza spedire nulla
    // (100 estratti, 100 scartati, zero email), e all'utente sembrerebbe che
    // l'invio non funzioni.
    //
    // 1) `dominio-morto` e' escluso SEMPRE, anche a filtro spento: il dominio non
    //    ha record MX, quindi la consegna e' impossibile per certezza tecnica,
    //    non per prudenza. Ogni tentativo e' solo un rimbalzo in piu'.
    // 2) `rischio-alto` e' escluso solo se la campagna ha `send_only_safe`.
    //
    // `non-verificato` (errore di rete durante il controllo) e i destinatari mai
    // validati (`null`) restano ammessi: un controllo che non e' riuscito non e'
    // un verdetto sull'indirizzo, e trattarlo come tale bloccherebbe l'invio per
    // un problema nostro.
    const soloSicuri = campaign.send_only_safe === true

    let queryDestinatari = supabase
      .from("dem_recipients")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("send_status", "pending")
      .or("validation_status.is.null,validation_status.neq.dominio-morto")

    if (soloSicuri) {
      queryDestinatari = queryDestinatari.eq("validation_status", "sicuro")
    }

    const { data: recipients, error: recipientsError } = await queryDestinatari
      .order("created_at", { ascending: true })
      .limit(batchLimit)

    if (recipientsError || !recipients || recipients.length === 0) {
      // Messaggio distinto quando il filtro e' la causa: "nessuno in attesa" con
      // 27.000 in coda sarebbe una bugia, e manderebbe a cercare un guasto
      // inesistente invece della casella "solo fascia sicura".
      if (soloSicuri && (pendingTotal || 0) > 0) {
        return NextResponse.json(
          {
            error:
              "Nessun destinatario nella fascia sicura. La coda non e' vuota: " +
              "il filtro \"invia solo alla fascia sicura\" e' attivo. Esegui la " +
              "validazione oppure disattiva il filtro.",
            filtered: true,
          },
          { status: 400 },
        )
      }
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

    // Il totale inviate riparte dal CONTEGGIO REALE delle righe, non dal
    // contatore memorizzato `campaign.sent_count`.
    //
    // Perche': `sent_count` e' un contatore incrementale, e leggerlo come punto
    // di partenza CONGELA un eventuale errore invece di correggerlo. Misurato su
    // tutte e 8 le campagne esistenti: scarto di esattamente +1 (es. clienti,
    // 15 email realmente inviate ma contatore a 14), identico da giorni proprio
    // perche' ogni invio ripartiva dal valore sbagliato.
    //
    // Contando dal vero il numero si autocorregge al primo invio successivo.
    // Includo 'bounced' e 'opened' perche' sono stati SUCCESSIVI a un invio
    // riuscito: escluderli farebbe scendere il totale quando arrivano i
    // rimbalzi, cioe' mostrerebbe meno email di quante sono partite.
    let sentCount = campaign.sent_count || 0
    {
      const { count: giaInviate, error: erroreConteggio } = await supabase
        .from("dem_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign_id)
        .in("send_status", ["sent", "bounced", "opened"])

      // Se la lettura fallisce si tiene il valore memorizzato: degradare a 0
      // azzererebbe il totale storico della campagna, cioe' sostituirebbe un
      // numero leggermente errato con uno gravemente falso.
      if (!erroreConteggio && typeof giaInviate === "number") sentCount = giaInviate
    }
    let failedCount = campaign.failed_count || 0

    // Opzioni deliverability della campagna (default retrocompatibili).
    const trackOpens = campaign.track_opens !== false
    const trackClicks = campaign.track_clicks !== false
    const attachAsLink = campaign.attach_as_link === true

    // Extract attachment markers from the template once, then download the files once
    const { html: templateExtracted, attachments: attachmentRefs } = extractAttachments(
      campaign.html_template
    )

    // Corpo del template (eventualmente arricchito col box link ai documenti).
    let templateWithoutMarkers = templateExtracted
    const resolvedAttachments: { filename: string; content: Buffer; contentType?: string }[] = []

    if (attachAsLink && attachmentRefs.length > 0) {
      // Niente allegati reali: inserisci un box con i link ai documenti ospitati.
      const linksBox = buildAttachmentLinksHtml(attachmentRefs, baseUrl)
      templateWithoutMarkers = templateWithoutMarkers.includes("</body>")
        ? templateWithoutMarkers.replace("</body>", `${linksBox}</body>`)
        : templateWithoutMarkers + linksBox
    } else {
      // Comportamento classico: scarica e allega i file una sola volta.
      for (const ref of attachmentRefs) {
        const file = await fetchAttachment(baseUrl, ref)
        if (file) resolvedAttachments.push(file)
      }
    }

    // Load the global suppression list so we never email anyone who unsubscribed.
    const batchEmails = recipients.map((r) => r.email).filter(Boolean)
    const unsubscribedSet = new Set<string>()
    // Also treat hard bounces / complaints as permanent suppression: an address
    // that already bounced (in ANY campaign) is dead and must never be emailed
    // again, even if the Resend webhook hasn't yet added it to dem_unsubscribes
    // (the webhook can lag or be temporarily misconfigured -> defense in depth).
    const bouncedSet = new Set<string>()
    if (batchEmails.length > 0) {
      const { data: unsubRows } = await supabase
        .from("dem_unsubscribes")
        .select("email")
        .in("email", batchEmails)
      for (const row of unsubRows || []) {
        if (row.email) unsubscribedSet.add(String(row.email).toLowerCase())
      }

      const { data: bouncedRows } = await supabase
        .from("dem_recipients")
        .select("email")
        .in("email", batchEmails)
        .in("send_status", ["bounced", "complained"])
      for (const row of bouncedRows || []) {
        if (row.email) bouncedSet.add(String(row.email).toLowerCase())
      }
    }

    let skippedCount = 0

    // Send emails with throttling
    for (const recipient of recipients) {
      try {
        const emailKey = recipient.email ? String(recipient.email).toLowerCase() : ""
        // Skip and flag anyone on the suppression list (they unsubscribed).
        if (emailKey && unsubscribedSet.has(emailKey)) {
          skippedCount++
          await supabase
            .from("dem_recipients")
            .update({ send_status: "unsubscribed" })
            .eq("id", recipient.id)
          continue
        }
        // Skip anyone who previously hard-bounced or complained: keep them
        // flagged as 'bounced' (do not attempt another send to a dead address).
        if (emailKey && bouncedSet.has(emailKey)) {
          skippedCount++
          await supabase
            .from("dem_recipients")
            .update({ send_status: "bounced" })
            .eq("id", recipient.id)
          continue
        }
        // Personalize template (markers already stripped)
        const personalizedHtml = personalizeTemplate(templateWithoutMarkers, recipient)

        // Add tracking (rewrites only http(s) links, so the {{unsubscribe}} token
        // is left untouched and replaced afterwards with the real, untracked URL).
        const trackedHtml = addTracking(personalizedHtml, campaign_id, recipient.id, baseUrl, {
          trackOpens,
          trackClicks,
        })

        // Build the per-recipient unsubscribe URL and inject it into the footer link.
        const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, recipient.email, campaign_id)
        const finalHtml = trackedHtml.replace(/\{\{\s*unsubscribe\s*\}\}/gi, unsubscribeUrl)

        // Send email with one-click unsubscribe headers (RFC 8058). Mail clients
        // (Gmail, Apple Mail, Outlook) show a native "Unsubscribe" button.
        const result = await sendEmail({
          to: recipient.email,
          subject: campaign.subject,
          html: finalHtml,
          attachments: resolvedAttachments.length > 0 ? resolvedAttachments : undefined,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:clienti@4bid.it?subject=unsubscribe>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
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
    } else if (sentCount === 0 && failedCount > 0) {
      // Nothing delivered and at least one hard failure -> failed.
      finalStatus = "failed"
    } else {
      // Completed (even if some were skipped because unsubscribed).
      finalStatus = "sent"
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
      skipped: skippedCount,
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
