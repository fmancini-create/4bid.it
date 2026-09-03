export const runtime = "nodejs"
export const maxDuration = 30

const DICTIONARY_NAME = "4BID Brand Pronunciation"

async function tavusFetch(url: string, apiKey: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })
}

export async function GET() {
  const apiKey = process.env.TAVUS_API_KEY
  const agentId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID
  if (!apiKey || !agentId) return Response.json({ ok: false, error: "Tavus non configurato" }, { status: 503 })

  const endpoint = process.env.TAVUS_PAL_ID
    ? `https://tavusapi.com/v2/pals/${encodeURIComponent(agentId)}`
    : `https://tavusapi.com/v2/personas/${encodeURIComponent(agentId)}`

  const profileResponse = await tavusFetch(endpoint, apiKey)
  if (!profileResponse.ok) return Response.json({ ok: false, stage: "read-pal", status: profileResponse.status }, { status: 502 })

  const profile = await profileResponse.json().catch(() => ({})) as {
    layers?: {
      tts?: {
        tts_engine?: string
        tts_model_name?: string
        voice_settings?: Record<string, unknown>
        pronunciation_dictionary_id?: string | null
      }
    }
  }

  const tts = profile.layers?.tts || {}

  const dictionariesResponse = await tavusFetch("https://tavusapi.com/v2/pronunciation-dictionaries?limit=100&sort=desc", apiKey)
  if (!dictionariesResponse.ok) {
    return Response.json({ ok: false, stage: "list-dictionaries", status: dictionariesResponse.status }, { status: 502 })
  }

  const dictionaries = await dictionariesResponse.json().catch(() => ({})) as {
    data?: Array<{ pronunciation_dictionary_id?: string; name?: string }>
  }

  let dictionaryId = dictionaries.data?.find((item) => item.name === DICTIONARY_NAME)?.pronunciation_dictionary_id || null

  if (!dictionaryId) {
    const createDictionaryResponse = await tavusFetch("https://tavusapi.com/v2/pronunciation-dictionaries", apiKey, {
      method: "POST",
      body: JSON.stringify({
        name: DICTIONARY_NAME,
        rules: [
          {
            text: "4BID",
            pronunciation: "Four Bid",
            type: "alias",
            case_sensitive: false,
            word_boundaries: true,
          },
        ],
      }),
    })

    const createdDictionary = await createDictionaryResponse.json().catch(() => ({})) as {
      pronunciation_dictionary_id?: string
      error?: string
      message?: string
    }

    if (!createDictionaryResponse.ok || !createdDictionary.pronunciation_dictionary_id) {
      return Response.json(
        { ok: false, stage: "create-dictionary", status: createDictionaryResponse.status, error: createdDictionary.error || createdDictionary.message || null },
        { status: 502 },
      )
    }
    dictionaryId = createdDictionary.pronunciation_dictionary_id
  }

  const nextVoiceSettings = { ...(tts.voice_settings || {}), speed: 0.9 }
  const patch = [
    {
      op: tts.voice_settings ? "replace" : "add",
      path: "/layers/tts/voice_settings",
      value: nextVoiceSettings,
    },
    {
      op: tts.pronunciation_dictionary_id ? "replace" : "add",
      path: "/layers/tts/pronunciation_dictionary_id",
      value: dictionaryId,
    },
  ]

  const patchResponse = await tavusFetch(endpoint, apiKey, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  const patchBody = await patchResponse.json().catch(() => ({}))
  if (!patchResponse.ok) {
    return Response.json({ ok: false, stage: "patch-pal", status: patchResponse.status, details: patchBody }, { status: 502 })
  }

  const verifyResponse = await tavusFetch(endpoint, apiKey)
  const verify = await verifyResponse.json().catch(() => ({})) as {
    layers?: {
      tts?: {
        tts_engine?: string
        tts_model_name?: string
        voice_settings?: Record<string, unknown>
        pronunciation_dictionary_id?: string | null
      }
    }
  }
  const verifiedTts = verify.layers?.tts || {}

  return Response.json({
    ok: verifyResponse.ok,
    engine: verifiedTts.tts_engine || null,
    model: verifiedTts.tts_model_name || null,
    speed: verifiedTts.voice_settings?.speed ?? null,
    dictionaryAttached: Boolean(verifiedTts.pronunciation_dictionary_id),
    pronunciation: "4BID -> Four Bid",
  }, { headers: { "Cache-Control": "no-store" } })
}
