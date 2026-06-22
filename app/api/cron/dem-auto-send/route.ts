import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 300

/**
 * Cron orario (finestra 07:00-16:00 UTC = 9:00-18:00 ora italiana).
 *
 * Invia le campagne DEM con `auto_send = true` a scaglioni, con WARM-UP crescente
 * per proteggere la reputazione del dominio mittente:
 *
 *   Giorno 1: 200   Giorno 2: 400   Giorno 3: 800   Giorno 4: 1500   Giorno 5+: 2500
 *
 * Ogni esecuzione invia al massimo un lotto sicuro (<= 250, sotto il timeout della
 * funzione) e si ferma quando il tetto giornaliero e' raggiunto. Gli scaglioni si
 * distribuiscono naturalmente nell'arco della giornata (meglio per la deliverability
 * di un unico invio massivo). Riusa l'endpoint /api/dem/send gia' collaudato, che
 * gestisce throttle, tracking, allegati ed esclusione dei disiscritti.
 */

// Tetto giornaliero per indice di giorno (0-based). Oltre l'ultimo valore -> regime.
const WARMUP_DAILY_CAPS = [200, 400, 800, 1500, 2500]
// Lotto massimo per singola invocazione (allineato a DEFAULT_BATCH_LIMIT del send).
const PER_RUN_BATCH = 250

function capForDayIndex(dayIndex: number): number {
  if (dayIndex < 0) dayIndex = 0
  return WARMUP_DAILY_CAPS[Math.min(dayIndex, WARMUP_DAILY_CAPS.length - 1)]
}

// Mezzanotte UTC di oggi. Gli invii avvengono in pieno giorno (07-16 UTC), quindi
// usare il confine UTC per "oggi" e' sicuro e privo di ambiguita'.
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

    // Campagne in coda con invio automatico attivo. Lo stato 'draft' e' quello in cui
    // il send lascia la campagna finche' restano destinatari pendenti.
    //
    // Includiamo anche lo stato 'sending': se un lotto va in timeout (maxDuration)
    // la campagna resta "appesa" in 'sending' e il cron non la riprenderebbe mai
    // piu'. Recuperiamo quelle stantie (updated_at piu' vecchio di STALE_SENDING_MS).
    const { data: campaigns, error: campErr } = await supabase
      .from("dem_campaigns")
      .select("id, name, status, auto_send, auto_started_on, daily_quota_cold, updated_at")
      .eq("auto_send", true)
      .in("status", ["draft", "sending"])

    if (campErr) {
      console.error("[v0] dem-auto-send: errore lettura campagne", campErr.message)
      return NextResponse.json({ error: campErr.message }, { status: 500 })
    }

    const todayStart = utcStartOfToday()
    const results: Array<Record<string, unknown>> = []
    // Un lotto reale dura al massimo ~300s: oltre i 15 minuti senza aggiornamenti
    // la campagna 'sending' e' sicuramente bloccata (timeout) e va recuperata.
    const STALE_SENDING_MS = 15 * 60 * 1000

    for (const campaign of campaigns || []) {
      // Recupero campagne bloccate in 'sending' a causa di un timeout precedente.
      if (campaign.status === "sending") {
        const updatedAt = campaign.updated_at ? new Date(campaign.updated_at as string).getTime() : 0
        const isStale = Date.now() - updatedAt > STALE_SENDING_MS
        if (!isStale) {
          // Un lotto e' probabilmente in corso: non interferire.
          results.push({ campaign: campaign.id, skipped: "sending_in_progress" })
          continue
        }
        // Sblocca: riporta a 'draft' cosi' il flusso normale puo' riprendere.
        await supabase
          .from("dem_campaigns")
          .update({ status: "draft", updated_at: new Date().toISOString() })
          .eq("id", campaign.id)
        console.log(`[v0] dem-auto-send: recuperata campagna bloccata in sending: ${campaign.id}`)
      }
      // Quanti destinatari restano in coda?
      const { count: pendingTotal } = await supabase
        .from("dem_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("send_status", "pending")

      if (!pendingTotal || pendingTotal === 0) {
        // Coda vuota: chiudi l'automazione.
        await supabase.from("dem_campaigns").update({ auto_send: false }).eq("id", campaign.id)
        results.push({ campaign: campaign.id, skipped: "no_pending" })
        continue
      }

      // Primo invio in assoluto: registra la data di avvio warm-up (giorno 1).
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

      // Gating quota freddi: se la campagna ha un limite freddi configurato, il
      // tetto giornaliero e' il MINIMO tra warm-up e limite freddi. Senza quota
      // (colonna NULL) il comportamento resta identico a prima.
      const coldLimit = (campaign as { daily_quota_cold?: number | null }).daily_quota_cold
      const dailyCap =
        typeof coldLimit === "number" && coldLimit >= 0 ? Math.min(warmupCap, coldLimit) : warmupCap

      // Quante email gia' inviate OGGI (per rispettare il tetto giornaliero)?
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

      // Esegui il lotto tramite l'endpoint di invio collaudato.
      const res = await fetch(`${baseUrl}/api/dem/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        sendResult: payload,
      })

      // Un solo lotto reale per esecuzione, per restare entro il timeout della funzione.
      // I lotti successivi partono alle esecuzioni orarie seguenti della stessa finestra.
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
