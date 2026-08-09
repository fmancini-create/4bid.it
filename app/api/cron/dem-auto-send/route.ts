import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

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

      // FRENO SUI RIMBALZI.
      //
      // Perche' esiste: il 29/06 sono partite 3.291 email con il 31,2% di
      // rimbalzi e NIENTE le ha fermate, perche' non c'era alcun controllo. Nei
      // 12 giorni precedenti la stessa lista viaggiava allo 0,2%: il problema
      // non e' stato accorgersi tardi, e' che nessuno stava guardando.
      //
      // I fornitori di posta considerano accettabile un tasso sotto il 2%: oltre
      // il 5% la reputazione del mittente si deteriora e le email finiscono in
      // spam ANCHE per i destinatari validi. Per questo la guardia sta PRIMA di
      // ogni invio: sospende l'automazione invece di continuare a bruciare
      // reputazione.
      //
      // Misuro sugli ultimi 3 giorni, non sullo storico: un tasso storico basso
      // diluisce un peggioramento in corso e direbbe "tutto bene" mentre il
      // danno avviene. Servono almeno 200 email misurate, altrimenti 2 rimbalzi
      // su 10 invii (20%) fermerebbero una campagna sana.
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

        // Se la misura non e' leggibile NON invio: proseguire al buio e' proprio
        // cio' che ha permesso l'incidente. Un guasto deve fermare, non passare.
        if (inviate === null || rimbalzate === null) {
          console.error(`[v0] dem-auto-send: tasso rimbalzi non misurabile per ${campaign.id}, salto per prudenza`)
          results.push({ campaign: campaign.id, skipped: "bounce_rate_unreadable" })
          continue
        }

        const SOGLIA = 0.05
        const MINIMO_MISURABILE = 200
        if (inviate >= MINIMO_MISURABILE) {
          const tasso = rimbalzate / inviate
          if (tasso > SOGLIA) {
            const motivo = `Sospesa automaticamente: ${(tasso * 100).toFixed(1)}% di rimbalzi negli ultimi 3 giorni (${rimbalzate} su ${inviate}), oltre la soglia del ${SOGLIA * 100}%. Ripulire la lista prima di riprendere.`
            await supabase
              .from("dem_campaigns")
              .update({ auto_send: false, auto_paused_reason: motivo, updated_at: new Date().toISOString() })
              .eq("id", campaign.id)
            console.error(`[v0] dem-auto-send: SOSPESA ${campaign.id} - ${motivo}`)
            results.push({ campaign: campaign.id, paused: "bounce_rate_too_high", rate: tasso, sent: inviate })
            continue
          }
        }
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
      //
      // /api/dem/send e' protetto da `rifiutaSeNonAutorizzato`, che accetta le
      // chiamate automatiche SOLO con `Authorization: Bearer ${CRON_SECRET}`.
      // Senza questo header la guardia (aggiunta il 03/08) rispondeva
      // "Non autorizzato" e il cron, pur girando, non spediva nulla: i due
      // presidi si annullavano a vicenda. Inoltriamo quindi il segreto.
      const cronSecret = process.env.CRON_SECRET
      const res = await fetch(`${baseUrl}/api/dem/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
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
