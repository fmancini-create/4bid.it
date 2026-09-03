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
  const body = await response.json().catch(() => ({})) as Record<string, any>
  return { ok: response.ok, status: response.status, body }
}

function logTranscript(id: string, transcript: unknown) {
  if (!Array.isArray(transcript)) {
    console.log("[diag-jada-transcript-shape]", JSON.stringify({ id, value_type: typeof transcript, value: transcript ?? null }))
    return
  }

  console.log("[diag-jada-transcript-count]", JSON.stringify({ id, turns: transcript.length }))
  transcript.forEach((turn: Record<string, any>, index: number) => {
    console.log("[diag-jada-transcript]", JSON.stringify({
      id,
      index,
      role: turn.role || turn.speaker || null,
      content: turn.content || turn.text || turn.speech || turn.message || null,
      timestamp: turn.timestamp || turn.created_at || turn.createdAt || turn.start_time || null,
      end_timestamp: turn.end_timestamp || turn.end_time || null,
    }))
  })
}

export async function GET() {
  for (const id of JADA_CONVERSATIONS) {
    const result = await tavusGet(`/v2/conversations/${id}?verbose=true`)
    const body = result.body
    const events = Array.isArray(body.events) ? body.events : []

    console.log("[diag-jada-summary]", JSON.stringify({
      id,
      api_ok: result.ok,
      api_status: result.status,
      conversation_status: body.status || null,
      conversation_name: body.conversation_name || null,
      created_at: body.created_at || null,
      updated_at: body.updated_at || null,
      shutdown_reason: body.shutdown_reason || null,
      top_level_transcript: Array.isArray(body.transcript) ? body.transcript.length : null,
      event_count: events.length,
      event_types: events.map((event: Record<string, any>) => event.event_type || event.type || null),
    }))

    if (Array.isArray(body.transcript) && body.transcript.length) {
      logTranscript(`${id}:top-level`, body.transcript)
    }

    events.forEach((event: Record<string, any>, index: number) => {
      const type = String(event.event_type || event.type || "")
      console.log("[diag-jada-event-type]", JSON.stringify({ id, index, event_type: type, timestamp: event.timestamp || null }))

      if (type === "application.transcription_ready") {
        const props = event.properties || {}
        console.log("[diag-jada-transcription-keys]", JSON.stringify({ id, keys: Object.keys(props) }))
        const candidate = props.transcript ?? props.transcription ?? props.messages ?? props.turns ?? null
        logTranscript(id, candidate)
      }

      if (
        type === "conversation.utterance"
        || type.includes("started_speaking")
        || type.includes("stopped_speaking")
        || type === "system.shutdown"
      ) {
        console.log("[diag-jada-event]", JSON.stringify({
          id,
          index,
          event_type: type,
          timestamp: event.timestamp || null,
          role: event.properties?.role || null,
          speech: event.properties?.speech || null,
          shutdown_reason: event.properties?.shutdown_reason || null,
        }))
      }
    })
  }

  return Response.json(
    { ok: true, conversations_checked: JADA_CONVERSATIONS.length },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
