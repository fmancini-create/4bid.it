import Link from "next/link"
import { redirect } from "next/navigation"
import { BarChart3, Plus, ServerCog } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import QuotesDashboard from "./quotes-dashboard"
import type { QuoteForwardStats, SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

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
      <QuotesDashboard initialQuotes={(quotes as SalesChannelQuote[]) || []} forwardStats={forwardStats} />
    </div>
  </div>
}
