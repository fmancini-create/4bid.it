import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

function eventSummary(event: any) {
  return {
    event_type: String(event?.event_type || event?.type || event?.event || ""),
    timestamp: event?.timestamp || event?.created_at || null,
    role: event?.properties?.role || event?.role || null,
    shutdown_reason: event?.properties?.shutdown_reason || event?.shutdown_reason || null,
  }
}

async function getJson(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  return {
    status: response.status,
    body: await response.json().catch(() => null),
  }
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "not_found" }, { status: 404 })
  }

  const apiKey = process.env.TAVUS_API_KEY || ""
  const agentId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID || ""
  const conversationId = request.nextUrl.searchParams.get("conversationId") || ""

  if (!apiKey || !agentId) {
    return Response.json({
      ok: false,
      hasApiKey: Boolean(apiKey),
      hasAgentId: Boolean(agentId),
      usesPalId: Boolean(process.env.TAVUS_PAL_ID),
    })
  }

  const encodedAgent = encodeURIComponent(agentId)
  const [pal, persona, conversation] = await Promise.all([
    getJson(`https://tavusapi.com/v2/pals/${encodedAgent}`, apiKey),
    getJson(`https://tavusapi.com/v2/personas/${encodedAgent}`, apiKey),
    conversationId
      ? getJson(`https://tavusapi.com/v2/conversations/${encodeURIComponent(conversationId)}?verbose=true`, apiKey)
      : Promise.resolve({ status: 0, body: null }),
  ])

  const palTts = pal.body?.layers?.tts || null
  const personaTts = persona.body?.layers?.tts || null
  const convo = conversation.body
  const transcript = Array.isArray(convo?.transcript)
    ? convo.transcript.map((item: any) => ({ role: item?.role || item?.speaker || null, text: item?.content || item?.text || null }))
    : []

  return Response.json({
    ok: true,
    usesPalId: Boolean(process.env.TAVUS_PAL_ID),
    pal: {
      status: pal.status,
      id: pal.body?.pal_id || pal.body?.id || null,
      tts_engine: palTts?.tts_engine || null,
      tts_model_name: palTts?.tts_model_name || null,
      voice_settings: palTts?.voice_settings || null,
    },
    persona: {
      status: persona.status,
      id: persona.body?.persona_id || persona.body?.id || null,
      tts_engine: personaTts?.tts_engine || null,
      tts_model_name: personaTts?.tts_model_name || null,
      voice_settings: personaTts?.voice_settings || null,
    },
    conversation: convo ? {
      status_code: conversation.status,
      status: convo?.status || null,
      conversation_id: convo?.conversation_id || null,
      replica_id: convo?.replica_id || null,
      persona_id: convo?.persona_id || null,
      shutdown_reason: convo?.shutdown_reason || null,
      events: Array.isArray(convo?.events) ? convo.events.map(eventSummary) : [],
      transcript,
    } : null,
  }, { headers: { "Cache-Control": "no-store" } })
}
