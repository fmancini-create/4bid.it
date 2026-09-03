import { createAdminClient } from "@/lib/supabase/server-admin"

export const runtime = "nodejs"
export const maxDuration = 30

function eventSummary(event: any) {
  return {
    event_type: String(event?.event_type || event?.type || event?.event || ""),
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
  return { status: response.status, body: await response.json().catch(() => null) }
}

function speedFrom(settings: unknown) {
  if (!settings || typeof settings !== "object") return null
  const value = (settings as Record<string, unknown>).speed
  return typeof value === "number" || typeof value === "string" ? value : null
}

export async function GET() {
  const apiKey = process.env.TAVUS_API_KEY || ""
  const agentId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID || ""
  const visualId = process.env.TAVUS_FACE_ID || process.env.TAVUS_REPLICA_ID || ""

  if (!apiKey || !agentId) {
    return Response.json({
      ok: false,
      hasApiKey: Boolean(apiKey),
      hasAgentId: Boolean(agentId),
      usesPalId: Boolean(process.env.TAVUS_PAL_ID),
      usesFaceId: Boolean(process.env.TAVUS_FACE_ID),
    }, { headers: { "Cache-Control": "no-store" } })
  }

  const supabase = createAdminClient()
  const { data: latest } = await supabase
    .from("quote_live_sales_sessions")
    .select("provider_conversation_id")
    .eq("provider", "tavus")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const encodedAgent = encodeURIComponent(agentId)
  const conversationId = String(latest?.provider_conversation_id || "")
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
  const transcript = Array.isArray(convo?.transcript) ? convo.transcript : []

  return Response.json({
    ok: true,
    environment: process.env.VERCEL_ENV || null,
    usesPalId: Boolean(process.env.TAVUS_PAL_ID),
    usesFaceId: Boolean(process.env.TAVUS_FACE_ID),
    hasLegacyPersonaId: Boolean(process.env.TAVUS_PERSONA_ID),
    hasLegacyReplicaId: Boolean(process.env.TAVUS_REPLICA_ID),
    pal: {
      status: pal.status,
      tts_engine: palTts?.tts_engine || null,
      tts_model_name: palTts?.tts_model_name || null,
      speed: speedFrom(palTts?.voice_settings),
    },
    persona: {
      status: persona.status,
      tts_engine: personaTts?.tts_engine || null,
      tts_model_name: personaTts?.tts_model_name || null,
      speed: speedFrom(personaTts?.voice_settings),
    },
    latestConversation: convo ? {
      lookup_status: conversation.status,
      status: convo?.status || null,
      replica_matches_config: Boolean(visualId && convo?.replica_id === visualId),
      persona_matches_config: Boolean(agentId && convo?.persona_id === agentId),
      shutdown_reason: convo?.shutdown_reason || null,
      event_types: Array.isArray(convo?.events) ? convo.events.map(eventSummary) : [],
      transcript_count: transcript.length,
      transcript_roles: transcript.map((item: any) => item?.role || item?.speaker || null),
    } : null,
  }, { headers: { "Cache-Control": "no-store" } })
}
