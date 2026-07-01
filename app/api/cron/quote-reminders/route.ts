import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { sendQuoteReminderEmail } from "@/lib/quotes/email"
import type { SalesChannelQuote } from "@/lib/quotes/types"

export const maxDuration = 120

// Giorni di attesa prima del primo sollecito e cooldown tra un sollecito e l'altro.
const REMINDER_AFTER_DAYS = 3
// Numero massimo di solleciti automatici per preventivo.
const MAX_REMINDERS = 2

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

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (error) {
    console.error("[v0] quote-reminders error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore interno" }, { status: 500 })
  }
}
