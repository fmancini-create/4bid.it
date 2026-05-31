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

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("dem_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })
    }

    // Determine base URL (used only to resolve attachment paths)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : request.headers.get("origin") || "https://www.4bid.it")

    // Strip attachment markers and resolve the files
    const { html: templateWithoutMarkers, attachments: attachmentRefs } = extractAttachments(
      campaign.html_template
    )
    const resolvedAttachments: { filename: string; content: Buffer; contentType?: string }[] = []
    for (const ref of attachmentRefs) {
      const file = await fetchAttachment(baseUrl, ref)
      if (file) resolvedAttachments.push(file)
    }

    // Personalize with placeholder data so the test mail looks realistic.
    // No tracking pixel/links and nothing is saved to the database.
    const personalizedHtml = personalizeTemplate(templateWithoutMarkers, {
      nome: "Mario",
      cognome: "Rossi",
      nome_azienda: "Redazione di Prova",
      email,
    })

    const result = await sendEmail({
      to: email,
      subject: `[PROVA] ${campaign.subject}`,
      html: personalizedHtml,
      attachments: resolvedAttachments.length > 0 ? resolvedAttachments : undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invio di prova fallito" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, to: email })
  } catch (error) {
    console.error("DEM send-test error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno del server" },
      { status: 500 }
    )
  }
}
