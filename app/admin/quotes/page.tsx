import Link from "next/link"
import { redirect } from "next/navigation"
import { BarChart3, MessageSquareText, Plus, RefreshCw, ServerCog } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import AdminNavigation from "@/components/admin-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import QuotesDashboard from "./quotes-dashboard"
import type { QuoteForwardStats, SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

const FEEDBACK_LABELS: Record<string, string> = {
  price: "Prezzo",
  timing: "Tempistiche",
  priority: "Priorità cambiata",
  features: "La proposta non rispondeva alle esigenze",
  competitor: "Ho scelto un'altra soluzione",
  internal: "Decisione interna / budget non approvato",
  other: "Altro",
}

type QuoteLifecycleInfo = {
  id: string
  quote_number?: string | null
  title?: string | null
  client_name?: string | null
  client_company?: string | null
  accepted_at?: string | null
  expired_at?: string | null
  feedback_received_at?: string | null
  feedback_reason?: string | null
  feedback_note?: string | null
  reactivation_requested_at?: string | null
}

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-8"><div className="text-center"><h1 className="text-3xl font-bold mb-4 text-destructive">Accesso Negato</h1><p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p></div></div>
  }

  const adminClient = createAdminClient()
  const { data: quotes, error } = await adminClient.from("sales_channel_quotes").select("*").order("created_at", { ascending: false })
  if (error) console.error("[quotes] Error fetching quotes:", error)

  const lifecycleQuotes = ((quotes || []) as QuoteLifecycleInfo[])
  const feedbacks = lifecycleQuotes
    .filter((quote) => quote.feedback_received_at)
    .sort((a, b) => new Date(b.feedback_received_at || 0).getTime() - new Date(a.feedback_received_at || 0).getTime())
  const reactivationRequests = lifecycleQuotes
    .filter((quote) => quote.reactivation_requested_at)
    .sort((a, b) => new Date(b.reactivation_requested_at || 0).getTime() - new Date(a.reactivation_requested_at || 0).getTime())

  // Gli inoltri vivono in una tabella separata: senza questa lettura la lista
  // non mostrerebbe nulla di cio' che e' stato inoltrato (il dato esisteva solo
  // nella pagina "Analisi inoltri").
  const quoteIds = (quotes || []).map((quote) => quote.id as string)
  const forwardStats: Record<string, QuoteForwardStats> = {}
  if (quoteIds.length) {
    const { data: shares, error: sharesError } = await adminClient
      .from("sales_channel_quote_shares")
      .select("quote_id, sent_at, send_count, email_open_count, last_email_opened_at, view_count, last_viewed_at, last_error")
      .in("quote_id", quoteIds)
    if (sharesError) console.error("[quotes] Error fetching forward stats:", sharesError)
    for (const share of shares || []) {
      const stats = forwardStats[share.quote_id] ||= {
        recipients: 0, sent: 0, opened: 0, viewed: 0, emailOpens: 0, pageViews: 0, failed: 0,
        lastSentAt: null, lastActivityAt: null,
      }
      stats.recipients += 1
      if (Number(share.send_count || 0) > 0) stats.sent += 1
      if (Number(share.email_open_count || 0) > 0) stats.opened += 1
      if (Number(share.view_count || 0) > 0) stats.viewed += 1
      stats.emailOpens += Number(share.email_open_count || 0)
      stats.pageViews += Number(share.view_count || 0)
      if (share.last_error) stats.failed += 1
      const activity = share.last_viewed_at || share.last_email_opened_at
      if (share.sent_at && (!stats.lastSentAt || new Date(share.sent_at) > new Date(stats.lastSentAt))) stats.lastSentAt = share.sent_at
      if (activity && (!stats.lastActivityAt || new Date(activity) > new Date(stats.lastActivityAt))) stats.lastActivityAt = activity
    }
  }

  return <div className="min-h-screen bg-background">
    <AdminNavigation userEmail={user.email || ""} />
    <div className="lg:ml-64 pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline"><Link href="/admin/quotes/analytics"><BarChart3 className="h-4 w-4 mr-2" />Analisi inoltri</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/quotes/provisioning"><ServerCog className="h-4 w-4 mr-2" />Attivazioni</Link></Button>
        <Button asChild><Link href="/admin/quotes/commerce"><Plus className="h-4 w-4 mr-2" />Preventivo multi-progetto</Link></Button>
      </div>

      {(feedbacks.length > 0 || reactivationRequests.length > 0) && <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-primary" /><h2 className="font-semibold">Feedback ricevuti</h2></div>
            <Badge variant="secondary">{feedbacks.length}</Badge>
          </div>
          {feedbacks.length === 0 ? <p className="text-sm text-muted-foreground">Nessun feedback ricevuto.</p> : <div className="space-y-3">
            {feedbacks.slice(0, 5).map((quote) => <div key={`feedback-${quote.id}`} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="text-sm font-medium">{quote.client_company || quote.client_name || "Cliente"}</p><p className="text-xs text-muted-foreground">{quote.quote_number || quote.title || "Preventivo"}</p></div>
                <span className="text-xs text-muted-foreground">{quote.feedback_received_at ? new Date(quote.feedback_received_at).toLocaleString("it-IT") : ""}</span>
              </div>
              <p className="text-sm mt-2"><span className="font-medium">Motivo:</span> {FEEDBACK_LABELS[quote.feedback_reason || ""] || quote.feedback_reason || "Non specificato"}</p>
              {quote.feedback_note && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{quote.feedback_note}</p>}
              <Button asChild variant="link" size="sm" className="px-0 mt-1"><Link href={`/admin/quotes/edit/${quote.id}`}>Apri preventivo</Link></Button>
            </div>)}
          </div>}
        </section>

        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /><h2 className="font-semibold">Richieste di riattivazione</h2></div>
            <Badge variant="secondary">{reactivationRequests.length}</Badge>
          </div>
          {reactivationRequests.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna richiesta di riattivazione.</p> : <div className="space-y-3">
            {reactivationRequests.slice(0, 5).map((quote) => {
              const mustReopen = Boolean(quote.accepted_at && quote.expired_at)
              return <div key={`reactivation-${quote.id}`} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm font-medium">{quote.client_company || quote.client_name || "Cliente"}</p><p className="text-xs text-muted-foreground">{quote.quote_number || quote.title || "Preventivo"} · {quote.reactivation_requested_at ? new Date(quote.reactivation_requested_at).toLocaleString("it-IT") : ""}</p></div>
                <Button asChild size="sm"><Link href={mustReopen ? "/admin/quotes" : `/admin/quotes/edit/${quote.id}`}>{mustReopen ? "Gestisci riapertura" : "Modifica scadenza"}</Link></Button>
              </div>
            })}
          </div>}
        </section>
      </div>}

      <QuotesDashboard initialQuotes={(quotes as SalesChannelQuote[]) || []} forwardStats={forwardStats} />
    </div>
  </div>
}
