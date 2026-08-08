import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notifyQuotePaid, QUOTES_SUPER_ADMIN_EMAIL } from "@/lib/quotes/payment-confirmed"
import type { SalesChannelQuote } from "@/lib/quotes/types"

/**
 * Azioni amministrative sul pagamento di un preventivo gia' accettato.
 *
 * Questa rotta muove denaro e riapre offerte scadute, quindi verifica la
 * sessione qui dentro: il proxy usa l'elenco delle rotte admin solo per
 * saltare il limite di richieste, NON per autenticare.
 */
async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== QUOTES_SUPER_ADMIN_EMAIL) return null
  return user
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const action = body?.action
  const supabase = createAdminClient()

  const { data: quote, error } = await supabase
    .from("sales_channel_quotes").select("*").eq("id", id).maybeSingle<SalesChannelQuote>()
  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })

  const nowIso = new Date().toISOString()

  // Conferma manuale di un bonifico ricevuto. Senza questa azione il pagamento
  // con bonifico non veniva MAI registrato: solo Stripe marcava "pagato",
  // quindi quei clienti restavano in attesa e continuavano a ricevere solleciti.
  if (action === "confirm_transfer") {
    if (quote.payment_status === "paid") return NextResponse.json({ error: "Risulta già pagato" }, { status: 409 })
    if (!quote.accepted_at) return NextResponse.json({ error: "Il preventivo non è stato accettato" }, { status: 409 })

    const { data: updated, error: updateError } = await supabase
      .from("sales_channel_quotes")
      .update({ payment_status: "paid", status: "paid", paid_at: nowIso, expired_at: null, updated_at: nowIso })
      .eq("id", id).neq("payment_status", "paid").select("*").single<SalesChannelQuote>()
    if (updateError || !updated) return NextResponse.json({ error: updateError?.message || "Aggiornamento non riuscito" }, { status: 409 })

    const notified = await notifyQuotePaid(supabase, updated)
    return NextResponse.json({ success: true, paid_at: updated.paid_at, client_notified: notified.clientNotified })
  }

  // Riapertura di un'offerta decaduta con una nuova scadenza.
  // La modifica di `expires_at` dopo l'accettazione e' normalmente vietata
  // (l'accordo e' congelato): qui e' una decisione esplicita dell'admin, per
  // questo passa da un'azione dedicata e viene registrata in `reopened_at`.
  if (action === "reopen") {
    if (quote.payment_status === "paid") return NextResponse.json({ error: "Risulta già pagato" }, { status: 409 })
    const raw = String(body?.expires_at || "")
    const newExpiry = new Date(raw)
    if (!raw || Number.isNaN(newExpiry.getTime())) return NextResponse.json({ error: "Nuova scadenza non valida" }, { status: 400 })
    if (newExpiry.getTime() <= Date.now()) return NextResponse.json({ error: "La nuova scadenza deve essere futura" }, { status: 400 })

    const { data: updated, error: updateError } = await supabase
      .from("sales_channel_quotes")
      .update({
        expires_at: newExpiry.toISOString(),
        expired_at: null,
        reopened_at: nowIso,
        // Il conteggio riparte: la nuova finestra merita i propri solleciti.
        payment_reminder_count: 0,
        last_payment_reminder_at: null,
        final_notice_sent_at: null,
        updated_at: nowIso,
      })
      .eq("id", id).select("*").single<SalesChannelQuote>()
    if (updateError || !updated) return NextResponse.json({ error: updateError?.message || "Riapertura non riuscita" }, { status: 500 })
    return NextResponse.json({ success: true, expires_at: updated.expires_at })
  }

  return NextResponse.json({ error: "Azione non riconosciuta" }, { status: 400 })
}
