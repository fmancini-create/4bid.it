// =============================================================================
// Guardia unica per la disponibilita' del provider DEM.
//
// Le email marketing/DEM viaggiano su Brevo SMTP relay. Le email operative e
// transazionali restano su Google Workspace e non devono bloccare le code DEM.
// =============================================================================

const nodemailer = require("nodemailer")

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

export interface EmailProviderHealth {
  healthy: boolean
  error: string | null
  statusCode: number | null
}

export const PROVIDER_ALERT_PREFIX = "Provider email DEM non disponibile"

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
  /brevo_(smtp_user|smtp_key|smtp_password)/i,
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
  if (
    status === 401 ||
    status === 403 ||
    status === 429 ||
    status === 421 ||
    status === 450 ||
    status === 451 ||
    status === 452 ||
    status === 454 ||
    status === 535 ||
    (status !== null && status >= 500 && status < 550)
  ) {
    return true
  }
  const message = input.message || ""
  return SYSTEMIC_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

function brevoPassword(): string | undefined {
  return process.env.BREVO_SMTP_KEY?.trim() || process.env.BREVO_SMTP_PASSWORD?.trim()
}

function brevoSmtpConfig() {
  const host = process.env.BREVO_SMTP_HOST?.trim() || "smtp-relay.brevo.com"
  const user = process.env.BREVO_SMTP_USER?.trim()
  const pass = brevoPassword()
  const port = Number.parseInt(process.env.BREVO_SMTP_PORT || "587", 10)
  const explicitSecure = process.env.BREVO_SMTP_SECURE?.trim().toLowerCase()
  const secure = explicitSecure ? explicitSecure === "true" : port === 465

  if (!user || !pass) return null

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

/** Verifica il relay Brevo senza inviare email, prima di estrarre destinatari. */
export async function checkEmailProviderHealth(): Promise<EmailProviderHealth> {
  const config = brevoSmtpConfig()
  if (!config) {
    return {
      healthy: false,
      error: "Configurazione Brevo incompleta: verificare BREVO_SMTP_USER e BREVO_SMTP_KEY/BREVO_SMTP_PASSWORD",
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
      error: error instanceof Error ? error.message : "Brevo SMTP non raggiungibile",
      statusCode: smtpResponseCode(error),
    }
  }
}

export function providerPauseReason(health: EmailProviderHealth): string {
  const detail = health.error?.trim() || "verifica del provider fallita"
  return `${PROVIDER_ALERT_PREFIX}: ${detail}. Invii fermati automaticamente; verificare la configurazione Brevo prima di riprendere.`
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
