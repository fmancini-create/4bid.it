import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { buildQuoteChatContext, type QuoteChatContext } from "@/lib/quotes/chat-context"

export const runtime = "nodejs"
export const maxDuration = 30

const sessionWindows = new Map<string, number[]>()
const REQUESTS_PER_MINUTE = 3

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
  return "Ciao, sono la consulente digitale 4BID. Prima di iniziare, come posso chiamarti?"
}

function creatorNoteInstruction(context: QuoteChatContext) {
  if (!context.description) return "- Non c'e' una nota personale del commerciale da introdurre: passa naturalmente alla proposta dopo aver appreso il nome dell'interlocutore."

  const attribution = context.creatorLastName
    ? `il signor ${context.creatorLastName}, che ha preparato questa proposta, ci tiene a farle sapere che`
    : context.creatorName
      ? `${context.creatorName}, che ha preparato questa proposta, ci tiene a farle sapere che`
      : "chi ha preparato questa proposta ci tiene a farle sapere che"

  return `- APERTURA PERSONALE OBBLIGATORIA, UNA SOLA VOLTA: dopo che l'interlocutore ti ha detto come si chiama e tu lo hai salutato per nome, introduci con naturalezza la nota del commerciale. Usa una frase elegante equivalente a: "Prima di entrare nel merito, mi preme segnalarle una cosa: ${attribution} ${context.description}". Mantieni fedelmente il significato della nota, senza inventare dettagli, promesse o condizioni e senza chiamarla "descrizione" o "campo del preventivo".`
}

function spokenContext(context: QuoteChatContext) {
  return `${context.prompt}\n\n=== REGOLE SPECIFICHE DELLA VIDEOCHIAMATA LIVE ===\n- Sei in una conversazione VOCALE in tempo reale: parla come una persona, non leggere il preventivo.\n- La persona indicata come destinatario del preventivo NON e' necessariamente chi e' entrato in videochiamata. Il primo nome che l'interlocutore ti dichiara all'inizio e' il nome da usare durante QUESTA call. Non sostituirlo mai con il nome dell'intestatario salvo che l'interlocutore dica esplicitamente di essere quella persona.\n${creatorNoteInstruction(context)}\n- Parla con ritmo calmo e professionale, circa il 20% piu' lentamente di una normale risposta sintetica. Fai micro-pause dopo nomi, numeri, prezzi e concetti importanti. Non correre per riempire i silenzi.\n- Risposte normalmente di 1-4 frasi; approfondisci solo quando il cliente lo chiede.\n- Fai una domanda alla volta e lascia spazio alla risposta.\n- Se il cliente ti interrompe, fermati e segui il nuovo punto senza lamentarti o ricominciare da capo.\n- Ricorda quello che e' gia' stato detto durante questa call e costruisci sopra la conversazione.\n- Gestisci obiezioni e dubbi come una consulente commerciale hospitality senior: fatti, esempi pertinenti, nessuna pressione artificiale.\n- Non inventare ROI, risultati, funzioni, integrazioni, prezzi o condizioni.\n- Presentati sempre come consulente DIGITALE/AI 4BID: devi essere estremamente umana nel dialogo, ma non fingere di essere una persona reale.\n- Non chiedere credenziali, password o dati di accesso durante la videochiamata.\n- Non effettuare inferenze su emozioni, salute, etnia o altre caratteristiche sensibili osservando il video del cliente.\n=== FINE REGOLE VIDEO LIVE ===`
}

export async function GET() {
  return Response.json({ enabled: configured() }, { headers: { "Cache-Control": "no-store" } })
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

    const callbackSecret = process.env.TAVUS_WEBHOOK_SECRET || ""
    const callbackUrl = callbackSecret
      ? `${request.nextUrl.origin}/api/integrations/tavus/quote-callback?secret=${encodeURIComponent(callbackSecret)}`
      : undefined

    const palId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID!
    const faceId = process.env.TAVUS_FACE_ID || process.env.TAVUS_REPLICA_ID!
    const usesPalNaming = Boolean(process.env.TAVUS_PAL_ID || process.env.TAVUS_FACE_ID)
    const tavusBody: Record<string, unknown> = {
      conversation_name: `4BID ${quoteContext.quoteNumber || "Preventivo"} - ${quoteContext.clientCompany || quoteContext.clientName || "Cliente"}`.slice(0, 120),
      conversational_context: spokenContext(quoteContext),
      custom_greeting: buildGreeting(),
      audio_only: false,
      require_auth: true,
      max_participants: 2,
      properties: {
        language: "italian",
        enable_closed_captions: true,
        max_call_duration: 1800,
        participant_left_timeout: 30,
        participant_absent_timeout: 120,
      },
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
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
      throw new Error(tavus.error || tavus.message || `Tavus non disponibile (${tavusResponse.status})`)
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
        joinUrl,
        chatConversationId: chat.id,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("[live-avatar]", error)
    return Response.json({ error: error instanceof Error ? error.message : "Errore nell'avvio della consulente live" }, { status: 500 })
  }
}
