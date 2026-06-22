import { google } from "googleapis"

/**
 * Lettura Google Search Console per il monitor SEO di 4bid.
 * Riusa un service account (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
 * con scope di sola lettura. Property dominio: GSC_SITE_URL (default sc-domain:4bid.it).
 *
 * Setup richiesto una tantum (vedi pannello istruzioni nella pagina /admin/seo):
 *  1. abilitare "Google Search Console API" nel progetto Google Cloud del SA;
 *  2. in Search Console > Impostazioni > Utenti e autorizzazioni, aggiungere
 *     l'email del SA come utente della property.
 */

export const GSC_SITE_URL = process.env.GSC_SITE_URL || "sc-domain:4bid.it"

/** Errore tipizzato per i casi di setup mancante: la UI mostra istruzioni dedicate. */
export class SearchConsoleSetupError extends Error {
  constructor(
    message: string,
    public readonly serviceAccountEmail: string | null,
  ) {
    super(message)
    this.name = "SearchConsoleSetupError"
  }
}

export type GscRow = {
  query: string
  page?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

function getServiceAccountEmail(): string | null {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null
}

function getClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new SearchConsoleSetupError(
      "Credenziali del service account Google mancanti (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).",
      email || null,
    )
  }
  // La private key nelle env spesso ha i \n escaped: ripristina i newline reali.
  const privateKey = rawKey.replace(/\\n/g, "\n")
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  })
  return google.searchconsole({ version: "v1", auth })
}

/** Converte gli errori googleapis di setup in SearchConsoleSetupError leggibili. */
function wrapGoogleError(err: unknown): never {
  const email = getServiceAccountEmail()
  const message = err instanceof Error ? err.message : String(err)
  if (
    /has not been used|is disabled|accessNotConfigured|SERVICE_DISABLED/i.test(message) ||
    /permission|forbidden|403|does not have sufficient/i.test(message)
  ) {
    throw new SearchConsoleSetupError(
      "Search Console non è ancora accessibile: abilita la Search Console API nel progetto Google Cloud e aggiungi il service account come utente della property.",
      email,
    )
  }
  if (err instanceof SearchConsoleSetupError) throw err
  throw new Error(message)
}

// GSC ha latenza: chiudiamo la finestra a -2 giorni.
function dateRange(days: number) {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 2)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - days)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { startDate: fmt(start), endDate: fmt(end) }
}

/** Top query del periodo (per dashboard e snapshot). */
export async function getTopQueries(days = 28, rowLimit = 250): Promise<GscRow[]> {
  try {
    const sc = getClient()
    const { startDate, endDate } = dateRange(days)
    const res = await sc.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: { startDate, endDate, dimensions: ["query"], rowLimit },
    })
    return (res.data.rows || []).map((r) => ({
      query: r.keys?.[0] || "",
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }))
  } catch (err) {
    wrapGoogleError(err)
  }
}

/** Query + pagina di atterraggio (per capire QUALE landing posiziona per QUALE query). */
export async function getQueryPagePairs(days = 28, rowLimit = 1000): Promise<GscRow[]> {
  try {
    const sc = getClient()
    const { startDate, endDate } = dateRange(days)
    const res = await sc.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: { startDate, endDate, dimensions: ["query", "page"], rowLimit },
    })
    return (res.data.rows || []).map((r) => ({
      query: r.keys?.[0] || "",
      page: r.keys?.[1] || "",
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }))
  } catch (err) {
    wrapGoogleError(err)
  }
}

/** Serie giornaliera (posizione/clic/impressioni) per una singola query. */
export async function getQueryTrend(query: string, days = 90) {
  try {
    const sc = getClient()
    const { startDate, endDate } = dateRange(days)
    const res = await sc.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["date"],
        dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "equals", expression: query }] }],
        rowLimit: 1000,
      },
    })
    return (res.data.rows || []).map((r) => ({
      date: r.keys?.[0] || "",
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }))
  } catch (err) {
    wrapGoogleError(err)
  }
}

export function getConfiguredServiceAccountEmail() {
  return getServiceAccountEmail()
}
