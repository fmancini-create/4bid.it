import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, BarChart3, Eye, MailOpen, Send, Users } from "lucide-react"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export const dynamic = "force-dynamic"

type ShareRow = {
  id: string
  quote_id: string
  recipient_email: string
  forwarded_by_share_id: string | null
  created_at: string
  sent_at: string | null
  send_count: number
  first_email_opened_at: string | null
  last_email_opened_at: string | null
  email_open_count: number
  first_viewed_at: string | null
  last_viewed_at: string | null
  view_count: number
  last_error: string | null
}

type QuoteRow = {
  id: string
  quote_number: string | null
  title: string
  client_name: string | null
  client_company: string | null
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function QuoteForwardAnalyticsPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect("/admin/login")

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-destructive">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()
  const { data: sharesData, error: sharesError } = await supabase
    .from("sales_channel_quote_shares")
    .select(
      "id, quote_id, recipient_email, forwarded_by_share_id, created_at, sent_at, send_count, first_email_opened_at, last_email_opened_at, email_open_count, first_viewed_at, last_viewed_at, view_count, last_error",
    )
    .order("created_at", { ascending: false })

  const shares = (sharesData || []) as ShareRow[]
  const quoteIds = Array.from(new Set(shares.map((share) => share.quote_id)))
  let quotes: QuoteRow[] = []

  if (quoteIds.length) {
    const { data: quoteData, error: quoteError } = await supabase
      .from("sales_channel_quotes")
      .select("id, quote_number, title, client_name, client_company")
      .in("id", quoteIds)
    if (quoteError) console.error("[quote-forward-analytics] quote lookup failed", quoteError)
    quotes = (quoteData || []) as QuoteRow[]
  }

  const quoteById = new Map(quotes.map((quote) => [quote.id, quote]))
  const sentRows = shares.filter((share) => share.send_count > 0)
  const openedRows = shares.filter((share) => share.email_open_count > 0)
  const viewedRows = shares.filter((share) => share.view_count > 0)
  const openRate = sentRows.length ? Math.round((openedRows.length / sentRows.length) * 100) : 0
  const viewRate = sentRows.length ? Math.round((viewedRows.length / sentRows.length) * 100) : 0
  const setupMissing = sharesError && (sharesError.code === "42P01" || /sales_channel_quote_shares/i.test(sharesError.message || ""))

  const cards = [
    { label: "Destinatari", value: shares.length, detail: "indirizzi unici", icon: Users },
    { label: "Email inviate", value: sentRows.length, detail: `${shares.reduce((sum, share) => sum + Number(share.send_count || 0), 0)} invii totali`, icon: Send },
    { label: "Email aperte", value: openedRows.length, detail: `${openRate}% dei destinatari`, icon: MailOpen },
    { label: "Preventivi visti", value: viewedRows.length, detail: `${viewRate}% dei destinatari`, icon: Eye },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />
      <main className="lg:ml-64 px-4 pb-16 pt-6 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Analisi inoltri preventivi</h1>
                <p className="text-sm text-muted-foreground">Invii, aperture email e visualizzazioni per singolo destinatario.</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/quotes"><ArrowLeft className="mr-2 h-4 w-4" />Torna ai preventivi</Link>
            </Button>
          </header>

          {sharesError ? (
            <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
              <h2 className="font-semibold">Analisi non disponibile</h2>
              <p className="mt-1 text-sm">
                {setupMissing
                  ? "La migration scripts/20260812_quote_forward_tracking.sql non è ancora stata eseguita su Supabase."
                  : sharesError.message}
              </p>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border bg-card p-5">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <card.icon className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">{card.label}</span>
                </div>
                <p className="text-3xl font-black">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            L&apos;apertura dell&apos;email è un dato indicativo: alcuni programmi di posta precaricano o bloccano le immagini. La visualizzazione della pagina personale del preventivo è il segnale più affidabile.
          </section>

          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Dettaglio destinatari</h2>
            </div>
            {shares.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Non risultano ancora inoltri dalla pagina pubblica.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Preventivo</th>
                      <th className="px-4 py-3">Destinatario</th>
                      <th className="px-4 py-3">Invio</th>
                      <th className="px-4 py-3">Apertura email</th>
                      <th className="px-4 py-3">Visualizzazione</th>
                      <th className="px-4 py-3">Origine</th>
                      <th className="px-4 py-3">Esito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shares.map((share) => {
                      const quote = quoteById.get(share.quote_id)
                      return (
                        <tr key={share.id} className="align-top">
                          <td className="px-4 py-4">
                            <p className="font-semibold">{quote?.client_company || quote?.client_name || "Preventivo"}</p>
                            <p className="text-xs text-muted-foreground">{quote?.quote_number ? `N. ${quote.quote_number} · ` : ""}{quote?.title || "—"}</p>
                          </td>
                          <td className="px-4 py-4 font-medium">{share.recipient_email}</td>
                          <td className="px-4 py-4">
                            <p>{share.send_count || 0} {share.send_count === 1 ? "invio" : "invii"}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(share.sent_at)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className={share.email_open_count > 0 ? "font-semibold text-emerald-700" : "text-muted-foreground"}>{share.email_open_count || 0} aperture</p>
                            <p className="text-xs text-muted-foreground">{formatDate(share.last_email_opened_at)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className={share.view_count > 0 ? "font-semibold text-primary" : "text-muted-foreground"}>{share.view_count || 0} visualizzazioni</p>
                            <p className="text-xs text-muted-foreground">{formatDate(share.last_viewed_at)}</p>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">{share.forwarded_by_share_id ? "Da un altro destinatario" : "Dal link originale"}</td>
                          <td className="px-4 py-4">
                            {share.last_error ? <span className="text-destructive">{share.last_error}</span> : <span className="text-emerald-700">Regolare</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
