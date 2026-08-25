import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import {
  DEFAULT_CALENDAR_URL,
  DEFAULT_STEP_DELAY_DAYS,
  MAX_STEPS,
  commercialRank,
  defaultStepContent,
  enrollWarmRecipients,
} from "@/lib/dem/warm"
import { checkEmailProviderHealth, pauseAllDemForProvider } from "@/lib/dem/provider-health"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

async function requireSuperAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user && user.email === SUPER_ADMIN_EMAIL
}

// --- GET: configurazione follow-up + card riepilogo + funnel di una campagna ---
export async function GET(request: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("c")
  if (!campaignId) {
    return NextResponse.json({ error: "Campagna mancante" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: campaign, error: campErr } = await supabase
    .from("dem_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single()
  if (campErr || !campaign) {
    return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })
  }

  // Follow-up (max 1 per campagna originale) + step ordinati.
  const { data: followup } = await supabase
    .from("dem_followups")
    .select("*")
    .eq("original_campaign_id", campaignId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  let steps: Record<string, unknown>[] = []
  if (followup) {
    const { data: stepRows } = await supabase
      .from("dem_followup_steps")
      .select("*")
      .eq("followup_id", followup.id)
      .order("step_number", { ascending: true })
    steps = stepRows || []
  }

  // ---- Riepilogo + funnel ----
  let summary = {
    clickers: 0,
    enrolled: 0,
    eligible: 0,
    followups_sent: 0,
    demos: 0,
    excluded: 0,
    not_interested: 0,
  }
  let funnel: Array<{ key: string; label: string; value: number }> = []

  // Clicker dell'originale (potenziali caldi).
  const { count: clickers } = await supabase
    .from("dem_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .gte("click_count", 1)
  summary.clickers = clickers || 0

  if (followup) {
    const fid = followup.id

    const { data: enrolledRows } = await supabase
      .from("dem_followup_recipients")
      .select("commercial_status, excluded, responded, followups_sent, calendar_clicks, demo_booked_at")
      .eq("followup_id", fid)
      .limit(100000)

    const rows = enrolledRows || []
    summary.enrolled = rows.length
    summary.excluded = rows.filter((r) => r.excluded).length
    summary.not_interested = rows.filter((r) => r.commercial_status === "non_interessato").length
    summary.followups_sent = rows.filter((r) => (r.followups_sent || 0) > 0).length
    summary.demos = rows.filter((r) => commercialRank(r.commercial_status) >= commercialRank("demo_prenotata")).length

    // Campagne figlie (per opens/clicks reali da tracking events).
    const { data: childCampaigns } = await supabase
      .from("dem_campaigns")
      .select("id")
      .eq("followup_id", fid)
    const childIds = (childCampaigns || []).map((c) => c.id)

    let uniqueOpens = 0
    let uniqueClicks = 0
    if (childIds.length > 0) {
      const { data: events } = await supabase
        .from("dem_tracking_events")
        .select("email, event_type")
        .in("campaign_id", childIds)
        .limit(100000)
      const opened = new Set<string>()
      const clicked = new Set<string>()
      for (const e of events || []) {
        const em = (e.email || "").toLowerCase()
        if (!em) continue
        if (e.event_type === "open") opened.add(em)
        else if (e.event_type === "click") clicked.add(em)
      }
      uniqueOpens = opened.size
      uniqueClicks = clicked.size
    }

    const calendarClicks = rows.filter((r) => (r.calendar_clicks || 0) > 0).length
    const rankCount = (min: string) =>
      rows.filter((r) => commercialRank(r.commercial_status) >= commercialRank(min)).length

    funnel = [
      { key: "sent", label: "Solleciti inviati", value: summary.followups_sent },
      { key: "opens", label: "Aperture uniche", value: uniqueOpens },
      { key: "clicks", label: "Click unici", value: uniqueClicks },
      { key: "calendar", label: "Click calendario", value: calendarClicks },
      { key: "demo_booked", label: "Demo prenotate", value: rankCount("demo_prenotata") },
      { key: "demo_done", label: "Demo effettuate", value: rankCount("demo_effettuata") },
      { key: "pilot", label: "Pilot attivati", value: rankCount("pilot_attivato") },
      { key: "customer", label: "Clienti acquisiti", value: rankCount("cliente") },
    ]

    summary.eligible = Math.max(
      0,
      rows.filter(
        (r) =>
          !r.excluded &&
          !r.responded &&
          (r.followups_sent || 0) < MAX_STEPS &&
          commercialRank(r.commercial_status) < commercialRank("demo_prenotata") &&
          r.commercial_status !== "non_interessato"
      ).length
    )
  }

  return NextResponse.json({
    campaign,
    followup: followup || null,
    steps,
    summary,
    funnel,
    quota: {
      total: campaign.daily_quota_total ?? null,
      cold: campaign.daily_quota_cold ?? null,
      warm: campaign.daily_quota_warm ?? null,
      reallocate: !!campaign.warm_reallocate_unused,
      priority: !!campaign.warm_priority,
    },
  })
}

// --- POST: crea la sequenza di solleciti (follow-up + 3 step di default) ---
export async function POST(request: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const originalCampaignId = body.original_campaign_id as string
    if (!originalCampaignId) {
      return NextResponse.json({ error: "Campagna originale mancante" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: campaign } = await supabase
      .from("dem_campaigns")
      .select("id, campaign_kind, original_campaign_id, followup_id")
      .eq("id", originalCampaignId)
      .single()
    if (!campaign) {
      return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })
    }

    // Una figlia warm non puo' diventare a sua volta una campagna madre: e'
    // questa ricorsione che produceva nomi come "Sollecito 1 · Sollecito 3 ·
    // Sollecito 1" e sequenze impossibili da governare.
    if (campaign.campaign_kind === "warm_followup" || campaign.original_campaign_id || campaign.followup_id) {
      return NextResponse.json(
        { error: "I solleciti si configurano solo sulla campagna originale, non su un sollecito precedente." },
        { status: 409 },
      )
    }

    // Una sola sequenza per campagna: se esiste, la ritorno invece di duplicare.
    const { data: existing } = await supabase
      .from("dem_followups")
      .select("id")
      .eq("original_campaign_id", originalCampaignId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "Esiste gia' una sequenza di solleciti per questa campagna", followup_id: existing.id }, { status: 409 })
    }

    const ctaUrl = (body.cta_url as string) || DEFAULT_CALENDAR_URL
    const audienceConfig = {
      min_clicks: Math.max(1, Number(body.audience_config?.min_clicks ?? 1)),
      recency_days: body.audience_config?.recency_days ?? null,
    }

    const { data: followup, error: fErr } = await supabase
      .from("dem_followups")
      .insert({
        original_campaign_id: originalCampaignId,
        name: body.name || "Solleciti caldi",
        status: "draft",
        audience_config: audienceConfig,
        warm_priority: !!body.warm_priority,
        reallocate_unused: !!body.reallocate_unused,
      })
      .select()
      .single()
    if (fErr || !followup) {
      return NextResponse.json({ error: fErr?.message || "Errore creazione sequenza" }, { status: 500 })
    }

    // 3 step di default (step 1 immediato; step 2 e 3 con ritardo).
    const stepRows = []
    for (let n = 1; n <= MAX_STEPS; n++) {
      const content = defaultStepContent(n, ctaUrl)
      stepRows.push({
        followup_id: followup.id,
        step_number: n,
        enabled: true,
        subject: content.subject,
        preheader: content.preheader,
        html_template: content.html,
        cta_url: content.cta_url,
        delay_days: n === 1 ? 0 : DEFAULT_STEP_DELAY_DAYS,
        status: "pending",
      })
    }
    await supabase.from("dem_followup_steps").insert(stepRows)

    // Arruolo subito il pubblico caldo cosi' la card mostra numeri reali.
    const enrollResult = await enrollWarmRecipients(supabase, {
      id: followup.id,
      original_campaign_id: originalCampaignId,
      audience_config: audienceConfig,
    })

    return NextResponse.json({ followup, enrolled: enrollResult.enrolled, audience: enrollResult.audience })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}

// --- PATCH: aggiorna follow-up / step / quota / stato ---
export async function PATCH(request: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const supabase = createAdminClient()
    const result: Record<string, unknown> = {}

    // 1) Quota giornaliera sulla campagna originale (validazione cold+warm<=total).
    if (body.quota && body.original_campaign_id) {
      const total = body.quota.total === null || body.quota.total === undefined ? null : Number(body.quota.total)
      const cold = body.quota.cold === null || body.quota.cold === undefined ? null : Number(body.quota.cold)
      const warm = body.quota.warm === null || body.quota.warm === undefined ? null : Number(body.quota.warm)
      if (total !== null && cold !== null && warm !== null && cold + warm > total) {
        return NextResponse.json(
          { error: "La somma di freddi e caldi non puo' superare la quota totale" },
          { status: 400 }
        )
      }
      const { error } = await supabase
        .from("dem_campaigns")
        .update({
          daily_quota_total: total,
          daily_quota_cold: cold,
          daily_quota_warm: warm,
          warm_reallocate_unused: !!body.quota.reallocate,
          warm_priority: !!body.quota.priority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.original_campaign_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result.quota = "updated"
    }

    // 2) Aggiornamento di uno step.
    if (body.step && body.step.id) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

      // 2a) Rigenerazione della grafica di default: il template HTML viene
      // CONGELATO nel DB alla creazione, quindi le modifiche a lib/dem/warm.ts
      // non si propagano agli step esistenti. Questa azione ri-applica il
      // template di default (logo + tagline + footer) mantenendo il link CTA.
      if (body.step.regenerate) {
        const { data: cur } = await supabase
          .from("dem_followup_steps")
          .select("step_number, cta_url")
          .eq("id", body.step.id)
          .single()
        if (!cur) return NextResponse.json({ error: "Step non trovato" }, { status: 404 })
        const content = defaultStepContent(cur.step_number, cur.cta_url || DEFAULT_CALENDAR_URL)
        updates.subject = content.subject
        updates.preheader = content.preheader
        updates.html_template = content.html
        updates.cta_url = content.cta_url
      } else {
        for (const f of ["enabled", "subject", "preheader", "html_template", "cta_url", "delay_days"]) {
          if (body.step[f] !== undefined) updates[f] = body.step[f]
        }
      }

      const { error } = await supabase.from("dem_followup_steps").update(updates).eq("id", body.step.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result.step = body.step.regenerate ? "regenerated" : "updated"
    }

    // 3) Aggiornamento del follow-up (config pubblico, priorita', stato, schedule).
    if (body.followup_id) {
      const updates: Record<string, unknown> = {}
      if (body.audience_config) {
        updates.audience_config = {
          min_clicks: Math.max(1, Number(body.audience_config.min_clicks ?? 1)),
          recency_days: body.audience_config.recency_days ?? null,
        }
      }
      if (typeof body.warm_priority === "boolean") updates.warm_priority = body.warm_priority
      if (typeof body.reallocate_unused === "boolean") updates.reallocate_unused = body.reallocate_unused
      if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at

      // Azioni di stato.
      const action = body.action as string | undefined
      if (action === "activate" || action === "resume") {
        const health = await checkEmailProviderHealth()
        if (!health.healthy) {
          const reason = await pauseAllDemForProvider(supabase, health)
          await supabase
            .from("dem_followups")
            .update({ status: "paused", paused_reason: reason, updated_at: new Date().toISOString() })
            .eq("id", body.followup_id)
          return NextResponse.json(
            { error: reason, code: "provider_unavailable", statusCode: health.statusCode },
            { status: 503 },
          )
        }
      }
      if (action === "activate") updates.status = "active"
      else if (action === "pause") updates.status = "paused"
      else if (action === "resume") updates.status = "active"
      else if (action === "stop") updates.status = "stopped"

      // Tornando attivo si azzera il motivo dell'eventuale sospensione
      // automatica per rimbalzi: lasciarlo mostrerebbe un avviso di sospensione
      // su un richiamo in funzione, e un avviso che non corrisponde allo stato
      // reale insegna a ignorare gli avvisi.
      if (updates.status === "active") updates.paused_reason = null

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        const { error } = await supabase.from("dem_followups").update(updates).eq("id", body.followup_id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        result.followup = "updated"
      }

      // Re-arruolamento manuale del pubblico (dopo modifica criteri).
      if (action === "enroll" || body.audience_config) {
        const { data: fu } = await supabase
          .from("dem_followups")
          .select("id, original_campaign_id, audience_config")
          .eq("id", body.followup_id)
          .single()
        if (fu) {
          const er = await enrollWarmRecipients(supabase, fu)
          result.enrolled = er.enrolled
          result.audience = er.audience
        }
      }
    }

    if (Object.keys(result).length === 0) {
      return NextResponse.json({ error: "Nessuna modifica richiesta" }, { status: 400 })
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}

// --- DELETE: rimuove la sequenza e le campagne figlie collegate ---
export async function DELETE(request: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const followupId = searchParams.get("followup_id")
  if (!followupId) {
    return NextResponse.json({ error: "followup_id mancante" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Elimina le campagne figlie (e i loro destinatari/eventi) prima del follow-up.
  const { data: childCampaigns } = await supabase
    .from("dem_campaigns")
    .select("id")
    .eq("followup_id", followupId)
  for (const c of childCampaigns || []) {
    await supabase.from("dem_tracking_events").delete().eq("campaign_id", c.id)
    await supabase.from("dem_recipients").delete().eq("campaign_id", c.id)
    await supabase.from("dem_campaigns").delete().eq("id", c.id)
  }

  // CASCADE elimina steps + recipients del follow-up.
  const { error } = await supabase.from("dem_followups").delete().eq("id", followupId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
