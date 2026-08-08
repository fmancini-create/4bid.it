import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { notifyAdminQuotePaymentStatus, sendQuotePaymentReminderEmail, sendQuoteReminderEmail } from "@/lib/quotes/email"
import type { SalesChannelQuote } from "@/lib/quotes/types"

export const maxDuration = 120

// Giorni di attesa prima del primo sollecito e cooldown tra un sollecito e l'altro.
const REMINDER_AFTER_DAYS = 3
// Numero massimo di solleciti automatici per preventivo.
const MAX_REMINDERS = 2

// Solleciti di PAGAMENTO, in giorni dall'accettazione. L'ultimo avviso il
// giorno prima della scadenza e' gestito a parte, perche' dipende dalla
// scadenza dell'offerta e non dalla data di accettazione.
const PAYMENT_REMINDER_DAYS = [2, 7]

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

const DAY_MS = 86_400_000

/**
 * Cron giornaliero: invia un promemoria per i preventivi INVIATI ma non ancora
 * accettati dopo REMINDER_AFTER_DAYS giorni. Ripete al massimo MAX_REMINDERS volte,
 * con lo stesso intervallo tra un sollecito e l'altro. I preventivi accettati o
 * pagati (status 'accepted'/'paid') vengono naturalmente esclusi dal filtro status='sent'.
 */
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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"
    const now = Date.now()

    // Candidati: inviati, non accettati, con email, token presente, sotto il cap solleciti.
    const { data: quotes, error } = await supabase
      .from("sales_channel_quotes")
      .select("*")
      .eq("status", "sent")
      .is("accepted_at", null)
      .not("client_email", "is", null)
      .not("token", "is", null)
      .lt("reminder_count", MAX_REMINDERS)
      .returns<SalesChannelQuote[]>()

    if (error) {
      console.error("[v0] quote-reminders: errore lettura preventivi", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: Array<Record<string, unknown>> = []

    for (const quote of quotes || []) {
      // Riferimento temporale: ultimo sollecito se presente, altrimenti data di invio.
      const referenceIso = quote.last_reminder_at || quote.sent_at
      if (!referenceIso) {
        results.push({ quote: quote.id, skipped: "no_reference_date" })
        continue
      }
      const elapsedDays = (now - new Date(referenceIso).getTime()) / DAY_MS
      if (elapsedDays < REMINDER_AFTER_DAYS) {
        results.push({ quote: quote.id, skipped: "too_early", elapsedDays: Math.round(elapsedDays) })
        continue
      }

      const link = `${baseUrl}/preventivo/${quote.token}`
      const sendResult = await sendQuoteReminderEmail(quote, link)

      if (!sendResult.success) {
        results.push({ quote: quote.id, error: sendResult.error })
        continue
      }

      await supabase
        .from("sales_channel_quotes")
        .update({
          reminder_count: (quote.reminder_count || 0) + 1,
          last_reminder_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", quote.id)

      results.push({
        quote: quote.id,
        client: quote.client_company || quote.client_name,
        reminderSent: (quote.reminder_count || 0) + 1,
      })
    }

    // ---------------------------------------------------------------------
    // Secondo percorso: preventivi ACCETTATI ma NON PAGATI.
    // Il ciclo sopra guarda solo status='sent', quindi chi accettava e non
    // pagava non riceveva piu' nulla: nessun sollecito, nessuna scadenza.
    // ---------------------------------------------------------------------
    const paymentResults: Array<Record<string, unknown>> = []
    const { data: unpaid, error: unpaidError } = await supabase
      .from("sales_channel_quotes")
      .select("*")
      .eq("status", "accepted")
      .not("accepted_at", "is", null)
      .neq("payment_status", "paid")
      .is("expired_at", null)
      .not("token", "is", null)
      .returns<SalesChannelQuote[]>()

    if (unpaidError) {
      console.error("[v0] quote-reminders: errore lettura non pagati", unpaidError.message)
    }

    for (const quote of unpaid || []) {
      const link = `${baseUrl}/preventivo/${quote.token}`
      const acceptedAt = quote.accepted_at ? new Date(quote.accepted_at).getTime() : null
      if (!acceptedAt) {
        paymentResults.push({ quote: quote.id, skipped: "no_accepted_at" })
        continue
      }
      const expiresAt = quote.expires_at ? new Date(quote.expires_at).getTime() : null

      // 1) Scadenza superata: l'offerta decade e il pagamento viene bloccato.
      //    Il preventivo NON diventa "scaduto" come stato: resta 'accepted'
      //    perche' l'accettazione e' avvenuta davvero e la sua prova va
      //    conservata. E' `expired_at` a bloccare il pagamento, ed e'
      //    reversibile da un admin con una nuova scadenza.
      if (expiresAt && now >= expiresAt) {
        await supabase.from("sales_channel_quotes")
          .update({ expired_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", quote.id)
        try { await notifyAdminQuotePaymentStatus(quote, SUPER_ADMIN_EMAIL, "expired") } catch (e) { console.error("[v0] avviso decadenza:", e) }
        paymentResults.push({ quote: quote.id, client: quote.client_company || quote.client_name, action: "expired" })
        continue
      }

      if (!quote.client_email) {
        paymentResults.push({ quote: quote.id, skipped: "no_email" })
        continue
      }

      // 2) Ultimo avviso il giorno prima della scadenza, una volta sola.
      const hoursToExpiry = expiresAt ? (expiresAt - now) / 3_600_000 : null
      if (hoursToExpiry !== null && hoursToExpiry <= 24 && !quote.final_notice_sent_at) {
        const sent = await sendQuotePaymentReminderEmail(quote, link, { finalNotice: true })
        if (!sent.success) {
          paymentResults.push({ quote: quote.id, error: sent.error })
          continue
        }
        await supabase.from("sales_channel_quotes")
          .update({ final_notice_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", quote.id)
        try { await notifyAdminQuotePaymentStatus(quote, SUPER_ADMIN_EMAIL, "reminded") } catch (e) { console.error("[v0] avviso sollecito:", e) }
        paymentResults.push({ quote: quote.id, client: quote.client_company || quote.client_name, action: "final_notice" })
        continue
      }

      // 3) Solleciti a 2 e 7 giorni dall'accettazione.
      const elapsedDays = (now - acceptedAt) / DAY_MS
      const sentCount = quote.payment_reminder_count || 0
      const nextThreshold = PAYMENT_REMINDER_DAYS[sentCount]
      if (nextThreshold === undefined) {
        paymentResults.push({ quote: quote.id, skipped: "all_reminders_sent" })
        continue
      }
      if (elapsedDays < nextThreshold) {
        paymentResults.push({ quote: quote.id, skipped: "too_early", elapsedDays: Math.round(elapsedDays), nextThreshold })
        continue
      }
      // Le soglie contano dall'ACCETTAZIONE: su un preventivo gia' vecchio
      // (o accettato prima che questi solleciti esistessero) risulterebbero
      // scadute tutte insieme, e il cliente riceverebbe il secondo sollecito
      // il giorno dopo il primo. Serve una distanza minima fra un sollecito
      // e il successivo, misurata sull'ultimo effettivamente inviato.
      const daysSinceLastReminder = quote.last_payment_reminder_at
        ? (now - new Date(quote.last_payment_reminder_at).getTime()) / DAY_MS
        : null
      const minGap = PAYMENT_REMINDER_DAYS[sentCount] - PAYMENT_REMINDER_DAYS[sentCount - 1]
      if (daysSinceLastReminder !== null && minGap > 0 && daysSinceLastReminder < minGap) {
        paymentResults.push({ quote: quote.id, skipped: "reminder_cooldown", daysSinceLastReminder: Math.round(daysSinceLastReminder), minGap })
        continue
      }
      // Se l'ultimo avviso partirebbe comunque entro 24 ore, si evita di
      // mandare due email quasi identiche a distanza di poche ore.
      if (hoursToExpiry !== null && hoursToExpiry <= 24) {
        paymentResults.push({ quote: quote.id, skipped: "final_notice_window" })
        continue
      }

      const sent = await sendQuotePaymentReminderEmail(quote, link)
      if (!sent.success) {
        paymentResults.push({ quote: quote.id, error: sent.error })
        continue
      }
      await supabase.from("sales_channel_quotes")
        .update({
          payment_reminder_count: sentCount + 1,
          last_payment_reminder_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", quote.id)
      try { await notifyAdminQuotePaymentStatus(quote, SUPER_ADMIN_EMAIL, "reminded") } catch (e) { console.error("[v0] avviso sollecito:", e) }
      paymentResults.push({ quote: quote.id, client: quote.client_company || quote.client_name, action: "payment_reminder", number: sentCount + 1 })
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
      paymentProcessed: paymentResults.length,
      paymentResults,
    })
  } catch (error) {
    console.error("[v0] quote-reminders error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore interno" }, { status: 500 })
  }
}
