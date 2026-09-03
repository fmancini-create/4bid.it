import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Mail,
  MailCheck,
  MousePointerClick,
  Play,
  Users,
} from "lucide-react"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const dt = (value?: string | null) => (value ? new Date(value).toLocaleString("it-IT") : "—")

const eventLabels: Record<string, string> = {
  email_sent: "Email inviata",
  email_opened: "Email aperta",
  page_viewed: "Dossier aperto",
  downloaded: "Documento scaricato",
  corporate_report_opened: "Report aperto",
  presentation_started: "Presentazione avviata",
  presentation_completed: "Presentazione completata",
  avatar_started: "Avatar avviato",
  avatar_connected: "Avatar connesso",
  avatar_ended: "Conversazione avatar conclusa",
  avatar_transcript_ready: "Trascrizione avatar disponibile",
}

const eventBadgeClass: Record<string, string> = {
  email_sent: "border-sky-200 bg-sky-50 text-sky-700",
  email_opened: "border-emerald-200 bg-emerald-50 text-emerald-700",
  page_viewed: "border-amber-200 bg-amber-50 text-amber-700",
  downloaded: "border-violet-200 bg-violet-50 text-violet-700",
  corporate_report_opened: "border-violet-200 bg-violet-50 text-violet-700",
  avatar_started: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  avatar_connected: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  avatar_ended: "border-slate-200 bg-slate-50 text-slate-700",
}

type ShareRow = {
  id: string
  email: string | null
  token: string
  created_at: string
  last_accessed_at: string | null
  access_count: number | null
  view_count: number | null
  email_opened_at: string | null
  email_open_count: number | null
  expires_at: string | null
}

type EventRow = {
  id: string
  share_id: string | null
  event_type: string
  recipient_email: string | null
  metadata: unknown
  created_at: string
}

export default async function BusinessPlanAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: plan }, { data: rawShares }, { data: rawEvents }] = await Promise.all([
    supabase.from("business_plans").select("id, name, client_name, project_type").eq("id", id).single(),
    supabase
      .from("business_plan_shares")
      .select(
        "id, email, token, created_at, last_accessed_at, access_count, view_count, email_opened_at, email_open_count, expires_at",
      )
      .eq("business_plan_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("business_plan_share_events")
      .select("id, share_id, event_type, recipient_email, metadata, created_at")
      .eq("business_plan_id", id)
      .order("created_at", { ascending: false })
      .limit(1000),
  ])

  if (!plan) notFound()

  const shares = (rawShares || []) as ShareRow[]
  const rows = (rawEvents || []) as EventRow[]
  const emailsSent = rows.filter((event) => event.event_type === "email_sent")
  const emailOpens = rows.filter((event) => event.event_type === "email_opened")
  const views = rows.filter((event) => event.event_type === "page_viewed")
  const downloads = rows.filter(
    (event) => event.event_type === "downloaded" || event.event_type === "corporate_report_opened",
  )
  const avatarStarts = rows.filter((event) => event.event_type === "avatar_started")
  const presentationCompleted = rows.filter((event) => event.event_type === "presentation_completed")

  const sentRecipients = new Set(emailsSent.map((event) => event.recipient_email).filter(Boolean))
  const openedRecipients = new Set(emailOpens.map((event) => event.recipient_email).filter(Boolean))
  const openRate = sentRecipients.size > 0 ? Math.round((openedRecipients.size / sentRecipients.size) * 100) : 0

  const recipientCards = shares.map((share) => {
    const shareEvents = rows.filter(
      (event) => event.share_id === share.id || (!!share.email && event.recipient_email === share.email),
    )
    const metadata = shareEvents
      .map((event) => (event.metadata || {}) as Record<string, unknown>)
      .find((item) => item.visitor_name || item.recipient_name || item.visitor_company)
    const name = String(metadata?.visitor_name || metadata?.recipient_name || "Destinatario")
    const company = String(metadata?.visitor_company || "—")
    const sentAt = shareEvents.find((event) => event.event_type === "email_sent")?.created_at || null
    const openedAt = share.email_opened_at || shareEvents.find((event) => event.event_type === "email_opened")?.created_at || null
    const pageViews = shareEvents.filter((event) => event.event_type === "page_viewed").length
    const reportOpens = shareEvents.filter(
      (event) => event.event_type === "downloaded" || event.event_type === "corporate_report_opened",
    ).length
    const avatars = shareEvents.filter((event) => event.event_type === "avatar_started").length
    const completedPresentations = shareEvents.filter((event) => event.event_type === "presentation_completed").length
    const lastEvent = shareEvents[0]?.created_at || share.last_accessed_at || share.created_at

    return {
      ...share,
      name,
      company,
      sentAt,
      openedAt,
      pageViews,
      reportOpens,
      avatars,
      completedPresentations,
      lastEvent,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
        <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Button asChild variant="secondary" size="icon" className="mt-1 shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20">
                <Link href="/admin/business-plan">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-amber-400 text-slate-950 hover:bg-amber-400">Dossier Banca & Investitori</Badge>
                  <Badge variant="outline" className="border-white/20 text-slate-300">
                    Analytics live
                  </Badge>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Statistiche condivisione</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">{plan.client_name || plan.name}</p>
              </div>
            </div>
            <Button asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300">
              <Link href="/api/business-plan/admin-preview" target="_blank">
                <FileText className="mr-2 h-4 w-4" />
                Apri dossier
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600"><Mail className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-muted-foreground">TOTALI</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight">{emailsSent.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Email inviate</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><MailCheck className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-emerald-700">{openedRecipients.size} destinatari</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight">{emailOpens.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Aperture email registrate</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><MousePointerClick className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-muted-foreground">UNICI</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight">{openRate}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Tasso di apertura</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600"><Eye className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-muted-foreground">DOSSIER</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight">{views.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Aperture del piano</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200/80 bg-white/80 shadow-none"><CardContent className="flex items-center gap-4 p-4"><Download className="h-5 w-5 text-violet-500" /><div><p className="text-xl font-semibold">{downloads.length}</p><p className="text-xs text-muted-foreground">Report / download</p></div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/80 shadow-none"><CardContent className="flex items-center gap-4 p-4"><Bot className="h-5 w-5 text-fuchsia-500" /><div><p className="text-xl font-semibold">{avatarStarts.length}</p><p className="text-xs text-muted-foreground">Avatar live avviati</p></div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/80 shadow-none"><CardContent className="flex items-center gap-4 p-4"><Play className="h-5 w-5 text-amber-500" /><div><p className="text-xl font-semibold">{presentationCompleted.length}</p><p className="text-xs text-muted-foreground">Presentazioni completate</p></div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/80 shadow-none"><CardContent className="flex items-center gap-4 p-4"><Users className="h-5 w-5 text-sky-500" /><div><p className="text-xl font-semibold">{recipientCards.length}</p><p className="text-xs text-muted-foreground">Link personali creati</p></div></CardContent></Card>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Destinatari</h2>
            <p className="text-sm text-muted-foreground">Stato della mail e comportamento sul dossier, persona per persona.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {recipientCards.map((recipient) => {
              const emailOpened = (recipient.email_open_count || 0) > 0 || Boolean(recipient.openedAt)
              const dossierOpened = recipient.pageViews > 0 || Boolean(recipient.last_accessed_at)
              return (
                <Card key={recipient.id} className="overflow-hidden border-0 shadow-sm">
                  <div className={`h-1.5 ${dossierOpened ? "bg-emerald-500" : emailOpened ? "bg-amber-400" : "bg-slate-200"}`} />
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{recipient.name}</h3>
                          {dossierOpened ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Dossier aperto</Badge>
                          ) : emailOpened ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Email aperta</Badge>
                          ) : recipient.sentAt ? (
                            <Badge variant="secondary">Email inviata</Badge>
                          ) : (
                            <Badge variant="outline">Link creato</Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{recipient.email || "—"}</p>
                        {recipient.company !== "—" && <p className="mt-1 text-sm font-medium text-slate-600">{recipient.company}</p>}
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={`/business-plan/${recipient.token}`} target="_blank" rel="noreferrer">Apri link</a>
                      </Button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-muted-foreground">Aperture email</p><p className="mt-1 text-xl font-semibold">{recipient.email_open_count || 0}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-muted-foreground">Dossier</p><p className="mt-1 text-xl font-semibold">{recipient.pageViews}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-muted-foreground">Report</p><p className="mt-1 text-xl font-semibold">{recipient.reportOpens}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-muted-foreground">Avatar</p><p className="mt-1 text-xl font-semibold">{recipient.avatars}</p></div>
                    </div>

                    <div className="mt-5 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span>Inviata: <strong className="font-medium text-slate-700">{dt(recipient.sentAt)}</strong></span></div>
                      <div className="flex items-center gap-2"><MailCheck className="h-3.5 w-3.5" /><span>Prima apertura: <strong className="font-medium text-slate-700">{dt(recipient.openedAt)}</strong></span></div>
                      <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /><span>Ultima attività: <strong className="font-medium text-slate-700">{dt(recipient.lastEvent)}</strong></span></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /><span>Presentazioni complete: <strong className="font-medium text-slate-700">{recipient.completedPresentations}</strong></span></div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {recipientCards.length === 0 && (
              <Card className="lg:col-span-2"><CardContent className="p-8 text-center text-muted-foreground">Nessuna condivisione ancora inviata.</CardContent></Card>
            )}
          </div>
        </section>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-lg">Timeline attività</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {rows.slice(0, 100).map((event) => {
                const metadata = (event.metadata || {}) as Record<string, unknown>
                const who = String(metadata.visitor_name || metadata.recipient_name || event.recipient_email || "Utente")
                const company = metadata.visitor_company ? String(metadata.visitor_company) : ""
                return (
                  <div key={event.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={eventBadgeClass[event.event_type] || ""}>{eventLabels[event.event_type] || event.event_type}</Badge>
                          <span className="truncate text-sm font-medium">{who}</span>
                        </div>
                        {company && <p className="mt-1 text-xs text-muted-foreground">{company}</p>}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{dt(event.created_at)}</span>
                  </div>
                )
              })}
              {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">Nessuna attività registrata.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
