import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { authorizeHotelAccelerator } from "@/lib/quotes/integration-auth"
import { reconcileTavusSession } from "@/lib/quotes/tavus-live-session"

export const runtime = "nodejs"
export const maxDuration = 30

function durationSeconds(startedAt: string | null | undefined, endedAt: string | null | undefined) {
  if (!startedAt || !endedAt) return null
  const started = new Date(startedAt).getTime()
  const ended = new Date(endedAt).getTime()
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) return null
  return Math.round((ended - started) / 1000)
}

export async function GET(request: NextRequest) {
  const auth = authorizeHotelAccelerator(request)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

  try {
    const sourceParentId = request.nextUrl.searchParams.get("source_parent_id")?.trim() || ""
    const quoteId = request.nextUrl.searchParams.get("quote_id")?.trim() || ""
    if (!sourceParentId && !quoteId) {
      return Response.json({ error: "source_parent_id o quote_id richiesto" }, { status: 400 })
    }

    const supabase = createAdminClient()
    let quoteQuery = supabase
      .from("sales_channel_quotes")
      .select("id, quote_number, client_name, client_company, source_system, source_parent_id")
      .eq("source_system", "hotelaccelerator")

    quoteQuery = quoteId ? quoteQuery.eq("id", quoteId) : quoteQuery.eq("source_parent_id", sourceParentId)
    const { data: quotes, error: quoteError } = await quoteQuery.limit(50)
    if (quoteError) throw quoteError

    const quoteRows = quotes || []
    if (!quoteRows.length) return Response.json({ calls: [] })

    const quoteIds = quoteRows.map((quote) => quote.id)
    const quoteById = new Map(quoteRows.map((quote) => [quote.id, quote]))
    const { data: rawSessions, error: sessionError } = await supabase
      .from("quote_live_sales_sessions")
      .select("id, quote_id, chat_conversation_id, provider, provider_conversation_id, status, transcript, created_at, last_event_at, ended_at, metadata")
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: false })
      .limit(100)
    if (sessionError) throw sessionError

    const sessions = [] as any[]
    for (const raw of rawSessions || []) {
      const hasTranscript = Array.isArray(raw.transcript) && raw.transcript.length > 0
      const shouldReconcile = raw.provider === "tavus" && (!hasTranscript || raw.status === "active")
      sessions.push(shouldReconcile ? await reconcileTavusSession(supabase, raw) : raw)
    }

    const conversationIds = sessions.map((session) => session.chat_conversation_id).filter(Boolean)
    const intelligenceByConversation = new Map<string, any>()
    if (conversationIds.length) {
      const { data: intelligence } = await supabase
        .from("quote_ai_sales_intelligence")
        .select("conversation_id, engagement_score, temperature, intent, primary_product, interested_products, objections, positive_signals, next_best_action, rationale, last_user_message, updated_at")
        .in("conversation_id", conversationIds)
      for (const row of intelligence || []) intelligenceByConversation.set(row.conversation_id, row)
    }

    const calls = sessions.map((session) => {
      const quote = quoteById.get(session.quote_id)
      return {
        id: session.id,
        quote_id: session.quote_id,
        quote_number: quote?.quote_number || session.metadata?.quote_number || null,
        client_name: quote?.client_name || session.metadata?.client_name || null,
        client_company: quote?.client_company || session.metadata?.client_company || null,
        provider_conversation_id: session.provider_conversation_id,
        status: session.status,
        started_at: session.created_at,
        ended_at: session.ended_at,
        duration_seconds: durationSeconds(session.created_at, session.ended_at),
        transcript: Array.isArray(session.transcript) ? session.transcript : [],
        intelligence: session.chat_conversation_id
          ? intelligenceByConversation.get(session.chat_conversation_id) || null
          : null,
        last_event_at: session.last_event_at,
      }
    })

    return Response.json({ calls }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[hotelaccelerator-quote-calls]", error)
    return Response.json({ error: error instanceof Error ? error.message : "Errore recupero chiamate preventivo" }, { status: 500 })
  }
}
