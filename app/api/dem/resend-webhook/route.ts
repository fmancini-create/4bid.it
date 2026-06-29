import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
// Deve leggere il body RAW per verificare la firma: nessun parsing automatico.
export const runtime = "nodejs"

/**
 * Webhook Resend per bounce e reclami spam.
 *
 * Perche' esiste: l'invio marca un destinatario come "sent" non appena Resend
 * ACCETTA l'email. Bounce e "segnala spam" avvengono DOPO, in modo asincrono.
 * Senza questo webhook continueremmo a colpire indirizzi morti e chi ci ha
 * segnalati, bruciando la reputazione del dominio. Qui li intercettiamo e li
 * aggiungiamo alla lista di soppressione (dem_unsubscribes), cosi' gli invii
 * futuri (freddi e solleciti) li saltano automaticamente.
 *
 * Sicurezza: se RESEND_WEBHOOK_SECRET e' impostato, verifichiamo la firma Svix
 * (lo schema usato da Resend). Se non e' ancora configurato, processiamo
 * loggando un avviso, cosi' l'endpoint funziona da subito e la firma puo'
 * essere attivata in un secondo momento senza riscrivere codice.
 */

// Verifica la firma Svix usata da Resend (https://resend.com/docs/webhooks).
// signedContent = `${svix-id}.${svix-timestamp}.${rawBody}`
// secret = "whsec_" + base64(key) -> HMAC-SHA256, confronto base64 in v1,<sig>.
function verifySvixSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
): boolean {
  if (!headers.id || !headers.timestamp || !headers.signature) return false
  try {
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
    const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`
    const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64")
    // L'header puo' contenere piu' firme separate da spazio, ognuna "v1,<sig>".
    const provided = headers.signature.split(" ").map((p) => p.split(",")[1] || p)
    return provided.some((sig) => {
      try {
        const a = Buffer.from(sig)
        const b = Buffer.from(expected)
        return a.length === b.length && crypto.timingSafeEqual(a, b)
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

function extractEmails(data: Record<string, unknown> | undefined): string[] {
  if (!data) return []
  const list: string[] = []
  // `to` puo' essere un array di stringhe oppure una singola stringa.
  const to = data.to
  if (Array.isArray(to)) {
    for (const t of to) if (typeof t === "string") list.push(t)
  } else if (typeof to === "string") {
    list.push(to)
  }
  // Fallback: alcuni payload usano `email` invece di `to`.
  if (typeof data.email === "string") list.push(data.email)
  // Dedup + normalizzazione.
  const normalized = list.map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"))
  return Array.from(new Set(normalized))
}

export async function POST(request: NextRequest) {
  // 1) Body RAW (necessario sia per la firma sia per il parsing).
  const rawBody = await request.text()

  // 2) Verifica firma se il secret e' configurato.
  //    Trim difensivo: se il secret viene incollato con spazi o newline finali
  //    (errore comune), senza il trim ogni firma fallirebbe -> 401 -> Resend
  //    disabilita il webhook. Il trim NON indebolisce la sicurezza: la verifica
  //    HMAC resta obbligatoria quando un secret e' presente.
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  if (secret) {
    const svixId = request.headers.get("svix-id")
    const svixTimestamp = request.headers.get("svix-timestamp")
    const svixSignature = request.headers.get("svix-signature")
    const ok = verifySvixSignature(
      rawBody,
      { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      secret,
    )
    if (!ok) {
      // Log diagnostico SENZA esporre il secret: aiuta a distinguere "headers
      // mancanti" (richiesta non firmata da Resend) da "firma non combaciante"
      // (secret sbagliato), la causa piu' frequente di disabilitazione.
      console.error(
        "[v0] resend-webhook: firma non valida",
        JSON.stringify({
          hasSvixId: Boolean(svixId),
          hasSvixTimestamp: Boolean(svixTimestamp),
          hasSvixSignature: Boolean(svixSignature),
          secretPrefixOk: secret.startsWith("whsec_"),
          secretLen: secret.length,
        }),
      )
      return NextResponse.json({ error: "invalid signature" }, { status: 401 })
    }
  } else {
    console.warn("[v0] resend-webhook: RESEND_WEBHOOK_SECRET non impostato, verifica firma saltata")
  }

  // 3) Parsing.
  let event: { type?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const type = event.type || ""
  // Ci interessano solo bounce permanenti e reclami spam.
  const isBounce = type === "email.bounced"
  const isComplaint = type === "email.complained"
  if (!isBounce && !isComplaint) {
    // Evento ignorato (delivered, opened, ecc.): rispondiamo 200 per non far
    // ritentare Resend.
    return NextResponse.json({ ok: true, ignored: type })
  }

  const emails = extractEmails(event.data)
  if (emails.length === 0) {
    return NextResponse.json({ ok: true, note: "no recipient email in payload" })
  }

  const reason = isComplaint ? "complaint" : "bounce"
  const recipientStatus = isComplaint ? "complained" : "bounced"
  const supabase = createAdminClient()

  for (const email of emails) {
    // 3a) Lista di soppressione globale (idempotente sull'email).
    const { error: supErr } = await supabase
      .from("dem_unsubscribes")
      .upsert({ email, reason }, { onConflict: "email" })
    if (supErr) console.error(`[v0] resend-webhook: upsert soppressione fallito (${email}):`, supErr.message)

    // 3b) Marca i record destinatario corrispondenti (tutte le campagne) cosi'
    // lo stato e' visibile nelle statistiche e i lotti in corso li saltano.
    const { error: recErr } = await supabase
      .from("dem_recipients")
      .update({ send_status: recipientStatus, error_message: `Resend ${type}` })
      .eq("email", email)
      .in("send_status", ["sent", "pending"])
    if (recErr) console.error(`[v0] resend-webhook: update destinatari fallito (${email}):`, recErr.message)

    // 3c) Anche i destinatari dei solleciti caldi: stop sequenza.
    await supabase
      .from("dem_followup_recipients")
      .update({ excluded: true, excluded_reason: reason, updated_at: new Date().toISOString() })
      .eq("email", email)
  }

  console.log(`[v0] resend-webhook: ${reason} processato per ${emails.length} indirizzo/i`)
  return NextResponse.json({ ok: true, processed: emails.length, reason })
}
