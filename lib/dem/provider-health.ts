// =============================================================================
// Guardia unica per la disponibilita' del provider email.
//
// Un errore di credenziali/account e' SISTEMICO: non riguarda il destinatario
// corrente. Trattarlo come errore del singolo contatto trasforma un solo guasto
// in centinaia di righe "failed" e consuma inutilmente tutta la coda.
// =============================================================================

// Volutamente "any" per il client Supabase: e' lo stesso compromesso usato
// dagli helper DEM per evitare tipi generati molto profondi durante il build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

export interface EmailProviderHealth {
  healthy: boolean
  error: string | null
  statusCode: number | null
}

export const PROVIDER_ALERT_PREFIX = "Provider email non disponibile"

const SYSTEMIC_ERROR_PATTERNS = [
  /api key/i,
  /unauthori[sz]ed/i,
  /forbidden/i,
  /account.+suspend/i,
  /account.+disabled/i,
  /quota/i,
  /rate limit/i,
  /temporarily unavailable/i,
  /service unavailable/i,
  /resend_api_key/i,
]

export function isSystemicEmailProviderError(input: {
  message?: string | null
  statusCode?: number | null
}): boolean {
  const status = input.statusCode ?? null
  if (status === 401 || status === 403 || status === 429 || (status !== null && status >= 500)) {
    return true
  }
  const message = input.message || ""
  return SYSTEMIC_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

function messageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const record = payload as Record<string, unknown>
  if (typeof record.message === "string") return record.message
  if (typeof record.error === "string") return record.error
  return null
}

/**
 * Verifica le credenziali con una GET priva di effetti collaterali. Il controllo
 * avviene PRIMA di estrarre destinatari dalla coda e non invia alcuna email.
 */
export async function checkEmailProviderHealth(): Promise<EmailProviderHealth> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) {
    return { healthy: false, error: "RESEND_API_KEY non configurata", statusCode: null }
  }

  try {
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    if (response.ok) return { healthy: true, error: null, statusCode: response.status }

    const payload = await response.json().catch(() => null)
    return {
      healthy: false,
      error: messageFromPayload(payload) || `Resend ha risposto HTTP ${response.status}`,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Provider email non raggiungibile",
      statusCode: null,
    }
  }
}

export function providerPauseReason(health: EmailProviderHealth): string {
  const detail = health.error?.trim() || "verifica del provider fallita"
  return `${PROVIDER_ALERT_PREFIX}: ${detail}. Invii fermati automaticamente; verificare Resend prima di riprendere.`
}

/** Ferma insieme campagne fredde e solleciti caldi, conservando le code. */
export async function pauseAllDemForProvider(
  supabase: SupabaseLike,
  health: EmailProviderHealth,
): Promise<string> {
  const reason = providerPauseReason(health)
  const now = new Date().toISOString()

  const [campaignsResult, followupsResult] = await Promise.all([
    supabase
      .from("dem_campaigns")
      .update({ auto_send: false, auto_paused_reason: reason, updated_at: now })
      .eq("auto_send", true),
    supabase
      .from("dem_followups")
      .update({ status: "paused", paused_reason: reason, updated_at: now })
      .eq("status", "active"),
  ])

  if (campaignsResult.error || followupsResult.error) {
    throw new Error(
      `Impossibile registrare la sospensione DEM: ${campaignsResult.error?.message || followupsResult.error?.message}`,
    )
  }

  // Un timeout o un errore provider puo' lasciare una campagna nello stato
  // transitorio "sending". La coda e' intatta, quindi la rendiamo riprendibile.
  const sendingResult = await supabase
    .from("dem_campaigns")
    .update({ status: "draft", updated_at: now })
    .eq("status", "sending")
  if (sendingResult.error) {
    throw new Error(`Impossibile sbloccare le campagne DEM: ${sendingResult.error.message}`)
  }

  return reason
}
