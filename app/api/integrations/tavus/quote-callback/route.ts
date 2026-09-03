import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { saveQuoteSalesIntelligence } from "@/lib/quotes/sales-intelligence"

export const runtime = "nodejs"
export const maxDuration = 30

type TranscriptEntry = {
  role?: string
  speaker?: string
  content?: string
  text?: string
  message?: string
}

function normalizeTranscript(payload: any): Array<{ role: "user" | "assistant"; content: string }> {
  const candidates = [payload?.transcript, payload?.properties?.transcript, payload?.data?.transcript]
  const raw = candidates.find(Array.isArray) || []
  return raw.flatMap((entry: TranscriptEntry) => {
    const content = String(entry?.content || entry?.text || entry?.message || "").trim()
    if (!content) return []
    const who = String(entry?.role || entry?.speaker || "").toLowerCase()
    const role: "user" | "assistant" = who.includes("user") || who.includes("human") || who.includes("participant") ? "user" : "assistant"
    return [{ role, content }]
  })
}

function providerConversationId(payload: any): string | null {
  return payload?.conversation_id || payload?.data?.conversation_id || payload?.properties?.conversation_id || null
}

function isEndedEvent(eventType: string) {
  if (eventType === "system.shutdown") return true
  if (eventType === "application.transcription_ready") return true
  return eventType.includes("end") || eventType.includes("complete")
}

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.TAVUS_WEBHOOK_SECRET
    const supplied = request.nextUrl.searchParams.get("secret")
    if (!expected || supplied !== expected) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await request.json().catch(() => ({}))
    const conversationId = providerConversationId(payload)
    if (!conversationId) return Response.json({ ok: true, ignored: true })

    const supabase = createAdminClient()
    const { data: session, error } = await supabase
      .from("quote_live_sales_sessions")
      .select("id, quote_id, chat_conversation_id, metadata")
      .eq("provider", "tavus")
      .eq("provider_conversation_id", conversationId)
      .maybeSingle()
    if (error || !session) return Response.json({ ok: true, ignored: true })

    const transcript = normalizeTranscript(payload)
    const eventType = String(payload?.event_type || payload?.event || payload?.type || "").toLowerCase()
    const ended = isEndedEvent(eventType)
    const now = new Date().toISOString()
    const shutdownReason = payload?.properties?.shutdown_reason || payload?.properties?.reason || payload?.shutdown_reason || null

    await supabase.from("quote_live_sales_sessions").update({
      status: ended ? "ended" : "active",
      transcript: transcript.length ? transcript : undefined,
      ended_at: ended ? now : undefined,
      last_event_at: now,
      updated_at: now,
      metadata: {
        ...(session.metadata || {}),
        last_provider_event: eventType || "unknown",
        ...(shutdownReason ? { shutdown_reason: String(shutdownReason) } : {}),
      },
    }).eq("id", session.id)

    if (ended) {
      await supabase.from("chat_conversations").update({ status: "closed" }).eq("id", session.chat_conversation_id)
    }

    if (transcript.length) {
      await supabase.from("chat_messages").delete().eq("conversation_id", session.chat_conversation_id)
      await supabase.from("chat_messages").insert(transcript.map((message) => ({
        conversation_id: session.chat_conversation_id,
        role: message.role,
        content: message.content,
      })))
      await supabase.from("chat_conversations").update({
        message_count: transcript.length,
        last_message_at: now,
        status: ended ? "closed" : "active",
      }).eq("id", session.chat_conversation_id)

      const meta = (session.metadata || {}) as Record<string, any>
      await saveQuoteSalesIntelligence(supabase, session.chat_conversation_id, {
        quoteId: session.quote_id,
        quoteNumber: meta.quote_number || null,
        recipientEmail: null,
        quotedProjects: Array.isArray(meta.quoted_projects) ? meta.quoted_projects : [],
      }, transcript)
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error("[tavus-quote-callback]", error)
    return Response.json({ error: "Callback processing failed" }, { status: 500 })
  }
}
