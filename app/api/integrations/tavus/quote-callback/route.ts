import { createHash, timingSafeEqual } from "crypto"
import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { persistTavusSessionPayload, tavusConversationId } from "@/lib/quotes/tavus-live-session"

export const runtime = "nodejs"
export const maxDuration = 30

function safeTextEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function authorizedCallback(supplied: string, metadata: Record<string, unknown> | null | undefined) {
  if (!supplied) return false

  const globalSecret = process.env.TAVUS_WEBHOOK_SECRET?.trim()
  if (globalSecret && safeTextEqual(supplied, globalSecret)) return true

  const expectedHash = typeof metadata?.callback_secret_hash === "string"
    ? metadata.callback_secret_hash
    : ""
  if (!expectedHash) return false
  return safeTextEqual(hashSecret(supplied), expectedHash)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}))
    const conversationId = tavusConversationId(payload)
    if (!conversationId) return Response.json({ ok: true, ignored: true })

    const supabase = createAdminClient()
    const { data: session, error } = await supabase
      .from("quote_live_sales_sessions")
      .select("id, quote_id, chat_conversation_id, provider_conversation_id, status, transcript, created_at, ended_at, metadata")
      .eq("provider", "tavus")
      .eq("provider_conversation_id", conversationId)
      .maybeSingle()

    // system.replica_joined can race the initial session insert by a fraction of a second.
    // Later shutdown/transcription callbacks and the reconciliation endpoint recover state.
    if (error || !session) return Response.json({ ok: true, ignored: true })

    const supplied = request.nextUrl.searchParams.get("secret") || ""
    if (!authorizedCallback(supplied, session.metadata as Record<string, unknown> | null)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await persistTavusSessionPayload(supabase, session, payload)
    return Response.json({
      ok: true,
      event: result.eventType,
      ended: result.ended,
      transcript_messages: result.transcript.length,
    })
  } catch (error) {
    console.error("[tavus-quote-callback]", error)
    return Response.json({ error: "Callback processing failed" }, { status: 500 })
  }
}
