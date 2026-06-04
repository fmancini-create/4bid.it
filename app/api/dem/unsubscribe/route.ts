import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function decodeEmail(raw: string | null): string | null {
  if (!raw) return null
  try {
    // Email may be base64url-encoded to keep the URL clean and avoid issues.
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const decoded = Buffer.from(padded, "base64").toString("utf8")
    if (decoded.includes("@")) return decoded.trim().toLowerCase()
  } catch {
    // fall through to plain value
  }
  if (raw.includes("@")) return decodeURIComponent(raw).trim().toLowerCase()
  return null
}

async function recordUnsubscribe(email: string, campaignId: string | null, source: string) {
  const supabase = createAdminClient()

  // Add to the global suppression list (idempotent on email).
  // NB: the column is `reason` (not `source`); writing the wrong column made the
  // upsert fail in production.
  await supabase
    .from("dem_unsubscribes")
    .upsert({ email, campaign_id: campaignId, reason: source }, { onConflict: "email" })

  // Also flag any pending recipient rows for this email so the current/next
  // batch skips them immediately.
  await supabase
    .from("dem_recipients")
    .update({ send_status: "unsubscribed" })
    .eq("email", email)
    .eq("send_status", "pending")
}

function htmlPage(message: string, ok: boolean) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Disiscrizione</title>
</head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f2;color:#2d2d2d;">
  <div style="max-width:480px;margin:64px auto;background:#fff;border:1px solid #e6e3dd;border-radius:10px;padding:40px 32px;text-align:center;">
    <div style="font-size:22px;font-weight:bold;color:#1b2a4a;margin-bottom:16px;">4 Bid</div>
    <div style="font-size:40px;margin-bottom:8px;">${ok ? "&#10003;" : "&#9888;"}</div>
    <p style="font-size:16px;line-height:1.6;color:#2d2d2d;margin:0;">${message}</p>
  </div>
</body>
</html>`
}

// One-click unsubscribe (RFC 8058): mail clients send a POST with body
// "List-Unsubscribe=One-Click".
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = decodeEmail(searchParams.get("e"))
  const campaignId = searchParams.get("c")

  if (!email) {
    return NextResponse.json({ error: "Email mancante" }, { status: 400 })
  }

  try {
    await recordUnsubscribe(email, campaignId, "one-click")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Errore unsubscribe (POST):", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}

// Browser click from the email footer link.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = decodeEmail(searchParams.get("e"))
  const campaignId = searchParams.get("c")

  if (!email) {
    return new NextResponse(
      htmlPage("Link di disiscrizione non valido. Se desideri essere rimosso, rispondi alla nostra email.", false),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  }

  try {
    await recordUnsubscribe(email, campaignId, "link")
    return new NextResponse(
      htmlPage(
        `Sei stato rimosso dalla nostra lista. Non riceverai piu&#768; comunicazioni a <strong>${email}</strong>.`,
        true
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  } catch (error) {
    console.error("[v0] Errore unsubscribe (GET):", error)
    return new NextResponse(
      htmlPage("Si e&#768; verificato un errore. Riprova piu&#768; tardi o rispondi alla nostra email.", false),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  }
}
