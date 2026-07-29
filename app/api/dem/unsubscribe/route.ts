import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Un indirizzo plausibile: nessuno spazio, una sola chiocciola, un dominio con
// punto. Serve a scartare il testo spazzatura prodotto da una decodifica errata.
const EMAIL_RE = /^[^\s@,;:<>()[\]\\"]+@[^\s@,;:<>()[\]\\"]+\.[A-Za-z]{2,}$/

function isPlausibleEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value)
}

function decodeEmail(raw: string | null): string | null {
  if (!raw) return null

  // 1) Valore in chiaro (anche percent-encoded). Va provato PRIMA del base64.
  //
  // IL DIFETTO: in produzione ci sono 10 richieste di disiscrizione salvate con
  // l'email corrotta (caratteri di sostituzione UTF-8) e quindi INEFFICACI: la
  // persona risultava disiscritta con un indirizzo inesistente e continuava a
  // ricevere le DEM, pur avendo visto la conferma "sei stato rimosso".
  //
  // Causa PROVATA: `Buffer.from(x, "base64")` e' PERMISSIVO, non fallisce sui
  // caratteri non validi ma li scarta e restituisce byte casuali. La vecchia
  // guardia si limitava a `decoded.includes("@")`: bastava che fra quei byte
  // capitasse un 0x40 per far passare la spazzatura. Misurato su link
  // deliberatamente manomessi (portati in maiuscolo, o troncati di 1-3
  // caratteri): la vecchia guardia accettava spazzatura nel 95-100% dei casi.
  // Tutti e 10 i valori in tabella hanno esattamente UNA chiocciola, la firma
  // di questo passaggio.
  //
  // NON provato: quale manomissione sia avvenuta davvero. Le identita' non sono
  // recuperabili (tentati: minuscolo, maiuscolo, troncature, percent-encoding,
  // incrocio col CSV e con gli eventi di tracciamento; 0 corrispondenze su
  // 29.994 candidati). Le 10 righe restano come traccia storica.
  //
  // Ora un link manomesso viene RIFIUTATO: la persona vede l'invito a
  // rispondere all'email invece di una falsa conferma. Verificato che i link
  // validi continuano a funzionare (5/5) e che i manomessi non passano (0/5).
  let plain = raw.trim()
  if (plain.includes("%")) {
    try {
      plain = decodeURIComponent(plain).trim()
    } catch {
      // percent-encoding malformato: si prosegue col valore grezzo
    }
  }
  if (isPlausibleEmail(plain)) return plain.toLowerCase()

  // 2) Base64url, ma solo se l'alfabeto e' quello giusto: cosi' un'email in
  // chiaro (che contiene "@" e ".") non entra mai in questo ramo.
  if (/^[A-Za-z0-9\-_]+={0,2}$/.test(raw.trim())) {
    try {
      const normalized = raw.trim().replace(/-/g, "+").replace(/_/g, "/")
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
      const decoded = Buffer.from(padded, "base64").toString("utf8").trim()
      // Verifica di andata e ritorno: se il testo decodificato non ricodifica
      // nell'originale, la decodifica ha "digerito" caratteri non validi.
      const reencoded = Buffer.from(decoded, "utf8").toString("base64url")
      if (reencoded === raw.trim().replace(/=+$/, "") && isPlausibleEmail(decoded)) {
        return decoded.toLowerCase()
      }
    } catch {
      // non era base64 valido
    }
  }

  console.log("[v0] unsubscribe: parametro email non decodificabile, richiesta rifiutata")
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
