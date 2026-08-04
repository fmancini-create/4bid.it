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
    // `Uint8Array.from(Buffer.from(...))` e' il modello GIA' usato nel progetto
    // (lib/project-room/invitations.ts, token-vault.ts): con @types/node 22 il
    // tipo `Buffer` non e' piu' assegnabile a `BinaryLike`/`ArrayBufferView`,
    // perche' il suo ArrayBuffer e' dichiarato `ArrayBufferLike`. La conversione
    // copia gli stessi byte, quindi il valore dell'HMAC non cambia: NON e' un
    // cast che mette a tacere il compilatore, e infatti gli altri tre file che
    // usano crypto in questo progetto non danno errore proprio perche' seguono
    // questa forma.
    const secretBytes = Uint8Array.from(Buffer.from(secret.replace(/^whsec_/, ""), "base64"))
    const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`
    const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64")
    // L'header puo' contenere piu' firme separate da spazio, ognuna "v1,<sig>".
    const provided = headers.signature.split(" ").map((p) => p.split(",")[1] || p)
    return provided.some((sig) => {
      try {
        const a = Uint8Array.from(Buffer.from(sig))
        const b = Uint8Array.from(Buffer.from(expected))
        // Il controllo sulla lunghezza resta obbligatorio: `timingSafeEqual`
        // solleva un'eccezione se i due argomenti hanno lunghezza diversa.
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
  // Rimbalzi e reclami spam. ATTENZIONE: il commento precedente diceva "solo
  // bounce permanenti", ma la permanenza non veniva MAI verificata: ogni
  // rimbalzo finiva nella lista di soppressione globale, quindi una casella
  // temporaneamente piena veniva esclusa PER SEMPRE da ogni campagna futura.
  // Resend distingue i due casi in `data.bounce.type` (`Permanent` /
  // `Temporary`): ora quel valore viene letto e conservato.
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

  // Dettaglio del rimbalzo, come arriva da Resend.
  const bounce = (event.data?.bounce ?? {}) as { type?: string; subType?: string; message?: string }
  const bounceType = isBounce ? bounce.type || null : null
  const bounceSubtype = isBounce ? bounce.subType || null : null
  // Il messaggio del server ricevente e' l'unica traccia del motivo reale.
  const bounceMessage = isBounce ? bounce.message || null : null

  // Un rimbalzo TEMPORANEO (casella piena, server momentaneamente non
  // raggiungibile) non prova che l'indirizzo sia morto: escluderlo a vita
  // butterebbe un contatto valido. Un reclamo spam resta definitivo: chi lo
  // segnala non vuole essere ricontattato.
  const isTemporaryBounce = isBounce && bounceType === "Temporary"
  // Tipo assente -> trattato come definitivo. Resend documenta `email.bounced`
  // come prevalentemente permanente, e sbagliare da questo lato costa un
  // contatto in meno, non una reputazione di mittente danneggiata.

  for (const email of emails) {
    if (isTemporaryBounce) {
      // NON entra nella lista di soppressione globale: l'indirizzo resta
      // contattabile in futuro.
      console.log(`[v0] resend-webhook: rimbalzo TEMPORANEO per ${email} (${bounceSubtype || "sottotipo assente"}), nessuna esclusione a vita`)
    } else {
      // 3a) Lista di soppressione globale (idempotente sull'email).
      const { error: supErr } = await supabase
        .from("dem_unsubscribes")
        .upsert(
          { email, reason, bounce_type: bounceType, bounce_subtype: bounceSubtype, bounce_message: bounceMessage },
          { onConflict: "email" },
        )
      if (supErr) console.error(`[v0] resend-webhook: upsert soppressione fallito (${email}):`, supErr.message)
    }

    // 3b) Marca i record destinatario corrispondenti (tutte le campagne) cosi'
    // lo stato e' visibile nelle statistiche e i lotti in corso li saltano.
    //
    // Marcato ANCHE se temporaneo, di proposito: un rimbalzo temporaneo e'
    // comunque un problema di consegna e deve continuare a pesare sul tasso che
    // alimenta il freno. Escluderlo dal conteggio renderebbe il freno meno
    // sensibile proprio mentre la consegna peggiora.
    const { error: recErr } = await supabase
      .from("dem_recipients")
      .update({
        send_status: recipientStatus,
        // Prima si scriveva solo `Resend email.bounced`, identico per tutti:
        // i rimbalzi erano indistinguibili e "ripulire la lista" non era
        // un'operazione eseguibile, perche' non si sapeva quali indirizzi
        // fossero davvero morti.
        error_message: [`Resend ${type}`, bounceType, bounceSubtype, bounceMessage].filter(Boolean).join(" | "),
        bounce_type: bounceType,
      })
      .eq("email", email)
      .in("send_status", ["sent", "pending"])
    if (recErr) console.error(`[v0] resend-webhook: update destinatari fallito (${email}):`, recErr.message)

    // 3c) Anche i destinatari dei solleciti caldi: stop sequenza.
    // Se il rimbalzo e' temporaneo la sequenza NON viene interrotta: sarebbe
    // un'esclusione definitiva per un problema passeggero.
    if (!isTemporaryBounce) {
      await supabase
        .from("dem_followup_recipients")
        .update({ excluded: true, excluded_reason: reason, updated_at: new Date().toISOString() })
        .eq("email", email)
    }
  }

  console.log(`[v0] resend-webhook: ${reason} processato per ${emails.length} indirizzo/i`)
  return NextResponse.json({ ok: true, processed: emails.length, reason })
}
