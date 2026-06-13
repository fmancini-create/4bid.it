// =============================================================================
// Helper condiviso per i "Solleciti caldi" (warm follow-up) DEM.
// Usato dalle API /api/dem/warm/* e dal cron /api/cron/dem-warm-send.
// Tutte le operazioni sono ADDITIVE: il sollecito e' una campagna FIGLIA
// (campaign_kind='warm_followup') collegata alla campagna originale, cosi'
// send/track/unsubscribe/quote esistenti continuano a funzionare invariati.
// =============================================================================

// Volutamente "any" per i client Supabase: evita ricorsioni di tipo pesanti
// (TS2589 / OOM su tsc full) gia' osservate sul progetto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

export const MAX_STEPS = 3
export const DEFAULT_STEP_DELAY_DAYS = 4
// Intervallo minimo (in ore) tra due solleciti allo stesso contatto.
export const MIN_FOLLOWUP_GAP_HOURS = 72

// Stati commerciali in ordine di avanzamento nel funnel.
export const COMMERCIAL_STATUSES = [
  "interessato",
  "demo_da_prenotare",
  "demo_prenotata",
  "demo_effettuata",
  "pilot_proposto",
  "pilot_attivato",
  "cliente",
] as const
export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number] | "non_interessato"

export const COMMERCIAL_STATUS_LABELS: Record<string, string> = {
  interessato: "Interessato",
  demo_da_prenotare: "Demo da prenotare",
  demo_prenotata: "Demo prenotata",
  demo_effettuata: "Demo effettuata",
  pilot_proposto: "Pilot proposto",
  pilot_attivato: "Pilot attivato",
  cliente: "Cliente",
  non_interessato: "Non interessato",
}

// Rank usato per il funnel cumulativo (non_interessato resta fuori scala).
export function commercialRank(status: string): number {
  const idx = (COMMERCIAL_STATUSES as readonly string[]).indexOf(status)
  return idx < 0 ? -1 : idx
}

// Stati che fermano definitivamente la sequenza di solleciti.
export const TERMINAL_COMMERCIAL_STATUSES = new Set<string>([
  "demo_prenotata",
  "demo_effettuata",
  "pilot_attivato",
  "cliente",
  "non_interessato",
])

// Eventi funnel registrati in dem_tracking_events (event_type e' text: nessuna migrazione).
export const FUNNEL_EVENT_BY_STATUS: Record<string, string> = {
  demo_prenotata: "demo_booked",
  demo_effettuata: "demo_completed",
  pilot_attivato: "pilot_started",
  cliente: "customer_acquired",
}

// Link prenotazione di default (EDITABILE in UI). E' lo short-link ufficiale
// di Google Appointment Scheduling (calendar.app.google); il tracking del click
// lo riconosce come "click calendario" (vedi regex in /api/dem/track).
export const DEFAULT_CALENDAR_URL = "https://calendar.app.google/9dgtQgkiDtMMTJ5d7"

export interface AudienceConfig {
  min_clicks?: number
  recency_days?: number | null
}

// ---------------------------------------------------------------------------
// Template email di default per ciascuno step (tono progressivamente piu' diretto).
// Riusa lo stile delle DEM esistenti (navy/oro/teal). I token {{nome_azienda}} e
// {{unsubscribe}} sono gestiti dal send. La CTA punta al link calendario.
// ---------------------------------------------------------------------------
function buildFollowupHtml(opts: {
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Santaddeo · Solleciti</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #e6e3dd;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="background-color:#ffffff;padding:30px 32px 20px;border-bottom:3px solid #c8a45c;">
              <img src="https://www.4bid.it/santaddeo-logo.png" alt="Santaddeo · Hotel Accelerator" width="250" style="display:block;width:250px;max-width:82%;height:auto;margin:0 auto;border:0;" />
              <p style="margin:18px 0 0;color:#2bb3a3;font-size:16px;font-weight:bold;font-style:italic;letter-spacing:.3px;">L'RMS che paghi solo se funziona!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-size:15px;line-height:1.65;color:#2d2d2d;">
              <p style="margin:0 0 16px;">Gentile {{nome_azienda}},</p>
              <p style="margin:0 0 16px;">${opts.intro}</p>
              <p style="margin:0 0 24px;">${opts.body}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 32px 28px;">
              <a href="${opts.ctaUrl}" style="display:inline-block;background-color:#2bb3a3;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:15px 40px;border-radius:6px;">${opts.ctaLabel}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;font-size:13px;line-height:1.6;color:#5a5a5a;">
                    <strong style="color:#1b2a4a;">4 Bid s.r.l.</strong><br />
                    <a href="https://www.santaddeo.com" style="color:#1b2a4a;text-decoration:none;">www.santaddeo.com</a> · <a href="mailto:clienti@4bid.it" style="color:#1b2a4a;text-decoration:none;">clienti@4bid.it</a>
                  </td>
                  <td align="right" style="vertical-align:middle;width:72px;">
                    <img src="https://www.4bid.it/4bid-colorful-logo.jpg" alt="4 Bid" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:8px;border:0;margin-left:auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;font-size:11px;color:#9a9a9a;line-height:1.5;">Non vuoi piu' ricevere queste comunicazioni? <a href="{{unsubscribe}}" style="color:#9a9a9a;text-decoration:underline;">Annulla iscrizione</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function defaultStepContent(stepNumber: number, ctaUrl: string = DEFAULT_CALENDAR_URL) {
  const ctaLabel = "Prenota la tua analisi gratuita"
  if (stepNumber === 1) {
    return {
      subject: "{{nome_azienda}}: vuoi vedere quanto puoi guadagnare in piu' con Santaddeo?",
      preheader: "Una breve analisi gratuita sul tuo revenue, senza impegno.",
      html: buildFollowupHtml({
        intro:
          "qualche giorno fa ti abbiamo scritto a proposito di <strong>Santaddeo</strong>, la piattaforma italiana di revenue management per l'hotellerie, e abbiamo visto che hai dato un'occhiata.",
        body:
          "Ti va di approfondire con una <strong>analisi gratuita</strong> dedicata alla tua struttura? In pochi minuti ti mostriamo dove stai lasciando margine sul tavolo.",
        ctaLabel,
        ctaUrl,
      }),
      cta_url: ctaUrl,
    }
  }
  if (stepNumber === 2) {
    return {
      subject: "Ti riservo uno slot per l'analisi gratuita, {{nome_azienda}}",
      preheader: "Bastano 20 minuti per capire il potenziale inespresso.",
      html: buildFollowupHtml({
        intro:
          "non vorrei rubarti tempo, ma credo davvero che <strong>Santaddeo</strong> possa aiutare {{nome_azienda}} a vendere le camere al prezzo giusto, ogni giorno.",
        body:
          "Ho tenuto liberi alcuni slot questa settimana: scegli quello che preferisci e ti mostro tutto in una breve call.",
        ctaLabel,
        ctaUrl,
      }),
      cta_url: ctaUrl,
    }
  }
  return {
    subject: "Ultimo promemoria: l'analisi gratuita per {{nome_azienda}}",
    preheader: "Se non e' il momento giusto, nessun problema.",
    html: buildFollowupHtml({
      intro:
        "questo e' l'ultimo promemoria che ti invio. Se il tema del revenue management ti interessa, sono qui.",
      body:
        "Prenota la tua <strong>analisi gratuita</strong> quando vuoi: bastano pochi minuti e nessun impegno. In caso contrario, non ti disturbero' oltre.",
      ctaLabel,
      ctaUrl,
    }),
    cta_url: ctaUrl,
  }
}

// ---------------------------------------------------------------------------
// Pubblico "caldo": destinatari dell'originale che hanno cliccato almeno
// `min_clicks` volte (ed eventualmente di recente), esclusi disiscritti e falliti.
// Ritorna le righe dem_recipients candidate.
// ---------------------------------------------------------------------------
export async function fetchWarmAudience(
  supabase: SupabaseLike,
  originalCampaignId: string,
  config: AudienceConfig
): Promise<
  Array<{
    id: string
    email: string
    nome: string | null
    cognome: string | null
    nome_azienda: string | null
    open_count: number | null
    click_count: number | null
    first_click_at: string | null
    last_open_at: string | null
  }>
> {
  const minClicks = Math.max(1, Number(config?.min_clicks ?? 1))
  const recencyDays = config?.recency_days ?? null

  // Lista soppressione globale (disiscritti) -> mai "caldi".
  const { data: unsubRows } = await supabase.from("dem_unsubscribes").select("email").range(0, 99999)
  const unsubSet = new Set<string>(
    (unsubRows || []).map((r: { email: string | null }) => (r.email || "").toLowerCase()).filter(Boolean)
  )

  let query = supabase
    .from("dem_recipients")
    .select("id, email, nome, cognome, nome_azienda, open_count, click_count, first_click_at, last_open_at")
    .eq("campaign_id", originalCampaignId)
    .gte("click_count", minClicks)
    .neq("send_status", "failed")

  if (recencyDays && recencyDays > 0) {
    const since = new Date(Date.now() - recencyDays * 86_400_000).toISOString()
    // first_click_at e' il segnale di interesse piu' affidabile gia' memorizzato.
    query = query.gte("first_click_at", since)
  }

  const { data, error } = await query.limit(50000)
  if (error) throw new Error(error.message)

  return (data || []).filter(
    (r: { email: string | null }) => r.email && !unsubSet.has(String(r.email).toLowerCase())
  )
}

// Arruola (o aggiorna) i candidati caldi in dem_followup_recipients.
// Idempotente grazie a UNIQUE(followup_id, email): usa upsert ignorando i duplicati.
export async function enrollWarmRecipients(
  supabase: SupabaseLike,
  followup: { id: string; original_campaign_id: string; audience_config: AudienceConfig }
): Promise<{ enrolled: number; audience: number }> {
  const audience = await fetchWarmAudience(supabase, followup.original_campaign_id, followup.audience_config)
  if (audience.length === 0) return { enrolled: 0, audience: 0 }

  const rows = audience.map((r) => ({
    followup_id: followup.id,
    original_campaign_id: followup.original_campaign_id,
    original_recipient_id: r.id,
    email: String(r.email).toLowerCase(),
    nome: r.nome,
    cognome: r.cognome,
    nome_azienda: r.nome_azienda,
    orig_open_count: r.open_count || 0,
    orig_click_count: r.click_count || 0,
    orig_last_click_at: r.first_click_at || null,
  }))

  let enrolled = 0
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { data, error } = await supabase
      .from("dem_followup_recipients")
      .upsert(batch, { onConflict: "followup_id,email", ignoreDuplicates: true })
      .select("id")
    if (!error && data) enrolled += data.length
  }
  return { enrolled, audience: audience.length }
}

export interface EligibleWarmRecipient {
  id: string
  email: string
  nome: string | null
  cognome: string | null
  nome_azienda: string | null
  original_recipient_id: string | null
  followups_sent: number
}

// Destinatari eleggibili a ricevere lo STEP indicato (invio sequenziale).
// Regole: gia' ricevuti esattamente stepNumber-1 solleciti, intervallo minimo
// rispettato (delay dello step, almeno MIN_FOLLOWUP_GAP_HOURS), non esclusi/
// non rispondenti, stato non terminale, non disiscritti.
export async function fetchEligibleWarmRecipients(
  supabase: SupabaseLike,
  followupId: string,
  stepNumber: number,
  delayDays: number,
  limit = 1000
): Promise<EligibleWarmRecipient[]> {
  const minGapMs = Math.max(MIN_FOLLOWUP_GAP_HOURS * 3600_000, (delayDays || 0) * 86_400_000)
  const gapThreshold = new Date(Date.now() - minGapMs).toISOString()

  const { data, error } = await supabase
    .from("dem_followup_recipients")
    .select(
      "id, email, nome, cognome, nome_azienda, original_recipient_id, followups_sent, last_followup_at, commercial_status, excluded, responded"
    )
    .eq("followup_id", followupId)
    .eq("excluded", false)
    .eq("responded", false)
    .eq("followups_sent", stepNumber - 1)
    .order("orig_click_count", { ascending: false })
    .limit(limit * 3)
  if (error) throw new Error(error.message)

  // Lista soppressione globale.
  const emails = (data || []).map((r: { email: string }) => r.email).filter(Boolean)
  const unsubSet = new Set<string>()
  if (emails.length > 0) {
    const { data: unsubRows } = await supabase.from("dem_unsubscribes").select("email").in("email", emails)
    for (const row of unsubRows || []) if (row.email) unsubSet.add(String(row.email).toLowerCase())
  }

  return (data || [])
    .filter((r: Record<string, unknown>) => !TERMINAL_COMMERCIAL_STATUSES.has(String(r.commercial_status)))
    .filter((r: Record<string, unknown>) => {
      // Lo step 1 (delay 0) non richiede intervallo dal precedente.
      if (stepNumber <= 1) return true
      const last = r.last_followup_at as string | null
      return !last || last < gapThreshold
    })
    .filter((r: { email: string }) => !unsubSet.has(String(r.email).toLowerCase()))
    .slice(0, limit)
    .map((r: Record<string, unknown>) => ({
      id: r.id as string,
      email: r.email as string,
      nome: (r.nome as string) || null,
      cognome: (r.cognome as string) || null,
      nome_azienda: (r.nome_azienda as string) || null,
      original_recipient_id: (r.original_recipient_id as string) || null,
      followups_sent: (r.followups_sent as number) || 0,
    }))
}

// Crea (o riusa) la campagna FIGLIA collegata a uno step di sollecito.
export async function getOrCreateStepCampaign(
  supabase: SupabaseLike,
  params: {
    followupId: string
    originalCampaignId: string
    originalCampaignName: string
    step: { id: string; step_number: number; subject: string; html_template: string; send_campaign_id: string | null }
  }
): Promise<string | null> {
  if (params.step.send_campaign_id) return params.step.send_campaign_id

  const { data: created, error } = await supabase
    .from("dem_campaigns")
    .insert({
      name: `${params.originalCampaignName} · Sollecito ${params.step.step_number}`,
      subject: params.step.subject || "Sollecito",
      html_template: params.step.html_template || "",
      status: "draft",
      sent_count: 0,
      failed_count: 0,
      open_count: 0,
      click_count: 0,
      unique_opens: 0,
      unique_clicks: 0,
      campaign_kind: "warm_followup",
      original_campaign_id: params.originalCampaignId,
      followup_id: params.followupId,
      sequence_step: params.step.step_number,
    })
    .select("id")
    .single()

  if (error || !created) return null

  await supabase
    .from("dem_followup_steps")
    .update({ send_campaign_id: created.id, updated_at: new Date().toISOString() })
    .eq("id", params.step.id)

  return created.id as string
}

export interface FollowupStepRow {
  id: string
  step_number: number
  enabled: boolean
  subject: string
  preheader: string | null
  html_template: string
  cta_url: string | null
  delay_days: number
  send_campaign_id: string | null
  status: string
}

// Invia UNO step di sollecito: arruola gli eleggibili nella campagna figlia come
// 'pending', delega l'invio reale a /api/dem/send (tracking/unsub/throttle inclusi)
// e aggiorna i contatori commerciali. Idempotente: chi ha gia' ricevuto lo step
// non viene re-arruolato (followups_sent == step_number - 1).
export async function dispatchWarmStep(
  supabase: SupabaseLike,
  params: {
    followup: { id: string; original_campaign_id: string }
    originalCampaignName: string
    step: FollowupStepRow
    baseUrl: string
    maxToSend: number
    onlyEmails?: string[]
  }
): Promise<{ childCampaignId: string | null; requested: number; sent: number; sendResult?: unknown }> {
  const { followup, step, baseUrl } = params
  if (params.maxToSend <= 0 || !step.enabled) {
    return { childCampaignId: step.send_campaign_id, requested: 0, sent: 0 }
  }

  let eligible = await fetchEligibleWarmRecipients(
    supabase,
    followup.id,
    step.step_number,
    step.delay_days,
    Math.max(params.maxToSend, 1)
  )

  if (params.onlyEmails && params.onlyEmails.length > 0) {
    const set = new Set(params.onlyEmails.map((e) => e.toLowerCase()))
    eligible = eligible.filter((r) => set.has(r.email.toLowerCase()))
  }

  eligible = eligible.slice(0, params.maxToSend)
  if (eligible.length === 0) {
    return { childCampaignId: step.send_campaign_id, requested: 0, sent: 0 }
  }

  const childId = await getOrCreateStepCampaign(supabase, {
    followupId: followup.id,
    originalCampaignId: followup.original_campaign_id,
    originalCampaignName: params.originalCampaignName,
    step,
  })
  if (!childId) return { childCampaignId: null, requested: 0, sent: 0 }

  // Allinea soggetto/template della figlia all'ultima versione dello step.
  await supabase
    .from("dem_campaigns")
    .update({ subject: step.subject, html_template: step.html_template, updated_at: new Date().toISOString() })
    .eq("id", childId)

  // Quali email sono gia' presenti nella figlia (per evitare duplicati)?
  const attemptedEmails = eligible.map((r) => r.email.toLowerCase())
  const { data: existingRows } = await supabase
    .from("dem_recipients")
    .select("email")
    .eq("campaign_id", childId)
    .in("email", attemptedEmails)
  const existingSet = new Set((existingRows || []).map((r: { email: string }) => String(r.email).toLowerCase()))

  const toInsert = eligible
    .filter((r) => !existingSet.has(r.email.toLowerCase()))
    .map((r) => ({
      campaign_id: childId,
      email: r.email.toLowerCase(),
      nome: r.nome,
      cognome: r.cognome,
      nome_azienda: r.nome_azienda,
      tipo_contatto: "warm_followup",
      send_status: "pending",
      open_count: 0,
      click_count: 0,
    }))

  for (let i = 0; i < toInsert.length; i += 100) {
    await supabase.from("dem_recipients").insert(toInsert.slice(i, i + 100))
  }

  // Invio reale tramite l'endpoint collaudato.
  let sendResult: unknown = null
  try {
    const res = await fetch(`${baseUrl}/api/dem/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: childId, batch_size: eligible.length }),
    })
    sendResult = await res.json().catch(() => ({}))
  } catch (err) {
    sendResult = { error: err instanceof Error ? err.message : "send failed" }
  }

  // Aggiorna i contatori commerciali per chi risulta effettivamente inviato.
  const { data: sentRows } = await supabase
    .from("dem_recipients")
    .select("email")
    .eq("campaign_id", childId)
    .eq("send_status", "sent")
    .in("email", attemptedEmails)
  const sentEmails = (sentRows || []).map((r: { email: string }) => String(r.email).toLowerCase())

  const nowIso = new Date().toISOString()
  for (let i = 0; i < sentEmails.length; i += 100) {
    const batch = sentEmails.slice(i, i + 100)
    // Avanza il contatore allo step corrente e segna l'orario.
    await supabase
      .from("dem_followup_recipients")
      .update({ followups_sent: step.step_number, last_followup_at: nowIso, updated_at: nowIso })
      .eq("followup_id", followup.id)
      .in("email", batch)
    // Chi era solo "interessato" passa a "demo_da_prenotare" (ingaggio avviato).
    await supabase
      .from("dem_followup_recipients")
      .update({ commercial_status: "demo_da_prenotare", updated_at: nowIso })
      .eq("followup_id", followup.id)
      .eq("commercial_status", "interessato")
      .in("email", batch)
  }

  // Marca lo step come inviato (almeno una tornata effettuata).
  if (sentEmails.length > 0) {
    await supabase
      .from("dem_followup_steps")
      .update({ status: "sent", sent_at: step.status === "sent" ? undefined : nowIso, updated_at: nowIso })
      .eq("id", step.id)
  }

  return { childCampaignId: childId, requested: eligible.length, sent: sentEmails.length, sendResult }
}
