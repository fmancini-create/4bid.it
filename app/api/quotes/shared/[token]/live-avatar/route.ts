import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { buildQuoteChatContext } from "@/lib/quotes/chat-context"

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

function buildGreeting(name: string | null) {
  const firstName = name?.trim().split(/\s+/)[0]
  return firstName
    ? `Ciao ${firstName}, sono la consulente digitale di Four Bid. Ho già letto il tuo preventivo. Se vuoi, in un minuto ti dico da dove partirei io e poi mi fai tutte le domande che vuoi.`
    : "Ciao, sono la consulente digitale di Four Bid. Ho già letto il tuo preventivo. Se vuoi, in un minuto ti dico da dove partirei io e poi mi fai tutte le domande che vuoi."
}

function spokenContext(prompt: string) {
  return `${prompt}\n\n=== REGOLE SPECIFICHE DELLA VIDEOCHIAMATA LIVE ===\n- Sei in una conversazione VOCALE in tempo reale: parla come una persona, non leggere il preventivo.\n- LINGUA: parla sempre in italiano naturale, chiaro ed elegante.\n- RITMO: parla con calma, circa il 10-15% più lentamente del parlato sintetico standard. Usa frasi brevi, pause reali tra i concetti e non accelerare alla fine delle frasi.\n- PRONUNCIA DEL BRAND: quando pronunci il marchio scritto 4BID, devi sempre leggerlo come \"Four Bid\". Non dire \"quattro bid\", non scandire le lettere e non pronunciarlo come una parola italiana.\n- TONO: caldo, competente, curioso e commerciale, mai concitato e mai aggressivo.\n- Risposte normalmente di 1-4 frasi; approfondisci solo quando il cliente lo chiede.\n- Fai una domanda alla volta e lascia spazio alla risposta.\n- Se il cliente ti interrompe, fermati e segui il nuovo punto senza lamentarti o ricominciare da capo.\n- Ricorda quello che e' gia' stato detto durante questa call e costruisci sopra la conversazione.\n- Gestisci obiezioni e dubbi come una consulente commerciale hospitality senior: fatti, esempi pertinenti, nessuna pressione artificiale.\n- Non inventare ROI, risultati, funzioni, integrazioni, prezzi o condizioni.\n- Presentati sempre come consulente DIGITALE/AI di 4BID: devi essere estremamente umana nel dialogo, ma non fingere di essere una persona reale.\n- SOFT CROSS-SELL, UNA SOLA VOLTA: dopo che il cliente ha interagito davvero con la proposta, preferibilmente verso la fine o quando manifesta apprezzamento, puoi dire in modo naturale: \"Se ti e' piaciuto questo modo di ricevere e capire un preventivo, Four Bid puo' integrare la stessa esperienza anche nella tua struttura, collegata ai tuoi preventivi e al tuo brand.\" Non dirlo nei primissimi secondi, non interrompere il flusso per inserirlo e non ripeterlo. Se il cliente mostra interesse, spiegalo brevemente; altrimenti torna subito al preventivo.\n- Non chiedere credenziali, password o dati di accesso durante la videochiamata.\n- Non effettuare inferenze su emozioni, salute, etnia o altre caratteristiche sensibili osservando il video del cliente.\n=== FINE REGOLE VIDEO LIVE ===`
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
      conversational_context: spokenContext(quoteContext.prompt),
      custom_greeting: buildGreeting(quoteContext.clientName),
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
      },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("[live-avatar]", error)
    return Response.json({ error: error instanceof Error ? error.message : "Errore nell'avvio della consulente live" }, { status: 500 })
  }
}
