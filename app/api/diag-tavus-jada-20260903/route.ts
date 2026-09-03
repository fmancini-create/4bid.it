export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const JADA_CONVERSATIONS = ["c3781543f98cf4ad", "cd38232117d8d481"]

async function tavusGet(path: string) {
  const apiKey = process.env.TAVUS_API_KEY
  if (!apiKey) return { ok: false, status: 503, body: { error: "missing Tavus config" } }

  const response = await fetch(`https://tavusapi.com${path}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  })
  const body = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, body }
}

function sanitizeConversation(body: Record<string, any>) {
  const events = Array.isArray(body.events) ? body.events : []
  return {
    conversation_id: body.conversation_id || null,
    conversation_name: body.conversation_name || null,
    status: body.status || null,
    created_at: body.created_at || null,
    updated_at: body.updated_at || null,
    shutdown_reason: body.shutdown_reason || null,
    transcript: body.transcript || null,
    events: events
      .filter((event: Record<string, any>) => {
        const type = String(event.event_type || event.type || "")
        return type.startsWith("conversation.") || type === "system.shutdown" || type === "system.replica_joined" || type === "application.transcription_ready"
      })
      .map((event: Record<string, any>) => ({
        event_type: event.event_type || event.type || null,
        timestamp: event.timestamp || null,
        seq: event.seq || null,
        turn_idx: event.turn_idx || null,
        properties: event.properties || null,
      })),
  }
}

export async function GET() {
  const conversationResults = await Promise.all(
    JADA_CONVERSATIONS.map(async (id) => {
      const result = await tavusGet(`/v2/conversations/${id}?verbose=true`)
      return { id, ok: result.ok, status: result.status, data: sanitizeConversation(result.body as Record<string, any>) }
    }),
  )

  const palId = process.env.TAVUS_PAL_ID || null
  const personaId = process.env.TAVUS_PERSONA_ID || null
  const configResults: Record<string, unknown> = {}

  if (palId) {
    const result = await tavusGet(`/v2/pals/${encodeURIComponent(palId)}`)
    configResults.pal = { id: palId, ok: result.ok, status: result.status, data: result.body }
  }
  if (personaId) {
    const result = await tavusGet(`/v2/personas/${encodeURIComponent(personaId)}`)
    configResults.persona = { id: personaId, ok: result.ok, status: result.status, data: result.body }
  }

  return Response.json(
    { conversations: conversationResults, config: configResults },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
