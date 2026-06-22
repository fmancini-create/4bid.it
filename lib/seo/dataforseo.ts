/**
 * Client DataForSEO per la scoperta di keyword di settore con volumi REALI.
 * Auth Basic con DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD (pay-as-you-go).
 * Default mercato: Italia (location_code 2380) lingua italiano ("it").
 */

export const DEFAULT_LOCATION_CODE = 2380 // Italia
export const DEFAULT_LANGUAGE_CODE = "it"

export class DataForSeoSetupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DataForSeoSetupError"
  }
}

export type KeywordIdea = {
  keyword: string
  searchVolume: number | null
  competition: number | null
  competitionLevel: string | null
  cpc: number | null
}

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD
  if (!login || !password) {
    throw new DataForSeoSetupError(
      "Credenziali DataForSEO mancanti: imposta DATAFORSEO_LOGIN e DATAFORSEO_PASSWORD nelle variabili d'ambiente del progetto.",
    )
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64")
}

export function isDataForSeoConfigured(): boolean {
  return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)
}

/**
 * Idee keyword a partire da uno o più seed (es. "revenue management hotel").
 * Usa l'endpoint DataForSEO Labs "Keyword Ideas" (volumi e competizione reali).
 */
export async function getKeywordIdeas(
  seeds: string[],
  opts: { locationCode?: number; languageCode?: string; limit?: number } = {},
): Promise<KeywordIdea[]> {
  const cleanSeeds = seeds.map((s) => s.trim()).filter(Boolean).slice(0, 20)
  if (cleanSeeds.length === 0) return []

  const body = [
    {
      keywords: cleanSeeds,
      location_code: opts.locationCode ?? DEFAULT_LOCATION_CODE,
      language_code: opts.languageCode ?? DEFAULT_LANGUAGE_CODE,
      limit: Math.min(opts.limit ?? 200, 1000),
      order_by: ["keyword_info.search_volume,desc"],
    },
  ]

  let res: Response
  try {
    res = await fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live", {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new Error("Richiesta a DataForSEO fallita: " + (err instanceof Error ? err.message : String(err)))
  }

  if (res.status === 401) {
    throw new DataForSeoSetupError("Credenziali DataForSEO non valide (401). Verifica login e password API.")
  }
  if (!res.ok) {
    throw new Error(`DataForSEO ha risposto con status ${res.status}`)
  }

  const json = (await res.json()) as {
    status_code?: number
    status_message?: string
    tasks?: Array<{
      status_code?: number
      status_message?: string
      result?: Array<{ items?: Array<Record<string, unknown>> }>
    }>
  }

  // status_code 20000 = ok. Codici 402xx indicano problemi di credito/accesso.
  if (json.status_code && json.status_code !== 20000) {
    if (json.status_code >= 40200 && json.status_code < 40300) {
      throw new DataForSeoSetupError(`DataForSEO: ${json.status_message || "accesso o credito non disponibile"}.`)
    }
    throw new Error(`DataForSEO error ${json.status_code}: ${json.status_message || "errore sconosciuto"}`)
  }

  const items = json.tasks?.[0]?.result?.[0]?.items || []
  return items.map((it) => {
    const keywordInfo = (it.keyword_info || {}) as Record<string, unknown>
    return {
      keyword: String(it.keyword || ""),
      searchVolume: typeof keywordInfo.search_volume === "number" ? keywordInfo.search_volume : null,
      competition: typeof keywordInfo.competition === "number" ? keywordInfo.competition : null,
      competitionLevel: typeof keywordInfo.competition_level === "string" ? keywordInfo.competition_level : null,
      cpc: typeof keywordInfo.cpc === "number" ? keywordInfo.cpc : null,
    }
  })
}
