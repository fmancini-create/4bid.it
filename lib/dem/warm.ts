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
// DESIGN IDENTICO all'invito demo "Hotel - Invito Demo Santaddeo" (header con
// logo 320px e bordo teal #2bb3a3, corpo 16px/1.7, blocco contatti testuale,
// footer identico). Cambiano solo i TESTI (intro/body/CTA) da sollecito.
// I token {{nome_azienda}} e {{unsubscribe}} sono gestiti dal send.
// ---------------------------------------------------------------------------
function buildFollowupHtml(opts: {
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
  preheader?: string
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Santaddeo</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f2;">
    ${opts.preheader || ""}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #e6e3dd;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:32px 32px 24px;border-bottom:3px solid #2bb3a3;">
              <img src="https://www.4bid.it/santaddeo-logo.png" alt="Santaddeo - Hotel Accelerator" width="320" style="display:block;width:320px;max-width:80%;height:auto;border:0;margin:0 auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;font-size:16px;line-height:1.7;color:#2d2d2d;">
              <p style="margin:0 0 18px;">Gentile {{nome_azienda}},</p>
              <p style="margin:0 0 18px;">${opts.intro}</p>
              <p style="margin:0 0 18px;">${opts.body}</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:14px 32px 10px;">
              <a href="${opts.ctaUrl}" style="display:inline-block;background-color:#2bb3a3;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:15px 40px;border-radius:6px;">${opts.ctaLabel}</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 24px;font-size:15px;color:#5a5a5a;line-height:1.6;">
              Oppure rispondi a questa email e ti richiamiamo noi.
            </td>
          </tr>
          <!-- Contacts -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0;font-size:13px;line-height:1.6;color:#5a5a5a;">
                4 Bid s.r.l.<br />
                <a href="https://www.santaddeo.com" style="color:#1b2a4a;">www.santaddeo.com</a> · <a href="https://www.4bid.it" style="color:#1b2a4a;">www.4bid.it</a> · <a href="mailto:clienti@4bid.it" style="color:#1b2a4a;">clienti@4bid.it</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:11px;color:#9a9a9a;line-height:1.5;">Ricevi questa email perché riteniamo Santaddeo utile per la tua struttura ricettiva.<br />Non vuoi più ricevere le nostre comunicazioni? <a href="{{unsubscribe}}" style="color:#9a9a9a;text-decoration:underline;">Annulla iscrizione</a>.</p>
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
        preheader: "Una breve analisi gratuita sul tuo revenue, senza impegno.",
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
        preheader: "Bastano 20 minuti per capire il potenziale inespresso.",
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
      preheader: "Se non e' il momento giusto, nessun problema.",
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

  const { data: unsubRows } = await supabase.from("dem_unsubscribes").select("email").range(0, 99999)
  const unsubSet = new Set<string>(
    (unsubRows || []).map((r: { email: string | null }) => (r.email || "").toLowerCase()).filter(Boolean)
  )

  let query = supabase
    .from("dem_recipients")
    .select("id, email, nome, cognome, nome_azienda, open_count, click_count, first_click_at, last_open_at")
    .eq("campaign_id", originalCampaignId)
    .gte("click_count", minClicks)
    .not("send_status", "in", "(failed,bounced,complained)")

  if (recencyDays && recencyDays > 0) {
    const since = new Date(Date.now() - recencyDays * 86_400_000).toISOString()
    query = query.gte("first_click_at", since)
  }

  const { data, error } = await query.limit(50000)
  if (error) throw new Error(error.message)

  return (data || []).filter(
    (r: { email: string | null }) => r.email && !unsubSet.has(String(r.email).toLowerCase())
  )
}

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

  const emails = (data || []).map((r: { email: string }) => r.email).filter(Boolean)
  const unsubSet = new Set<string>()
  const bouncedSet = new Set<string>()
  if (emails.length > 0) {
    const { data: unsubRows } = await supabase.from("dem_unsubscribes").select("email").in("email", emails)
    for (const row of unsubRows || []) if (row.email) unsubSet.add(String(row.email).toLowerCase())

    const { data: bouncedRows } = await supabase
      .from("dem_recipients")
      .select("email")
      .in("email", emails)
      .in("send_status", ["bounced", "complained"])
    for (const row of bouncedRows || []) if (row.email) bouncedSet.add(String(row.email).toLowerCase())
  }

  return (data || [])
    .filter((r: Record<string, unknown>) => !TERMINAL_COMMERCIAL_STATUSES.has(String(r.commercial_status)))
    .filter((r: Record<string, unknown>) => {
      if (stepNumber <= 1) return true
      const last = r.last_followup_at as string | null
      return !last || last < gapThreshold
    })
    .filter((r: { email: string }) => {
      const key = String(r.email).toLowerCase()
      return !unsubSet.has(key) && !bouncedSet.has(key)
    })
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
      auto_send: false,
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

// Guardrail reputazione per i richiami: campione degli ultimi invii.
// >=1,5% warning; >=2% volume dimezzato; >=3% stop.
export const WARM_BOUNCE_WARN_THRESHOLD = 0.015
export const WARM_BOUNCE_SLOW_THRESHOLD = 0.02
export const WARM_BOUNCE_STOP_THRESHOLD = 0.03
export const WARM_BOUNCE_MIN_SAMPLE = 200
export const WARM_BOUNCE_SAMPLE_SIZE = 500

export async function checkWarmBounceRate(
  supabase: SupabaseLike,
  followupId: string
): Promise<{
  blocked: boolean
  slowed: boolean
  warned: boolean
  unreadable: boolean
  reason: string | null
  measured: number
  bounced: number
  rate: number
}> {
  const esito = (
    o: Partial<{
      blocked: boolean
      slowed: boolean
      warned: boolean
      unreadable: boolean
      reason: string | null
      rate: number
    }>,
    m = 0,
    b = 0,
  ) => ({
    blocked: false,
    slowed: false,
    warned: false,
    unreadable: false,
    reason: null,
    measured: m,
    bounced: b,
    rate: m > 0 ? b / m : 0,
    ...o,
  })

  const { data: figlie, error: eFiglie } = await supabase
    .from("dem_campaigns")
    .select("id")
    .eq("followup_id", followupId)
  if (eFiglie) return esito({ unreadable: true, reason: eFiglie.message || "lettura campagne figlie fallita" })

  const ids = (figlie || []).map((c: { id: string }) => c.id)
  if (ids.length === 0) return esito({})

  const { data: righe, error: eRighe } = await supabase
    .from("dem_recipients")
    .select("send_status")
    .in("campaign_id", ids)
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(WARM_BOUNCE_SAMPLE_SIZE)
  if (eRighe) return esito({ unreadable: true, reason: eRighe.message || "lettura destinatari fallita" })

  const misurate = (righe || []).length
  const rimbalzate = (righe || []).filter((r: { send_status: string }) => r.send_status === "bounced").length
  if (misurate < WARM_BOUNCE_MIN_SAMPLE) return esito({}, misurate, rimbalzate)

  const tasso = rimbalzate / misurate
  if (tasso >= WARM_BOUNCE_STOP_THRESHOLD) {
    return esito(
      {
        blocked: true,
        rate: tasso,
        reason: `Sospeso automaticamente: ${(tasso * 100).toFixed(1)}% di rimbalzi sulle ultime ${misurate} email inviate (${rimbalzate} su ${misurate}), soglia stop ${WARM_BOUNCE_STOP_THRESHOLD * 100}%. Ripulire la lista prima di riprendere.`,
      },
      misurate,
      rimbalzate,
    )
  }

  if (tasso >= WARM_BOUNCE_SLOW_THRESHOLD) {
    return esito(
      {
        slowed: true,
        warned: true,
        rate: tasso,
        reason: `Rallentamento automatico: ${(tasso * 100).toFixed(1)}% di rimbalzi sulle ultime ${misurate} email; volume dimezzato.`,
      },
      misurate,
      rimbalzate,
    )
  }

  if (tasso >= WARM_BOUNCE_WARN_THRESHOLD) {
    return esito(
      {
        warned: true,
        rate: tasso,
        reason: `Warning reputazione: ${(tasso * 100).toFixed(1)}% di rimbalzi sulle ultime ${misurate} email.`,
      },
      misurate,
      rimbalzate,
    )
  }

  return esito({ rate: tasso }, misurate, rimbalzate)
}

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

  const freno = await checkWarmBounceRate(supabase, followup.id)
  if (freno.unreadable) {
    console.error(`[v0] dem-warm-send: tasso rimbalzi non misurabile per ${followup.id}, salto per prudenza`)
    return {
      childCampaignId: step.send_campaign_id,
      requested: 0,
      sent: 0,
      sendResult: { skipped: "bounce_rate_unreadable", reason: freno.reason },
    }
  }
  if (freno.blocked) {
    await supabase
      .from("dem_followups")
      .update({ status: "paused", paused_reason: freno.reason, updated_at: new Date().toISOString() })
      .eq("id", followup.id)
    console.error(`[v0] dem-warm-send: SOSPESO richiamo ${followup.id} - ${freno.reason}`)
    return {
      childCampaignId: step.send_campaign_id,
      requested: 0,
      sent: 0,
      sendResult: { paused: "bounce_rate_too_high", reason: freno.reason, measured: freno.measured },
    }
  }

  if (freno.slowed) {
    console.warn(`[v0] dem-warm-send: ${freno.reason}`)
  } else if (freno.warned) {
    console.warn(`[v0] dem-warm-send: ${freno.reason}`)
  }

  const effectiveMaxToSend = freno.slowed
    ? Math.max(1, Math.floor(params.maxToSend * 0.5))
    : params.maxToSend

  let eligible = await fetchEligibleWarmRecipients(
    supabase,
    followup.id,
    step.step_number,
    step.delay_days,
    Math.max(effectiveMaxToSend, 1)
  )

  if (params.onlyEmails && params.onlyEmails.length > 0) {
    const set = new Set(params.onlyEmails.map((e) => e.toLowerCase()))
    eligible = eligible.filter((r) => set.has(r.email.toLowerCase()))
  }

  eligible = eligible.slice(0, effectiveMaxToSend)
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

  await supabase
    .from("dem_campaigns")
    .update({ subject: step.subject, html_template: step.html_template, updated_at: new Date().toISOString() })
    .eq("id", childId)

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
      tipo_contatto: "potenziale",
      send_status: "pending",
      open_count: 0,
      click_count: 0,
    }))

  let insertedOk = 0
  for (let i = 0; i < toInsert.length; i += 100) {
    const chunk = toInsert.slice(i, i + 100)
    const { error: insErr } = await supabase.from("dem_recipients").insert(chunk)
    if (insErr) {
      console.error("[v0] warm dispatch: insert destinatari figlia fallito:", insErr.message)
    } else {
      insertedOk += chunk.length
    }
  }
  if (toInsert.length > 0 && insertedOk === 0) {
    return {
      childCampaignId: childId,
      requested: 0,
      sent: 0,
      sendResult: { error: "insert destinatari fallito (0 inseriti)" },
    }
  }

  const { data: childState } = await supabase
    .from("dem_campaigns")
    .select("status, updated_at")
    .eq("id", childId)
    .single()
  if (childState?.status === "sending") {
    const updatedAt = childState.updated_at ? new Date(childState.updated_at as string).getTime() : 0
    if (Date.now() - updatedAt > 15 * 60 * 1000) {
      await supabase
        .from("dem_campaigns")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", childId)
    } else {
      return { childCampaignId: childId, requested: 0, sent: 0, sendResult: { skipped: "sending_in_progress" } }
    }
  }

  let sendResult: unknown = null
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return {
        childCampaignId: childId,
        requested: eligible.length,
        sent: 0,
        sendResult: { error: "CRON_SECRET non configurato", code: "cron_secret_missing", httpStatus: 500 },
      }
    }
    const res = await fetch(`${baseUrl}/api/dem/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ campaign_id: childId, batch_size: eligible.length }),
    })
    const payload = await res.json().catch(() => ({}))
    sendResult = { ...payload, httpStatus: res.status }
  } catch (err) {
    sendResult = { error: err instanceof Error ? err.message : "send failed", httpStatus: 502 }
  }

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
    await supabase
      .from("dem_followup_recipients")
      .update({ followups_sent: step.step_number, last_followup_at: nowIso, updated_at: nowIso })
      .eq("followup_id", followup.id)
      .in("email", batch)
    await supabase
      .from("dem_followup_recipients")
      .update({ commercial_status: "demo_da_prenotare", updated_at: nowIso })
      .eq("followup_id", followup.id)
      .eq("commercial_status", "interessato")
      .in("email", batch)
  }

  if (sentEmails.length > 0) {
    await supabase
      .from("dem_followup_steps")
      .update({ status: "sent", sent_at: step.status === "sent" ? undefined : nowIso, updated_at: nowIso })
      .eq("id", step.id)
  }

  return { childCampaignId: childId, requested: eligible.length, sent: sentEmails.length, sendResult }
}
