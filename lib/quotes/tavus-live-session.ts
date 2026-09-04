import { saveQuoteSalesIntelligence } from "@/lib/quotes/sales-intelligence"

type TranscriptMessage = {
  role: "user" | "assistant"
  content: string
  createdAt: string
}

type LiveSessionRow = {
  id: string
  quote_id: string
  chat_conversation_id: string | null
  provider_conversation_id: string
  status?: string | null
  transcript?: unknown
  created_at?: string | null
  ended_at?: string | null
  metadata?: Record<string, unknown> | null
}

function isoFromTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 10_000_000_000 ? value : value * 1000
    const date = new Date(millis)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return new Date().toISOString()
}

function cleanUserSpeech(content: string) {
  const normalized = content.trim()
  const match = normalized.match(/USER[_ ]SPEECH:\s*([\s\S]*?)(?:\s*VISUAL[_ ]SCENE:|$)/i)
  return (match?.[1] || normalized).trim()
}

function transcriptArray(payload: any): any[] {
  const direct = payload?.transcript || payload?.properties?.transcript || payload?.data?.transcript
  if (Array.isArray(direct)) return direct

  const events = Array.isArray(payload?.events) ? payload.events : []
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    const eventTranscript = event?.properties?.transcript || event?.transcript || event?.data?.transcript
    if (Array.isArray(eventTranscript) && eventTranscript.length) return eventTranscript
  }
  return []
}

function transcriptEntry(entry: any): TranscriptMessage | null {
  const rawRole = String(entry?.role || entry?.speaker || entry?.sender || "").toLowerCase()
  if (["system", "tool", "developer"].includes(rawRole)) return null

  const role: "user" | "assistant" = ["assistant", "replica", "pal", "ai", "agent"].includes(rawRole)
    ? "assistant"
    : "user"
  const rawContent = String(entry?.content ?? entry?.text ?? entry?.message ?? entry?.speech ?? "").trim()
  const content = role === "user" ? cleanUserSpeech(rawContent) : rawContent
  if (!content) return null

  return {
    role,
    content,
    createdAt: isoFromTimestamp(entry?.timestamp || entry?.created_at || entry?.createdAt),
  }
}

function utteranceEntries(payload: any): TranscriptMessage[] {
  const candidates = [
    ...(String(payload?.event_type || "") === "conversation.utterance" ? [payload] : []),
    ...(Array.isArray(payload?.events)
      ? payload.events.filter((event: any) => String(event?.event_type || "") === "conversation.utterance")
      : []),
  ]

  return candidates
    .map((event: any) =>
      transcriptEntry({
        role: event?.properties?.role,
        speech: event?.properties?.speech,
        timestamp: event?.timestamp,
      }),
    )
    .filter(Boolean) as TranscriptMessage[]
}

export function normalizeTavusTranscript(payload: any): TranscriptMessage[] {
  const finalTranscript = transcriptArray(payload)
    .map((entry: any) => transcriptEntry(entry))
    .filter(Boolean) as TranscriptMessage[]

  if (finalTranscript.length) return finalTranscript
  return utteranceEntries(payload)
}

function existingTranscript(value: unknown): TranscriptMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => transcriptEntry(entry))
    .filter(Boolean) as TranscriptMessage[]
}

function mergeTranscripts(current: TranscriptMessage[], incoming: TranscriptMessage[]) {
  const merged = [...current]

  for (const next of incoming) {
    const nextTime = new Date(next.createdAt).getTime()
    const similarIndex = merged.findIndex((item) => {
      if (item.role !== next.role) return false
      const itemTime = new Date(item.createdAt).getTime()
      const closeInTime = Number.isFinite(itemTime) && Number.isFinite(nextTime) && Math.abs(itemTime - nextTime) <= 2500
      const sameText = item.content === next.content
      const sameUtterance = item.content.startsWith(next.content) || next.content.startsWith(item.content)
      return sameText || (closeInTime && sameUtterance)
    })

    if (similarIndex >= 0) {
      if (next.content.length > merged[similarIndex].content.length) merged[similarIndex] = next
      continue
    }
    merged.push(next)
  }

  return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function tavusConversationId(payload: any) {
  return String(payload?.conversation_id || payload?.conversationId || payload?.data?.conversation_id || "").trim()
}

export function tavusEventType(payload: any) {
  return String(payload?.event_type || payload?.event || payload?.type || payload?.data?.event_type || "").trim()
}

function tavusShutdownReason(payload: any) {
  const events = Array.isArray(payload?.events) ? payload.events : []
  const shutdownEvent = [...events].reverse().find((event: any) => String(event?.event_type || "") === "system.shutdown")
  return String(
    payload?.properties?.shutdown_reason ||
      payload?.properties?.reason ||
      payload?.shutdown_reason ||
      shutdownEvent?.properties?.shutdown_reason ||
      shutdownEvent?.properties?.reason ||
      "",
  ).trim() || null
}

function isEndedPayload(payload: any) {
  const eventType = tavusEventType(payload)
  const status = String(payload?.status || payload?.data?.status || "").toLowerCase()
  const events = Array.isArray(payload?.events) ? payload.events : []
  return (
    eventType === "system.shutdown" ||
    eventType === "application.transcription_ready" ||
    ["ended", "completed", "closed", "stopped"].includes(status) ||
    events.some((event: any) => String(event?.event_type || "") === "system.shutdown")
  )
}

async function syncTranscriptToChat(
  supabase: any,
  session: LiveSessionRow,
  transcript: TranscriptMessage[],
  ended: boolean,
) {
  if (!session.chat_conversation_id || !transcript.length) return

  const conversationId = session.chat_conversation_id
  const { error: deleteError } = await supabase.from("chat_messages").delete().eq("conversation_id", conversationId)
  if (deleteError) console.error("[tavus-transcript] chat delete error", deleteError)

  const { error: insertError } = await supabase.from("chat_messages").insert(
    transcript.map((message) => ({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      created_at: message.createdAt,
    })),
  )
  if (insertError) console.error("[tavus-transcript] chat insert error", insertError)

  const conversationUpdate: Record<string, unknown> = {
    message_count: transcript.length,
    last_message_at: transcript[transcript.length - 1]?.createdAt || new Date().toISOString(),
  }
  if (ended) conversationUpdate.status = "closed"

  await supabase.from("chat_conversations").update(conversationUpdate).eq("id", conversationId)

  if (!ended) return

  try {
    await saveQuoteSalesIntelligence(
      supabase,
      conversationId,
      {
        quoteId: session.quote_id,
        quoteNumber: typeof session.metadata?.quote_number === "string" ? session.metadata.quote_number : null,
        recipientEmail: null,
        quotedProjects: Array.isArray(session.metadata?.quoted_projects)
          ? (session.metadata?.quoted_projects as unknown[]).map(String)
          : [],
      },
      transcript.map((message) => ({ role: message.role, content: message.content })),
    )
  } catch (error) {
    console.error("[tavus-transcript] sales intelligence error", error)
  }
}

export async function persistTavusSessionPayload(supabase: any, session: LiveSessionRow, payload: any) {
  const now = new Date().toISOString()
  const eventType = tavusEventType(payload) || "conversation.reconciled"
  const incomingTranscript = normalizeTavusTranscript(payload)
  const transcript = mergeTranscripts(existingTranscript(session.transcript), incomingTranscript)
  const ended = isEndedPayload(payload)
  const shutdownReason = tavusShutdownReason(payload)
  const currentMetadata = session.metadata && typeof session.metadata === "object" ? session.metadata : {}

  const update: Record<string, unknown> = {
    last_event_at: now,
    updated_at: now,
    metadata: {
      ...currentMetadata,
      last_event_type: eventType,
      ...(shutdownReason ? { shutdown_reason: shutdownReason } : {}),
    },
  }

  if (ended) {
    update.status = "ended"
    update.ended_at = session.ended_at || now
  }
  if (transcript.length) update.transcript = transcript

  const { error } = await supabase.from("quote_live_sales_sessions").update(update).eq("id", session.id)
  if (error) throw error

  if (transcript.length) await syncTranscriptToChat(supabase, session, transcript, ended)
  else if (ended && session.chat_conversation_id) {
    await supabase
      .from("chat_conversations")
      .update({ status: "closed" })
      .eq("id", session.chat_conversation_id)
  }

  return { transcript, ended, eventType, shutdownReason }
}

export async function reconcileTavusSession(supabase: any, session: LiveSessionRow) {
  const apiKey = process.env.TAVUS_API_KEY
  if (!apiKey || !session.provider_conversation_id) return session

  try {
    const response = await fetch(
      `https://tavusapi.com/v2/conversations/${encodeURIComponent(session.provider_conversation_id)}?verbose=true`,
      {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!response.ok) {
      console.warn("[tavus-reconcile] provider lookup skipped", response.status, session.provider_conversation_id)
      return session
    }

    const payload = await response.json().catch(() => null)
    if (!payload) return session

    const result = await persistTavusSessionPayload(supabase, session, payload)
    return {
      ...session,
      status: result.ended ? "ended" : String(payload.status || session.status || "active"),
      transcript: result.transcript.length ? result.transcript : session.transcript,
      ended_at: result.ended ? session.ended_at || new Date().toISOString() : session.ended_at,
      metadata: {
        ...(session.metadata || {}),
        last_event_type: result.eventType,
        ...(result.shutdownReason ? { shutdown_reason: result.shutdownReason } : {}),
      },
    }
  } catch (error) {
    console.warn("[tavus-reconcile] provider lookup unavailable", error instanceof Error ? error.message : "unknown")
    return session
  }
}