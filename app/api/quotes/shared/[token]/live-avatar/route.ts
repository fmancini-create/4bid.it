import { createHash, randomBytes } from "crypto"
import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { buildQuoteChatContext, type QuoteChatContext } from "@/lib/quotes/chat-context"

export const runtime = "nodejs"
export const maxDuration = 30

const sessionWindows = new Map<string, number[]>()
const REQUESTS_PER_MINUTE = 3
const MAX_CALL_DURATION_SECONDS = 15 * 60
const TAVUS_VOICE_TUNING_TIMEOUT_MS = 2500

let voiceTuningPromise: Promise<void> | null = null

function configured() {
  const explicitlyEnabled = process.env.TAVUS_LIVE_ENABLED === "true"
  const safePreview = process.env.VERCEL_ENV === "preview"
  return Boolean(
    (explicitlyEnabled || safePreview) &&
      process.env.TAVUS_API_KEY &&
      (process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID) &&
      (process.env.TAVUS_FACE_ID || process.env.TAVUS_REPLICA_ID),
  )
}

function rateLimited(key: string) {
  const now = Date.now()
  const recent = (sessionWindows.get(key) || []).filter((timestamp) => now - timestamp < 60_000)
  recent.push(now)
  sessionWindows.set(key, recent)
  return recent.length > REQUESTS_PER_MINUTE
}

function buildGreeting() {
  return "Buongiorno. Sono la consulente digitale di 4BID. Prima di iniziare, mi dice come posso chiamarla?"
}

function recipientIdentityInstruction(context: QuoteChatContext) {
  const recipientName = context.clientName?.trim() || ""
  const recipientFirstName = recipientName.split(/\s+/)[0] || ""
  if (!recipientFirstName) {
    return "- Il preventivo non ha un destinatario persona chiaramente indicato: usa il nome dichiarato dall'interlocutore e chiedi il suo ruolo solo se serve davvero per capire come presentare la proposta."
  }

  const roleTarget = context.clientCompany?.trim()
    ? `rispetto a ${context.clientCompany}`
    : `rispetto a ${recipientFirstName} o a questa proposta`

  return `- CONTROLLO IDENTITA' E RUOLO: il preventivo e' intestato a ${recipientName}. Dopo che l'interlocutore ti ha detto come si chiama, confronta in modo semplice il PRIMO NOME dichiarato con ${recipientFirstName}. Se coincide, non fare domande inutili sull'identita' e continua normalmente. Se e' diverso, NON trattarlo come ${recipientFirstName}: salutalo con il nome che ha dichiarato e chiedi, UNA DOMANDA ALLA VOLTA, quale ruolo ricopre ${roleTarget}. Dopo la sua risposta chiedi con naturalezza: "${recipientFirstName} e' con noi in questo momento?". Se risponde si', saluta anche ${recipientFirstName} e continua sapendo che ci sono entrambi; se risponde no, prosegui con l'interlocutore presente ma ricorda sempre che il preventivo resta intestato a ${recipientName}. Non inventare il ruolo, non presumere deleghe o poteri di firma e non chiedere documenti di identita'. Completa questo mini-check PRIMA di introdurre l'eventuale nota personale del commerciale.`
}

function creatorNoteInstruction(context: QuoteChatContext) {
  if (!context.description) return "- Non c'e' una nota personale del commerciale da introdurre: dopo l'eventuale controllo identita'/ruolo passa naturalmente alla proposta."

  const attribution = context.creatorLastName
    ? `il signor ${context.creatorLastName}, che ha preparato questa proposta, ci tiene a farle sapere che`
    : context.creatorName
      ? `${context.creatorName}, che ha preparato questa proposta, ci tiene a farle sapere che`
      : "chi ha preparato questa proposta ci tiene a farle sapere che"

  return `- APERTURA PERSONALE OBBLIGATORIA, UNA SOLA VOLTA: dopo che hai appreso il nome dell'interlocutore e, se e' diverso dall'intestatario, hai completato il mini-check su ruolo e presenza del destinatario, introduci con naturalezza la nota del commerciale. Usa una frase elegante equivalente a: "Prima di entrare nel merito, mi preme segnalarle una cosa: ${attribution} ${context.description}". Mantieni fedelmente il significato della nota, senza inventare dettagli, promesse o condizioni e senza chiamarla "descrizione" o "campo del preventivo".`
}

function spokenContext(context: QuoteChatContext) {
  return `${context.prompt}\
\
=== REGOLE SPECIFICHE DELLA VIDEOCHIAMATA LIVE ===\
- Sei in una conversazione VOCALE in tempo reale: parla come una persona, non leggere il preventivo.\
- LINGUA E PRONUNCIA: parla SEMPRE in italiano standard madrelingua, con fonetica, cadenza e prosodia italiane naturali. Evita tassativamente inflessioni, vocali o ritmo da inglese americano quando pronunci parole italiane. I termini tecnici inglesi possono essere pronunciati come e' normale nel settore hospitality italiano, ma il resto della frase deve suonare inequivocabilmente italiano.\
- VELOCITA': parla sensibilmente piu' lentamente del parlato sintetico standard, circa il 30-35% piu' piano. Preferisci frasi brevi, pause vere tra i concetti e micro-pause dopo nomi, numeri, prezzi e parole importanti. Non accelerare a fine frase e non comprimere le pause.\
- TONO: voce calda, elegante, rassicurante e commerciale, mai concitata. Deve sembrare una consulente italiana senior che sta parlando con calma a una persona davanti a lei.\
- La persona indicata come destinatario del preventivo NON e' necessariamente chi e' entrato in videochiamata. Il primo nome che l'interlocutore ti dichiara all'inizio e' il nome da usare durante QUESTA call. Non sostituirlo mai con il nome dell'intestatario salvo che l'interlocutore dica esplicitamente di essere quella persona.\
${recipientIdentityInstruction(context)}\
${creatorNoteInstruction(context)}\
- Risposte normalmente di 1-4 frasi; approfondisci solo quando il cliente lo chiede.\
- Fai una domanda alla volta e lascia spazio alla risposta.\
- Se il cliente ti interrompe, fermati e segui il nuovo punto senza lamentarti o ricominciare da capo.\
- Ricorda quello che e' gia' stato detto durante questa call e costruisci sopra la conversazione.\
- Gestisci obiezioni e dubbi come una consulente commerciale hospitality senior: fatti, esempi pertinenti, nessuna pressione artificiale.\
- La sessione ha una durata massima di 15 minuti. Tra il minuto 11 e il minuto 12, quando e' naturale, inizia a convergere verso un riepilogo dei punti chiave e chiedi se rimane un dubbio importante. Non troncare una risposta a meta' e non creare urgenza artificiale.\
- Non inventare ROI, risultati, funzioni, integrazioni, prezzi o condizioni.\
- Presentati sempre come consulente DIGITALE/AI 4BID: devi essere estremamente umana nel dialogo, ma non fingere di essere una persona reale.\
- Non chiedere credenziali, password o dati di accesso durante la videochiamata.\
- Non effettuare inferenze su emozioni, salute, etnia o altre caratteristiche sensibili osservando il video del cliente.\
=== FINE REGOLE VIDEO LIVE ===`
}

function tavusAgentEndpoints(agentId: string) {
  const encoded = encodeURIComponent(agentId)
  return process.env.TAVUS_PAL_ID
    ? [`https://tavusapi.com/v2/pals/${encoded}`, `https://tavusapi.com/v2/personas/${encoded}`]
    : [`https://tavusapi.com/v2/personas/${encoded}`]
}

async function tuneVoiceProfile(agentId: string) {
  const apiKey = process.env.TAVUS_API_KEY
  if (!apiKey) return

  for (const endpoint of tavusAgentEndpoints(agentId)) {
    try {
      const profileResponse = await fetch(endpoint, {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(TAVUS_VOICE_TUNING_TIMEOUT_MS),
      })
      if (!profileResponse.ok) continue

      const profile = await profileResponse.json().catch(() => ({})) as {
        layers?: {
          tts?: {
            tts_engine?: string
            voice_settings?: Record<string, unknown>
          }
        }
      }
      const tts = profile?.layers?.tts
      if (!tts?.tts_engine) return

      const engine = String(tts.tts_engine).toLowerCase()
      const speed = engine.includes("eleven") ? 0.78 : -0.35
      const nextSettings = { ...(tts.voice_settings || {}), speed }
      const patchResponse = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify([
          {
            op: tts.voice_settings ? "replace" : "add",
            path: "/layers/tts/voice_settings",
            value: nextSettings,
          },
        ]),
        cache: "no-store",
        signal: AbortSignal.timeout(TAVUS_VOICE_TUNING_TIMEOUT_MS),
      })

      if (!patchResponse.ok) {
        console.warn("[live-avatar] Tavus voice pacing tune skipped", patchResponse.status)
      }
      return
    } catch (error) {
      console.warn("[live-avatar] Tavus voice pacing tune unavailable", error instanceof Error ? error.message : "unknown")
    }
  }
}

async function ensureVoiceTuning(agentId: string) {
  if (!voiceTuningPromise) {
    voiceTuningPromise = tuneVoiceProfile(agentId).catch((error) => {
      console.warn("[live-avatar] Tavus voice tuning failed", error)
    })
  }
  await voiceTuningPromise
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const enabled = configured()
  if (!enabled) return Response.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } })

  try {
    const { token } = await params
    const quoteContext = await buildQuoteChatContext(token)
    return Response.json(
      { enabled: true, quotedProjects: quoteContext?.quotedProjects || [] },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch {
    return Response.json({ enabled: true, quotedProjects: [] }, { headers: { "Cache-Control": "private, no-store" } })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!configured()) {
      return Response.json({ error: "Consulente video live non ancora attivata", enabled: false }, { status: 503 })
    }

    const { token } = await params
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
    if (rateLimited(`${token}:${ip}`)) {
      return Response.json({ error: "Troppe sessioni avviate. Riprova tra un minuto." }, { status: 429 })
    }

    const quoteContext = await buildQuoteChatContext(token)
    if (!quoteContext?.quoteId) return Response.json({ error: "Preventivo non trovato" }, { status: 404 })

    const supabase = createAdminClient()
    const userEmail = quoteContext.clientEmail || `quote-${quoteContext.quoteNumber || token}@virtual.4bid.local`
    const { data: chat, error: chatError } = await supabase
      .from("chat_conversations")
      .insert({ user_email: userEmail, account_type: "pro", status: "active" })
      .select("id")
      .single()
    if (chatError || !chat?.id) throw chatError || new Error("Impossibile creare la conversazione")

    // Every live call gets its own callback credential. This removes the hidden dependency
    // on a global webhook env var and keeps the credential useless outside this session.
    const callbackSecret = randomBytes(32).toString("base64url")
    const callbackSecretHash = createHash("sha256").update(callbackSecret).digest("hex")
    const callbackUrl = `${request.nextUrl.origin}/api/integrations/tavus/quote-callback?secret=${encodeURIComponent(callbackSecret)}`

    const palId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID!
    const faceId = process.env.TAVUS_FACE_ID || process.env.TAVUS_REPLICA_ID!
    const usesPalNaming = Boolean(process.env.TAVUS_PAL_ID || process.env.TAVUS_FACE_ID)
    const openingMessage = buildGreeting()

    await ensureVoiceTuning(palId)

    const tavusBody: Record<string, unknown> = {
      conversation_name: `4BID ${quoteContext.quoteNumber || "Preventivo"} - ${quoteContext.clientCompany || quoteContext.clientName || "Cliente"}`.slice(0, 120),
      conversational_context: spokenContext(quoteContext),
      custom_greeting: openingMessage,
      audio_only: false,
      require_auth: true,
      max_participants: 2,
      callback_url: callbackUrl,
      properties: {
        language: "italian",
        enable_closed_captions: false,
        max_call_duration: MAX_CALL_DURATION_SECONDS,
        participant_left_timeout: 0,
        participant_absent_timeout: 90,
      },
      ...(usesPalNaming ? { pal_id: palId, face_id: faceId } : { persona_id: palId, replica_id: faceId }),
    }

    const tavusResponse = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.TAVUS_API_KEY!,
      },
      body: JSON.stringify(tavusBody),
      cache: "no-store",
    })

    const tavus = (await tavusResponse.json().catch(() => ({}))) as {
      conversation_id?: string
      conversation_url?: string
      meeting_token?: string
      status?: string
      message?: string
      error?: string
    }

    if (!tavusResponse.ok || !tavus.conversation_id || !tavus.conversation_url) {
      await supabase.from("chat_conversations").update({ status: "failed" }).eq("id", chat.id)
      throw new Error(tavus.error || tavus.message || `Video provider non disponibile (${tavusResponse.status})`)
    }

    const { error: sessionError } = await supabase.from("quote_live_sales_sessions").insert({
      quote_id: quoteContext.quoteId,
      chat_conversation_id: chat.id,
      provider: "tavus",
      provider_conversation_id: tavus.conversation_id,
      status: tavus.status === "ended" ? "ended" : "active",
      metadata: {
        quote_number: quoteContext.quoteNumber,
        client_name: quoteContext.clientName,
        client_company: quoteContext.clientCompany,
        quoted_projects: quoteContext.quotedProjects,
        creator_name: quoteContext.creatorName,
        creator_last_name: quoteContext.creatorLastName,
        has_personal_note: Boolean(quoteContext.description),
        max_call_duration_seconds: MAX_CALL_DURATION_SECONDS,
        captions_enabled: false,
        requested_language: "italian",
        callback_secret_hash: callbackSecretHash,
      },
    })
    if (sessionError) console.error("[live-avatar] session persistence error", sessionError)

    const joinUrl = tavus.meeting_token
      ? `${tavus.conversation_url}${tavus.conversation_url.includes("?") ? "&" : "?"}t=${encodeURIComponent(tavus.meeting_token)}`
      : tavus.conversation_url

    return Response.json(
      {
        enabled: true,
        conversationId: tavus.conversation_id,
        conversationUrl: tavus.conversation_url,
        meetingToken: tavus.meeting_token || null,
        joinUrl,
        chatConversationId: chat.id,
        quotedProjects: quoteContext.quotedProjects || [],
        openingMessage,
        maxCallDurationSeconds: MAX_CALL_DURATION_SECONDS,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("[live-avatar]", error)
    return Response.json({ error: error instanceof Error ? error.message : "Errore nell'avvio della consulente live" }, { status: 500 })
  }
}
