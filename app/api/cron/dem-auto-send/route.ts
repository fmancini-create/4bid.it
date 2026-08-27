import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { checkEmailProviderHealth, pauseAllDemForProvider } from "@/lib/dem/provider-health"

export const maxDuration = 300

/**
 * Cron orario (finestra 07:00-16:00 UTC = 9:00-18:00 ora italiana).
 *
 * Invia le campagne DEM con `auto_send = true` a scaglioni, con WARM-UP crescente
 * per proteggere la reputazione del dominio mittente:
 *
 *   Giorno 1: 50   Giorno 2: 100   Giorno 3: 150   Giorno 4: 250   Giorno 5+: 400
 *
 * Ramp-up PRUDENTE (poche centinaia/giorno) per RICOSTRUIRE reputazione dopo
 * l'incidente bounce: partire piano riduce spam/cestino. Ogni esecuzione invia al
 * massimo un lotto sicuro (<= 250, sotto il timeout della funzione) e si ferma
 * quando il tetto giornaliero e' raggiunto. Gli scaglioni si distribuiscono
 * naturalmente nell'arco della giornata (meglio per la deliverability di un unico
 * invio massivo). Riusa l'endpoint /api/dem/send gia' collaudato, che gestisce
 * throttle, tracking, allegati ed esclusione dei disiscritti. Per alzare i volumi
 * quando la reputazione e' solida, aumentare questi valori.
 */

// Tetto giornaliero per indice di giorno (0-based). Oltre l'ultimo valore -> regime.
const WARMUP_DAILY_CAPS = [50, 100, 150, 250, 400]
// Lotto massimo per singola invocazione (allineato a DEFAULT_BATCH_LIMIT del send).
const PER_RUN_BATCH = 250

// Guardrail reputazione: avviso -> rallentamento -> stop.
const BOUNCE_WARN_THRESHOLD = 0.015
const BOUNCE_SLOW_THRESHOLD = 0.02
const BOUNCE_STOP_THRESHOLD = 0.03
const BOUNCE_MIN_SAMPLE = 200

function capForDayIndex(dayIndex: number): number {
  if (dayIndex < 0) dayIndex = 0
  return WARMUP_DAILY_CAPS[Math.min(dayIndex, WARMUP_DAILY_CAPS.length - 1)]
}

function utcStartOfToday(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function ymdUtc(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysBetweenUtc(fromYmd: string, toDate: Date): number {
  const from = new Date(`${fromYmd}T00:00:00.000Z`).getTime()
  const to = Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
  return Math.max(0, Math.round((to - from) / 86_400_000))
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

    const providerHealth = await checkEmailProviderHealth()
    if (!providerHealth.healthy) {
      const reason = await pauseAllDemForProvider(supabase, providerHealth)
      console.error(`[v0] dem-auto-send: ${reason}`)
      return NextResponse.json(
        { ok: false, error: reason, code: "provider_unavailable", statusCode: providerHealth.statusCode },
        { status: 503 },
      )
    }

    const { data: campaigns, error: campErr } = await supabase
      .from("dem_campaigns")
      .select("id, name, status, auto_send, auto_started_on, daily_quota_cold, updated_at")
      .eq("auto_send", true)
      .in("status", ["draft", "sending"])
      .or("campaign_kind.is.null,campaign_kind.eq.cold")
      .order("updated_at", { ascending: true })

    if (campErr) {
      console.error("[v0] dem-auto-send: errore lettura campagne", campErr.message)
      return NextResponse.json({ error: campErr.message }, { status: 500 })
    }

    const todayStart = utcStartOfToday()
    const results: Array<Record<string, unknown>> = []
    const STALE_SENDING_MS = 15 * 60 * 1000

    for (const campaign of campaigns || []) {
      if (campaign.status === "sending") {
        const updatedAt = campaign.updated_at ? new Date(campaign.updated_at as string).getTime() : 0
        const isStale = Date.now() - updatedAt > STALE_SENDING_MS
        if (!isStale) {
          results.push({ campaign: campaign.id, skipped: "sending_in_progress" })
          continue
        }
        await supabase
          .from("dem_campaigns")
          .update({ status: "draft", updated_at: new Date().toISOString() })
          .eq("id", campaign.id)
        console.log(`[v0] dem-auto-send: recuperata campagna bloccata in sending: ${campaign.id}`)
      }

      const { count: pendingTotal } = await supabase
        .from("dem_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("send_status", "pending")

      if (!pendingTotal || pendingTotal === 0) {
        await supabase.from("dem_campaigns").update({ auto_send: false }).eq("id", campaign.id)
        results.push({ campaign: campaign.id, skipped: "no_pending" })
        continue
      }

      // Freno reputazionale sui rimbalzi degli ultimi 3 giorni.
      // >=1,5%: warning; >=2%: dimezza il volume; >=3%: stop automatico.
      let bounceThrottle = 1
      {
        const treGiorniFa = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        const conta = async (filtro: (q: any) => any) => {
          const { count, error } = await filtro(
            supabase
              .from("dem_recipients")
              .select("id", { count: "exact", head: true })
              .eq("campaign_id", campaign.id)
              .gte("sent_at", treGiorniFa),
          )
          return error ? null : (count ?? 0)
        }
        const inviate = await conta((q: any) => q.in("send_status", ["sent", "bounced", "opened"]))
        const rimbalzate = await conta((q: any) => q.eq("send_status", "bounced"))

        if (inviate === null || rimbalzate === null) {
          console.error(`[v0] dem-auto-send: tasso rimbalzi non misurabile per ${campaign.id}, salto per prudenza`)
          results.push({ campaign: campaign.id, skipped: "bounce_rate_unreadable" })
          continue
        }

        if (inviate >= BOUNCE_MIN_SAMPLE) {
          const tasso = rimbalzate / inviate
          if (tasso >= BOUNCE_STOP_THRESHOLD) {
            const motivo = `Sospesa automaticamente: ${(tasso * 100).toFixed(1)}% di rimbalzi negli ultimi 3 giorni (${rimbalzate} su ${inviate}), soglia stop ${BOUNCE_STOP_THRESHOLD * 100}%. Ripulire la lista prima di riprendere.`
            await supabase
              .from("dem_campaigns")
              .update({ auto_send: false, auto_paused_reason: motivo, updated_at: new Date().toISOString() })
              .eq("id", campaign.id)
            console.error(`[v0] dem-auto-send: SOSPESA ${campaign.id} - ${motivo}`)
            results.push({ campaign: campaign.id, paused: "bounce_rate_too_high", rate: tasso, sent: inviate })
            continue
          }

          if (tasso >= BOUNCE_SLOW_THRESHOLD) {
            bounceThrottle = 0.5
            console.warn(
              `[v0] dem-auto-send: rallentamento ${campaign.id} - ${(tasso * 100).toFixed(1)}% bounce, volume dimezzato`,
            )
            results.push({ campaign: campaign.id, warning: "bounce_rate_slowdown", rate: tasso, sent: inviate })
          } else if (tasso >= BOUNCE_WARN_THRESHOLD) {
            console.warn(
              `[v0] dem-auto-send: warning ${campaign.id} - ${(tasso * 100).toFixed(1)}% bounce`,
            )
            results.push({ campaign: campaign.id, warning: "bounce_rate_warning", rate: tasso, sent: inviate })
          }
        }
      }

      let startedOn = campaign.auto_started_on as string | null
      if (!startedOn) {
        startedOn = ymdUtc(todayStart)
        await supabase
          .from("dem_campaigns")
          .update({ auto_started_on: startedOn })
          .eq("id", campaign.id)
      }

      const dayIndex = daysBetweenUtc(startedOn, todayStart)
      const warmupCap = capForDayIndex(dayIndex)
      const coldLimit = (campaign as { daily_quota_cold?: number | null }).daily_quota_cold
      const baseDailyCap =
        typeof coldLimit === "number" && coldLimit >= 0 ? Math.min(warmupCap, coldLimit) : warmupCap
      const dailyCap = Math.max(1, Math.floor(baseDailyCap * bounceThrottle))

      const { count: sentToday } = await supabase
        .from("dem_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("send_status", "sent")
        .gte("sent_at", todayStart.toISOString())

      const remainingToday = Math.max(0, dailyCap - (sentToday || 0))
      const toSend = Math.min(remainingToday, PER_RUN_BATCH, pendingTotal)

      if (toSend <= 0) {
        results.push({
          campaign: campaign.id,
          dayIndex: dayIndex + 1,
          dailyCap,
          sentToday: sentToday || 0,
          skipped: "daily_cap_reached",
        })
        continue
      }

      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret) {
        return NextResponse.json(
          { ok: false, error: "CRON_SECRET non configurato", code: "cron_secret_missing" },
          { status: 500 },
        )
      }
      const res = await fetch(`${baseUrl}/api/dem/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ campaign_id: campaign.id, batch_size: toSend }),
      })
      const payload = await res.json().catch(() => ({}))

      results.push({
        campaign: campaign.id,
        name: campaign.name,
        dayIndex: dayIndex + 1,
        dailyCap,
        sentToday: sentToday || 0,
        requested: toSend,
        httpStatus: res.status,
        sendResult: payload,
      })

      if (!res.ok) {
        console.error(`[v0] dem-auto-send: /api/dem/send HTTP ${res.status}`, payload)
        return NextResponse.json(
          { ok: false, error: "Invio DEM fallito", results },
          { status: res.status >= 500 ? res.status : 502 },
        )
      }

      break
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (error) {
    console.error("[v0] dem-auto-send error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}
