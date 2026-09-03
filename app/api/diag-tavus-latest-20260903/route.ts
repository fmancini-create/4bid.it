export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TARGET_CONVERSATION_ID = "c96a4ed0d8b8e4ac"

export async function GET() {
  const apiKey = process.env.TAVUS_API_KEY
  if (!apiKey) return Response.json({ error: "missing Tavus config" }, { status: 503 })

  const response = await fetch(`https://tavusapi.com/v2/conversations/${TARGET_CONVERSATION_ID}?verbose=true`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  })
  const body = await response.json().catch(() => ({})) as Record<string, any>
  const events = Array.isArray(body.events) ? body.events : []

  return Response.json({
    ok: response.ok,
    status: body.status || null,
    shutdown_reason: body.shutdown_reason || null,
    transcript: body.transcript || null,
    events: events.map((event: Record<string, any>) => ({
      event_type: event.event_type || null,
      timestamp: event.timestamp || null,
      properties: event.event_type === "application.perception_analysis"
        ? { omitted: true }
        : event.properties || null,
    })),
  }, { headers: { "Cache-Control": "no-store" } })
}
