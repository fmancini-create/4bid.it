import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Endpoint compatibile con il webhook transazionale Brevo.
 * Il path storico viene mantenuto per non introdurre un cambio di routing nella
 * stessa PR; il provider effettivo e' Brevo.
 *
 * Sicurezza: BREVO_WEBHOOK_SECRET e' obbligatorio. Brevo puo' autenticare il
 * webhook con Bearer token oppure con header personalizzati. Accettiamo:
 * - Authorization: Bearer <secret>
 * - x-brevo-webhook-secret: <secret>
 * - api-key: <secret>
 * Il valore viene confrontato esattamente e non viene mai loggato.
 */

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  return email.includes("@") ? email : null
}

function extractEmail(payload: Record<string, unknown>): string | null {
  return normalizeEmail(payload.email) || normalizeEmail(payload.recipient) || normalizeEmail(payload.to)
}

function normalizeEvent(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.BREVO_WEBHOOK_SECRET?.trim()
  if (!secret) {
    console.error("[v0] brevo-webhook: BREVO_WEBHOOK_SECRET non configurato")
    return false
  }

  const authorization = request.headers.get("authorization")?.trim() || ""
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : ""

  const provided =
    bearer ||
    request.headers.get("x-brevo-webhook-secret")?.trim() ||
    request.headers.get("api-key")?.trim() ||
    ""

  return provided.length > 0 && provided === secret
}

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "invalid webhook secret" }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const event = normalizeEvent(payload.event || payload.type)
  const email = extractEmail(payload)

  const isHardBounce = event === "hard_bounce" || event === "hardbounce" || event === "blocked"
  const isSoftBounce = event === "soft_bounce" || event === "softbounce" || event === "deferred"
  const isComplaint = event === "spam" || event === "complaint" || event === "complained"
  const isUnsubscribe = event === "unsubscribed" || event === "unsubscribe"

  if (!isHardBounce && !isSoftBounce && !isComplaint && !isUnsubscribe) {
    return NextResponse.json({ ok: true, ignored: event || "unknown" })
  }

  if (!email) {
    return NextResponse.json({ ok: true, note: "no recipient email in payload" })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const payloadReason =
    (typeof payload.reason === "string" && payload.reason) ||
    (typeof payload.message === "string" && payload.message) ||
    (typeof payload.response === "string" && payload.response) ||
    null

  const permanent = isHardBounce || isComplaint || isUnsubscribe
  const reason = isComplaint ? "complaint" : isUnsubscribe ? "link" : "bounce"
  const recipientStatus = isComplaint
    ? "complained"
    : isUnsubscribe
      ? "unsubscribed"
      : "bounced"
  const bounceType = isHardBounce ? "Permanent" : isSoftBounce ? "Temporary" : null

  if (permanent) {
    const { error: supErr } = await supabase
      .from("dem_unsubscribes")
      .upsert(
        {
          email,
          reason,
          bounce_type: bounceType,
          bounce_subtype: event || null,
          bounce_message: payloadReason,
        },
        { onConflict: "email" },
      )
    if (supErr) {
      console.error(`[v0] brevo-webhook: upsert soppressione fallito (${email}):`, supErr.message)
    }
  }

  const { error: recErr } = await supabase
    .from("dem_recipients")
    .update({
      send_status: recipientStatus,
      error_message: ["Brevo", event, bounceType, payloadReason].filter(Boolean).join(" | "),
      bounce_type: bounceType,
    })
    .eq("email", email)
    .in("send_status", ["sent", "pending"])

  if (recErr) {
    console.error(`[v0] brevo-webhook: update destinatari fallito (${email}):`, recErr.message)
  }

  if (permanent) {
    const { error: followErr } = await supabase
      .from("dem_followup_recipients")
      .update({ excluded: true, excluded_reason: reason, updated_at: now })
      .eq("email", email)
    if (followErr) {
      console.error(`[v0] brevo-webhook: update follow-up fallito (${email}):`, followErr.message)
    }
  }

  console.log(`[v0] brevo-webhook: ${event} processato per ${email}`)
  return NextResponse.json({ ok: true, processed: 1, event, permanent })
}
