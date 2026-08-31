import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { sendQuoteExpiryReminderEmail, sendQuoteFeedbackRequestEmail } from "@/lib/quotes/lifecycle-email"
import type { SalesChannelQuote } from "@/lib/quotes/types"

export const maxDuration = 120

const HOUR_MS = 3_600_000

interface LifecycleQuote extends SalesChannelQuote {
  expiry_reminder_sent_at?: string | null
  feedback_requested_at?: string | null
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"
    const now = Date.now()

    const { data, error } = await supabase
      .from("sales_channel_quotes")
      .select("*")
      .eq("status", "sent")
      .is("accepted_at", null)
      .not("client_email", "is", null)
      .not("token", "is", null)
      .not("expires_at", "is", null)
      .returns<LifecycleQuote[]>()

    if (error) {
      console.error("[quote-lifecycle] read error", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: Array<Record<string, unknown>> = []

    for (const quote of data || []) {
      const expiry = quote.expires_at ? new Date(quote.expires_at).getTime() : null
      if (!expiry || Number.isNaN(expiry)) {
        results.push({ quote: quote.id, skipped: "invalid_expiry" })
        continue
      }

      const link = `${baseUrl}/preventivo/${quote.token}`
      const hoursToExpiry = (expiry - now) / HOUR_MS

      if (hoursToExpiry > 0 && hoursToExpiry <= 24 && !quote.expiry_reminder_sent_at) {
        const sent = await sendQuoteExpiryReminderEmail(quote, link)
        if (!sent.success) {
          results.push({ quote: quote.id, action: "expiry_reminder", error: sent.error })
          continue
        }

        const sentAt = new Date().toISOString()
        await supabase
          .from("sales_channel_quotes")
          .update({ expiry_reminder_sent_at: sentAt, updated_at: sentAt })
          .eq("id", quote.id)

        results.push({ quote: quote.id, action: "expiry_reminder" })
        continue
      }

      if (hoursToExpiry <= 0 && !quote.feedback_requested_at) {
        const feedbackLink = `${baseUrl}/preventivo/${quote.token}/feedback`
        const sent = await sendQuoteFeedbackRequestEmail(quote, feedbackLink)
        if (!sent.success) {
          results.push({ quote: quote.id, action: "feedback_request", error: sent.error })
          continue
        }

        const sentAt = new Date().toISOString()
        await supabase
          .from("sales_channel_quotes")
          .update({ feedback_requested_at: sentAt, updated_at: sentAt })
          .eq("id", quote.id)

        results.push({ quote: quote.id, action: "feedback_request" })
        continue
      }

      results.push({ quote: quote.id, skipped: "nothing_due" })
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (error) {
    console.error("[quote-lifecycle] error", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore interno" }, { status: 500 })
  }
}
