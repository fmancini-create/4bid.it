import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, CheckCircle2, Mail, XCircle } from "lucide-react"
import AdminNavigation from "@/components/admin-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

type QuoteRow = {
  id: string
  quote_number: string | null
  title: string | null
  client_name: string | null
  client_company: string | null
  client_email: string | null
  sent_at: string | null
  reminder_count: number | null
  last_reminder_at: string | null
  acceptance_email_sent_at: string | null
  payment_confirmation_sent_at: string | null
  payment_reminder_count: number | null
  last_payment_reminder_at: string | null
  final_notice_sent_at: string | null
  expiry_reminder_sent_at: string | null
  feedback_requested_at: string | null
  feedback_email_opened_at: string | null
  feedback_email_open_count: number | null
  feedback_link_clicked_at: string | null
  feedback_link_click_count: number | null
  feedback_received_at: string | null
  reactivation_notified_at: string | null
}

type ShareRow = {
  id: string
  quote_id: string
  recipient_email: string | null
  sent_at: string | null
  send_count: number | null
  email_open_count: number | null
  last_email_opened_at: string | null
  view_count: number | null
  last_viewed_at: string | null
  last_error: string | null
}

type EventRow = {
  key: string
  quoteId: string
  quoteLabel: string
  clientLabel: string
  recipient: string
  subject: string
  sentAt: string | null
  status: "sent" | "failed"
  detail?: string
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("it-IT")
}

export default async function QuoteEmailHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-8"><div className="text-center"><h1 className="text-3xl font-bold mb-4 text-destructive">Accesso Negato</h1><p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p></div></div>
  }

  const admin = createAdminClient()
  const [{ data: quotes, error: quotesError }, { data: shares, error: sharesError }] = await Promise.all([
    admin.from("sales_channel_quotes").select("id, quote_number, title, client_name, client_company, client_email, sent_at, reminder_count, last_reminder_at, acceptance_email_sent_at, payment_confirmation_sent_at, payment_reminder_count, last_payment_reminder_at, final_notice_sent_at, expiry_reminder_sent_at, feedback_requested_at, feedback_email_opened_at, feedback_email_open_count, feedback_link_clicked_at, feedback_link_click_count, feedback_received_at, reactivation_notified_at").order("created_at", { ascending: false }),
    admin.from("sales_channel_quote_shares").select("id, quote_id, recipient_email, sent_at, send_count, email_open_count, last_email_opened_at, view_count, last_viewed_at, last_error").order("updated_at", { ascending: false }),
  ])

  if (quotesError) console.error("[quote-email-history] quote error:", quotesError)
  if (sharesError) console.error("[quote-email-history] shares error:", sharesError)

  const quoteRows = (quotes || []) as QuoteRow[]
  const quoteById = new Map(quoteRows.map((quote) => [quote.id, quote]))
  const events: EventRow[] = []

  const pushSuccess = (quote: QuoteRow, key: string, subject: string, sentAt: string | null, recipient = quote.client_email || "—", detail?: string) => {
    if (!sentAt) return
    events.push({
      key: `${quote.id}-${key}-${sentAt}`,
      quoteId: quote.id,
      quoteLabel: quote.quote_number || quote.title || "Preventivo",
      clientLabel: quote.client_company || quote.client_name || "Cliente",
      recipient,
      subject,
      sentAt,
      status: "sent",
      detail,
    })
  }

  for (const quote of quoteRows) {
    pushSuccess(quote, "initial", `Preventivo 4BID: ${quote.title || ""}`.trim(), quote.sent_at)
    pushSuccess(quote, "reminder", `Promemoria - Preventivo 4BID: ${quote.title || ""}`.trim(), quote.last_reminder_at, undefined, quote.reminder_count && quote.reminder_count > 1 ? `${quote.reminder_count} promemoria complessivi` : undefined)
    pushSuccess(quote, "accepted", `Accettazione ricevuta - ${quote.quote_number || quote.title || "Preventivo"}`, quote.acceptance_email_sent_at)
    pushSuccess(quote, "paid", `Pagamento confermato - ${quote.title || "Preventivo"}`, quote.payment_confirmation_sent_at)
    pushSuccess(quote, "payment-reminder", `Pagamento in attesa - ${quote.quote_number || quote.title || "Preventivo"}`, quote.last_payment_reminder_at, undefined, quote.payment_reminder_count && quote.payment_reminder_count > 1 ? `${quote.payment_reminder_count} solleciti complessivi` : undefined)
    pushSuccess(quote, "final", `Ultimo avviso: l'offerta scade domani - ${quote.title || "Preventivo"}`, quote.final_notice_sent_at)
    pushSuccess(quote, "expiry", `Il tuo preventivo 4BID scade domani - ${quote.title || "Preventivo"}`, quote.expiry_reminder_sent_at)

    const feedbackActivity: string[] = []
    if (quote.feedback_email_opened_at) feedbackActivity.push(`Aperta ${formatDate(quote.feedback_email_opened_at)}${Number(quote.feedback_email_open_count || 0) > 1 ? ` (${quote.feedback_email_open_count} aperture)` : ""}`)
    if (quote.feedback_link_clicked_at) feedbackActivity.push(`Link aperto ${formatDate(quote.feedback_link_clicked_at)}${Number(quote.feedback_link_click_count || 0) > 1 ? ` (${quote.feedback_link_click_count} visite)` : ""}`)
    if (quote.feedback_received_at) feedbackActivity.push(`Feedback compilato ${formatDate(quote.feedback_received_at)}`)
    if (quote.feedback_requested_at && feedbackActivity.length === 0) feedbackActivity.push("Non risulta ancora aperta")
    pushSuccess(quote, "feedback", "Un breve feedback sul preventivo 4BID", quote.feedback_requested_at, undefined, feedbackActivity.join(" · "))

    pushSuccess(quote, "reactivation", `Riattivazione preventivo richiesta: ${quote.client_company || quote.client_name || "Cliente"}`, quote.reactivation_notified_at, SUPER_ADMIN_EMAIL)
  }

  for (const share of (shares || []) as ShareRow[]) {
    const quote = quoteById.get(share.quote_id)
    if (!quote) continue
    const detailParts: string[] = []
    if (share.send_count && share.send_count > 1) detailParts.push(`${share.send_count} invii`)
    if (share.email_open_count) detailParts.push(`${share.email_open_count} aperture email`)
    if (share.view_count) detailParts.push(`${share.view_count} visualizzazioni preventivo`)
    if (share.last_error) {
      events.push({
        key: `${share.id}-error`,
        quoteId: quote.id,
        quoteLabel: quote.quote_number || quote.title || "Preventivo",
        clientLabel: quote.client_company || quote.client_name || "Cliente",
        recipient: share.recipient_email || "—",
        subject: `Inoltro preventivo: ${quote.title || "Preventivo"}`,
        sentAt: share.sent_at,
        status: "failed",
        detail: share.last_error,
      })
    } else if (share.sent_at) {
      events.push({
        key: `${share.id}-sent`,
        quoteId: quote.id,
        quoteLabel: quote.quote_number || quote.title || "Preventivo",
        clientLabel: quote.client_company || quote.client_name || "Cliente",
        recipient: share.recipient_email || "—",
        subject: `Inoltro preventivo: ${quote.title || "Preventivo"}`,
        sentAt: share.sent_at,
        status: "sent",
        detail: detailParts.length ? detailParts.join(" · ") : undefined,
      })
    }
  }

  events.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime())

  return <div className="min-h-screen bg-background">
    <AdminNavigation userEmail={user.email || ""} />
    <main className="lg:ml-64 px-4 sm:px-6 py-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Storico comunicazioni preventivi</h1></div>
            <p className="text-sm text-muted-foreground mt-1">Invii, errori e attività disponibili sulle email dei preventivi.</p>
          </div>
          <Button asChild variant="outline"><Link href="/admin/quotes"><ArrowLeft className="h-4 w-4 mr-2" />Preventivi</Link></Button>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          {events.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Non risultano ancora comunicazioni registrate.</p> : <div className="divide-y">
            {events.map((event) => <div key={event.key} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={event.status === "sent" ? "secondary" : "destructive"} className="gap-1">
                      {event.status === "sent" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {event.status === "sent" ? "Inviata" : "Errore"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(event.sentAt)}</span>
                  </div>
                  <p className="font-medium break-words">{event.subject}</p>
                  <p className="text-sm text-muted-foreground mt-1">A: {event.recipient}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.clientLabel} · {event.quoteLabel}</p>
                  {event.detail && <p className={`text-sm mt-2 ${event.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{event.detail}</p>}
                </div>
                <Button asChild variant="outline" size="sm"><Link href={`/admin/quotes/edit/${event.quoteId}`}>Apri preventivo</Link></Button>
              </div>
            </div>)}
          </div>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Nota: l'apertura email è rilevata tramite immagini remote; alcuni client possono bloccarle o precaricarle. Il click sul link e il feedback compilato sono segnali più affidabili.</p>
      </div>
    </main>
  </div>
}
