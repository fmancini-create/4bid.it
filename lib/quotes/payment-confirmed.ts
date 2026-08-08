import type { SupabaseClient } from "@supabase/supabase-js"
import { bookingOptionsForProjects } from "@/lib/booking-options"
import { notifyAdminQuotePaymentStatus, sendQuotePaidEmail } from "./email"
import { isQuoteLineSelected, type SalesChannelQuote } from "./types"

export const QUOTES_SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

/**
 * Avvisi da mandare quando un preventivo risulta PAGATO: conferma al cliente
 * con le call di avvio dei moduli acquistati, e avviso al superadmin.
 *
 * Vive in un punto solo perche' i pagamenti arrivano da due strade diverse:
 * il webhook Stripe (carta) e la conferma manuale del bonifico. Scriverlo
 * dentro il webhook avrebbe lasciato i clienti che pagano con bonifico senza
 * alcuna conferma, e senza modo di prenotare la configurazione.
 *
 * Idempotente: `payment_confirmation_sent_at` impedisce che un rinvio dello
 * stesso evento Stripe faccia arrivare al cliente due conferme identiche.
 */
export async function notifyQuotePaid(
  supabase: SupabaseClient,
  quote: SalesChannelQuote,
): Promise<{ clientNotified: boolean; reason?: string }> {
  if (quote.payment_confirmation_sent_at) {
    return { clientNotified: false, reason: "already_sent" }
  }

  const purchased = (quote.line_items || []).filter(isQuoteLineSelected)
  const bookings = bookingOptionsForProjects(purchased.map(item => item.project))

  let clientNotified = false
  if (quote.client_email) {
    try {
      const sent = await sendQuotePaidEmail(quote, bookings)
      clientNotified = sent.success
      if (!sent.success) console.error("[quotes] paid email non inviata:", sent.error)
    } catch (error) {
      console.error("[quotes] paid email error:", error)
    }
  }

  try {
    await notifyAdminQuotePaymentStatus(quote, QUOTES_SUPER_ADMIN_EMAIL, "paid")
  } catch (error) {
    console.error("[quotes] admin paid notify error:", error)
  }

  if (clientNotified) {
    await supabase
      .from("sales_channel_quotes")
      .update({ payment_confirmation_sent_at: new Date().toISOString() })
      .eq("id", quote.id)
  }
  return { clientNotified, reason: clientNotified ? undefined : "send_failed" }
}
