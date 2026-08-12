import { randomUUID } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-smtp"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { formatQuoteAmount, type SalesChannelQuote } from "@/lib/quotes/types"

const MAX_RECIPIENTS = 20
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/

function escapeHtml(value: unknown): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function normalizeEmails(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.map(String) : String(value || "").split(/[\n,;]+/)
  return Array.from(
    new Set(
      raw
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0 && email.length <= 254 && EMAIL_RE.test(email)),
    ),
  )
}

function forwardedEmailHtml(options: {
  title: string
  quoteNumber: string | null
  client: string
  amount: string | null
  link: string
  pixel: string
}): string {
  const numberLine = options.quoteNumber
    ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px">Preventivo N. <strong>${escapeHtml(options.quoteNumber)}</strong></p>`
    : ""
  const amountLine = options.amount
    ? `<p style="margin:8px 0 0;font-size:18px;font-weight:700">${escapeHtml(options.amount)}</p>`
    : ""

  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f5f5f5;color:#222;margin:0;padding:24px">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:26px 30px;border-bottom:2px solid #f59e0b;text-align:center"><img src="https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75" alt="4BID" style="height:54px;width:auto"></div>
      <div style="padding:32px 30px">
        <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.06em">Preventivo inoltrato</p>
        <h2 style="margin:0 0 10px;color:#111827">${escapeHtml(options.title)}</h2>
        ${numberLine}
        <p>Ti è stata inoltrata una copia personale del preventivo destinato a <strong>${escapeHtml(options.client)}</strong>.</p>
        <div style="margin:20px 0;padding:16px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb">
          <p style="margin:0;color:#4b5563">La copia è in <strong>sola consultazione</strong>. Solo il destinatario originale può accettare il preventivo o procedere al pagamento.</p>
          ${amountLine}
        </div>
        <p style="text-align:center;margin:28px 0"><a href="${options.link}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 26px;border-radius:7px;text-decoration:none;font-weight:700">Visualizza il preventivo</a></p>
        <p style="margin:0;color:#6b7280;font-size:12px">Il link è personale. Le aperture dell'email e le visualizzazioni della pagina possono essere registrate per la gestione commerciale del preventivo.</p>
        <img src="${options.pixel}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px">
      </div>
    </div>
  </body></html>`
}

type ResolvedSource = {
  quote: SalesChannelQuote
  sourceShareId: string | null
  sourceEmail: string | null
}

async function resolveSource(token: string): Promise<{ source: ResolvedSource | null; setupMissing?: boolean }> {
  const supabase = createAdminClient()
  const { data: directQuote, error: directError } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("token", token)
    .maybeSingle<SalesChannelQuote>()

  if (directError) {
    console.error("[quotes-forward] direct quote lookup failed", directError)
  }
  if (directQuote) {
    return { source: { quote: directQuote, sourceShareId: null, sourceEmail: directQuote.client_email } }
  }

  const { data: sourceShare, error: shareError } = await supabase
    .from("sales_channel_quote_shares")
    .select("id, quote_id, recipient_email")
    .eq("token", token)
    .maybeSingle<{ id: string; quote_id: string; recipient_email: string }>()

  if (shareError) {
    const setupMissing = shareError.code === "42P01" || /sales_channel_quote_shares/i.test(shareError.message || "")
    console.error("[quotes-forward] share lookup failed", shareError)
    return { source: null, setupMissing }
  }
  if (!sourceShare) return { source: null }

  const { data: quote, error: quoteError } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("id", sourceShare.quote_id)
    .maybeSingle<SalesChannelQuote>()

  if (quoteError) console.error("[quotes-forward] source quote lookup failed", quoteError)
  return {
    source: quote
      ? { quote, sourceShareId: sourceShare.id, sourceEmail: sourceShare.recipient_email }
      : null,
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => ({}))
  const requestedEmails = normalizeEmails(body?.emails)

  if (!requestedEmails.length) {
    return NextResponse.json({ error: "Inserisci almeno un indirizzo email valido" }, { status: 400 })
  }
  if (requestedEmails.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `Puoi inoltrare a massimo ${MAX_RECIPIENTS} destinatari per volta` }, { status: 400 })
  }

  const { source, setupMissing } = await resolveSource(token)
  if (!source) {
    return NextResponse.json(
      {
        error: setupMissing
          ? "Il tracciamento degli inoltri non è ancora configurato nel database"
          : "Preventivo o condivisione non validi",
      },
      { status: setupMissing ? 503 : 404 },
    )
  }

  const quote = source.quote
  const alreadyPaid = quote.status === "paid" || quote.payment_status === "paid"
  const expired = alreadyPaid
    ? false
    : Boolean(quote.expired_at) || (quote.expires_at ? new Date(quote.expires_at) < new Date() : false)
  if (expired) {
    return NextResponse.json({ error: "Questo preventivo è scaduto e non può essere inoltrato" }, { status: 410 })
  }

  const blocked = new Set(
    [quote.client_email, source.sourceEmail]
      .map((email) => String(email || "").trim().toLowerCase())
      .filter(Boolean),
  )
  const skipped = requestedEmails.filter((email) => blocked.has(email))
  const emails = requestedEmails.filter((email) => !blocked.has(email))

  if (!emails.length) {
    return NextResponse.json({ error: "Gli indirizzi inseriti ricevono già questo preventivo", skipped }, { status: 400 })
  }

  const supabase = createAdminClient()
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it").replace(/\/$/, "")
  const client = quote.client_company || quote.client_name || "Cliente"
  const amount = quote.total_amount != null
    ? `${formatQuoteAmount(quote.total_amount, quote.currency)} ${quote.vat_included ? "IVA inclusa" : "IVA esclusa"}`
    : null
  const failed: string[] = []
  let sent = 0

  for (const email of emails) {
    const { data: existing, error: existingError } = await supabase
      .from("sales_channel_quote_shares")
      .select("id, token, send_count, forwarded_by_share_id")
      .eq("quote_id", quote.id)
      .eq("recipient_email", email)
      .maybeSingle<{ id: string; token: string; send_count: number; forwarded_by_share_id: string | null }>()

    if (existingError) {
      console.error("[quotes-forward] existing recipient lookup failed", email, existingError)
      failed.push(email)
      continue
    }

    let share = existing
    if (!share) {
      const { data: inserted, error: insertError } = await supabase
        .from("sales_channel_quote_shares")
        .insert({
          quote_id: quote.id,
          token: randomUUID(),
          recipient_email: email,
          forwarded_by_share_id: source.sourceShareId,
        })
        .select("id, token, send_count, forwarded_by_share_id")
        .single<{ id: string; token: string; send_count: number; forwarded_by_share_id: string | null }>()

      if (insertError || !inserted) {
        console.error("[quotes-forward] recipient creation failed", email, insertError)
        failed.push(email)
        continue
      }
      share = inserted
    }

    const link = `${baseUrl}/preventivo/condiviso/${share.token}`
    const pixel = `${baseUrl}/api/quotes/shared/${share.token}/track/open`
    const html = forwardedEmailHtml({
      title: quote.title || "Preventivo 4BID",
      quoteNumber: quote.quote_number,
      client,
      amount,
      link,
      pixel,
    })

    const emailResult = await sendEmail({
      to: email,
      subject: `Preventivo 4BID inoltrato: ${quote.title || quote.quote_number || "proposta commerciale"}`,
      html,
    })

    const now = new Date().toISOString()
    if (!emailResult.success) {
      failed.push(email)
      await supabase
        .from("sales_channel_quote_shares")
        .update({ last_error: emailResult.error || "Invio non riuscito", updated_at: now })
        .eq("id", share.id)
      await supabase.from("sales_channel_quote_share_events").insert({
        share_id: share.id,
        quote_id: quote.id,
        event_type: "email_failed",
        recipient_email: email,
        metadata: { error: emailResult.error || "Invio non riuscito", source_share_id: source.sourceShareId },
      })
      continue
    }

    sent += 1
    await supabase
      .from("sales_channel_quote_shares")
      .update({
        sent_at: now,
        send_count: (share.send_count || 0) + 1,
        last_error: null,
        updated_at: now,
      })
      .eq("id", share.id)

    await supabase.from("sales_channel_quote_share_events").insert([
      {
        share_id: share.id,
        quote_id: quote.id,
        event_type: "forwarded",
        recipient_email: email,
        metadata: { source_share_id: source.sourceShareId, source: source.sourceShareId ? "forwarded_copy" : "original_quote" },
      },
      {
        share_id: share.id,
        quote_id: quote.id,
        event_type: "email_sent",
        recipient_email: email,
        metadata: {},
      },
    ])
  }

  return NextResponse.json({
    success: sent > 0,
    sent,
    failed,
    skipped,
  })
}
