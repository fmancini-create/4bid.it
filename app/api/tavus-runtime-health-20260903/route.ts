export const runtime = "nodejs"
export const maxDuration = 30

async function getJson(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

async function removeLegacySpeed(url: string, apiKey: string) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify([
      {
        op: "remove",
        path: "/layers/tts/voice_settings/speed",
      },
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  return { status: response.status, ok: response.ok }
}

function ttsState(payload: any) {
  const tts = payload?.layers?.tts || null
  const speed = tts?.voice_settings && typeof tts.voice_settings === "object"
    ? tts.voice_settings.speed ?? null
    : null
  return {
    engine: tts?.tts_engine || null,
    model: tts?.tts_model_name || null,
    speed,
  }
}

function needsRepair(state: ReturnType<typeof ttsState>) {
  return String(state.model || "").toLowerCase().includes("sonic-3") && state.speed !== null
}

export async function GET() {
  const apiKey = process.env.TAVUS_API_KEY || ""
  const agentId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID || ""
  if (!apiKey || !agentId) {
    return Response.json({ ok: false, error: "tavus_not_configured" }, { status: 503 })
  }

  const encodedAgent = encodeURIComponent(agentId)
  const palUrl = `https://tavusapi.com/v2/pals/${encodedAgent}`
  const personaUrl = `https://tavusapi.com/v2/personas/${encodedAgent}`

  const before = await getJson(process.env.TAVUS_PAL_ID ? palUrl : personaUrl, apiKey)
  const beforeState = ttsState(before.body)
  const attempts: Array<{ endpoint: "pal" | "persona"; status: number; ok: boolean }> = []

  if (needsRepair(beforeState)) {
    if (process.env.TAVUS_PAL_ID) {
      const palPatch = await removeLegacySpeed(palUrl, apiKey)
      attempts.push({ endpoint: "pal", ...palPatch })
    } else {
      const personaPatch = await removeLegacySpeed(personaUrl, apiKey)
      attempts.push({ endpoint: "persona", ...personaPatch })
    }
  }

  let after = await getJson(process.env.TAVUS_PAL_ID ? palUrl : personaUrl, apiKey)
  let afterState = ttsState(after.body)

  // PAL and Persona APIs can alias the same conversational agent during migration.
  // If the primary endpoint accepted the patch but still exposes the legacy field,
  // try the legacy Persona endpoint once as a compatibility fallback.
  if (needsRepair(afterState) && process.env.TAVUS_PAL_ID) {
    const personaPatch = await removeLegacySpeed(personaUrl, apiKey)
    attempts.push({ endpoint: "persona", ...personaPatch })
    after = await getJson(palUrl, apiKey)
    afterState = ttsState(after.body)
  }

  return Response.json({
    ok: !needsRepair(afterState),
    repaired: needsRepair(beforeState) && !needsRepair(afterState),
    before: beforeState,
    after: afterState,
    attempts,
  }, { headers: { "Cache-Control": "no-store" } })
}
