// =============================================================================
// Guardia unica per la disponibilita' del provider email.
//
// Un errore di credenziali/account e' SISTEMICO: non riguarda il destinatario
// corrente. Trattarlo come errore del singolo contatto trasforma un solo guasto
// in centinaia di righe "failed" e consuma inutilmente tutta la coda.
// =============================================================================

const nodemailer = require("nodemailer")

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
  /badcredentials/i,
  /authentication/i,
  /invalid login/i,
  /username and password not accepted/i,
  /smtp_(host|user|password|pass)/i,
  /econnrefused/i,
  /econnreset/i,
  /etimedout/i,
  /socket/i,
  /tls/i,
  /dns/i,
]

export function isSystemicEmailProviderError(input: {
  message?: string | null
  statusCode?: number | null
}): boolean {
  const status = input.statusCode ?? null
  if (status === 401 || status === 403 || status === 429 || status === 421 || status === 450 || status === 451 || status === 452 || status === 454 || status === 535 || (status !== null && status >= 500 && status < 550)) {
    return true
  }
  const message = input.message || ""
  return SYSTEMIC_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

function smtpPassword(): string | undefined {
  return process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim()
}

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = smtpPassword()
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10)
  const explicitSecure = process.env.SMTP_SECURE?.trim().toLowerCase()
  const secure = explicitSecure ? explicitSecure === "true" : port === 465

  if (!host || !user || !pass) return null

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  }
}

function smtpResponseCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null
  const record = error as Record<string, unknown>
  return typeof record.responseCode === "number" ? record.responseCode : null
}

/**
 * Verifica connessione e autenticazione SMTP senza inviare email. Il controllo
 * avviene PRIMA di estrarre destinatari dalla coda.
 */
export async function checkEmailProviderHealth(): Promise<EmailProviderHealth> {
  const config = smtpConfig()
  if (!config) {
    return {
      healthy: false,
      error: "Configurazione SMTP incompleta: verificare SMTP_HOST, SMTP_USER e SMTP_PASSWORD/SMTP_PASS",
      statusCode: null,
    }
  }

  try {
    const transporter = nodemailer.createTransport(config)
    await transporter.verify()
    transporter.close?.()
    return { healthy: true, error: null, statusCode: 200 }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Provider SMTP non raggiungibile",
      statusCode: smtpResponseCode(error),
    }
  }
}

export function providerPauseReason(health: EmailProviderHealth): string {
  const detail = health.error?.trim() || "verifica del provider fallita"
  return `${PROVIDER_ALERT_PREFIX}: ${detail}. Invii fermati automaticamente; verificare la configurazione SMTP prima di riprendere.`
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

  const sendingResult = await supabase
    .from("dem_campaigns")
    .update({ status: "draft", updated_at: now })
    .eq("status", "sending")
  if (sendingResult.error) {
    throw new Error(`Impossibile sbloccare le campagne DEM: ${sendingResult.error.message}`)
  }

  return reason
}
