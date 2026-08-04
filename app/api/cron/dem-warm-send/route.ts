import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { MAX_STEPS, dispatchWarmStep, type FollowupStepRow } from "@/lib/dem/warm"

export const maxDuration = 300

/**
 * Cron dei "Solleciti caldi". Per ogni sequenza ATTIVA invia lo step corrente
 * (1 -> 2 -> 3, in ordine) ai contatti eleggibili, rispettando la quota giornaliera
 * CALDI configurata sulla campagna originale. Un solo lotto reale per esecuzione
 * (come il cron freddo) per restare entro il timeout della funzione.
 */

// Quota caldi di default quando la campagna non ne ha una esplicita.
const DEFAULT_WARM_DAILY = 500
const PER_RUN_BATCH = 250

function utcStartOfToday(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") ||
      request.headers.get("user-agent")?.includes("vercel-cron")
    const isManuallyAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isDev = process.env.NODE_ENV === "development"
    if (!isDev && !isVercelCron && !isManuallyAuthorized) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, serviceKey)

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://www.4bid.it")

    const todayStart = utcStartOfToday()
    const nowIso = new Date().toISOString()

    // Sequenze attive (e gia' avviabili: scheduled_at nullo o passato).
    const { data: followups, error: fErr } = await supabase
      .from("dem_followups")
      .select("id, original_campaign_id, status, scheduled_at, warm_priority")
      .eq("status", "active")
    if (fErr) {
      return NextResponse.json({ error: fErr.message }, { status: 500 })
    }

    const results: Array<Record<string, unknown>> = []

    for (const followup of followups || []) {
      if (followup.scheduled_at && followup.scheduled_at > nowIso) {
        results.push({ followup: followup.id, skipped: "scheduled_future" })
        continue
      }

      // Campagna originale: nome + quota caldi.
      const { data: campaign } = await supabase
        .from("dem_campaigns")
        .select("id, name, daily_quota_warm, daily_quota_total, daily_quota_cold, warm_reallocate_unused")
        .eq("id", followup.original_campaign_id)
        .single()
      if (!campaign) {
        results.push({ followup: followup.id, skipped: "no_campaign" })
        continue
      }

      // Campagne figlie (per contare i caldi gia' inviati OGGI).
      const { data: childCampaigns } = await supabase
        .from("dem_campaigns")
        .select("id")
        .eq("followup_id", followup.id)
      const childIds = (childCampaigns || []).map((c) => c.id)

      let warmSentToday = 0
      if (childIds.length > 0) {
        const { count } = await supabase
          .from("dem_recipients")
          .select("id", { count: "exact", head: true })
          .in("campaign_id", childIds)
          .eq("send_status", "sent")
          .gte("sent_at", todayStart.toISOString())
        warmSentToday = count || 0
      }

      // Quota caldi: esplicita, oppure (con riallocazione) il residuo del totale, oppure default.
      let warmCap = campaign.daily_quota_warm ?? null
      if (warmCap === null && campaign.warm_reallocate_unused && campaign.daily_quota_total != null) {
        warmCap = campaign.daily_quota_total - (campaign.daily_quota_cold ?? 0)
      }
      if (warmCap === null) warmCap = DEFAULT_WARM_DAILY

      const remainingWarm = Math.max(0, warmCap - warmSentToday)
      const toSend = Math.min(remainingWarm, PER_RUN_BATCH)
      if (toSend <= 0) {
        results.push({ followup: followup.id, warmCap, warmSentToday, skipped: "warm_cap_reached" })
        continue
      }

      // Step abilitati in ordine; invio il primo che ha contatti eleggibili.
      const { data: steps } = await supabase
        .from("dem_followup_steps")
        .select("*")
        .eq("followup_id", followup.id)
        .eq("enabled", true)
        .order("step_number", { ascending: true })

      let dispatched = false
      let pausedForBounces = false
      for (const step of (steps || []) as FollowupStepRow[]) {
        if (step.step_number > MAX_STEPS) continue
        const dispatch = await dispatchWarmStep(supabase, {
          followup: { id: followup.id, original_campaign_id: followup.original_campaign_id },
          originalCampaignName: campaign.name,
          step,
          baseUrl,
          maxToSend: toSend,
        })

        // Sospensione per rimbalzi: va riportata ESPLICITAMENTE.
        // Il freno restituisce `requested: 0` come chi non ha contatti da
        // inviare, quindi senza questo blocco il cron avrebbe archiviato una
        // sospensione sotto l'etichetta "no_eligible_now": un difetto grave
        // taciuto da un messaggio di routine. Si esce subito dal ciclo, perche'
        // il motivo non riguarda il singolo passo ma l'intero richiamo.
        const esito = dispatch.sendResult as { paused?: string; skipped?: string; reason?: string } | undefined
        if (esito?.paused === "bounce_rate_too_high" || esito?.skipped === "bounce_rate_unreadable") {
          results.push({
            followup: followup.id,
            step: step.step_number,
            paused: esito.paused ?? null,
            skipped: esito.skipped ?? null,
            reason: esito.reason,
          })
          pausedForBounces = true
          break
        }

        if (dispatch.requested > 0) {
          results.push({
            followup: followup.id,
            step: step.step_number,
            warmCap,
            warmSentToday,
            requested: dispatch.requested,
            sent: dispatch.sent,
            sendResult: dispatch.sendResult,
          })
          dispatched = true
          break
        }
      }

      // Sospeso per rimbalzi: NON si prosegue oltre.
      // Il blocco che segue puo' scrivere `completed`, che sovrascriverebbe il
      // `paused` appena impostato: la sospensione verrebbe cancellata dal cron
      // stesso, un passo dopo averla decisa.
      if (pausedForBounces) continue

      if (!dispatched) {
        // Nessuno step ha contatti da inviare ora.
        // Se TUTTI hanno completato i 3 step (o stati terminali), chiudo la sequenza.
        const { count: pendingFollowups } = await supabase
          .from("dem_followup_recipients")
          .select("id", { count: "exact", head: true })
          .eq("followup_id", followup.id)
          .eq("excluded", false)
          .eq("responded", false)
          .lt("followups_sent", MAX_STEPS)
        if (!pendingFollowups || pendingFollowups === 0) {
          await supabase
            .from("dem_followups")
            .update({ status: "completed", updated_at: nowIso })
            .eq("id", followup.id)
          results.push({ followup: followup.id, status: "completed" })
        } else {
          results.push({ followup: followup.id, skipped: "no_eligible_now", pending: pendingFollowups })
        }
        continue
      }

      // Un solo lotto reale per esecuzione (timeout safety).
      break
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (error) {
    console.error("[v0] dem-warm-send error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}
