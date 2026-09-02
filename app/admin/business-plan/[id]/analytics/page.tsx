import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download, Eye, Play, Users } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const dt = (value?: string | null) => value ? new Date(value).toLocaleString("it-IT") : "—"

export default async function BusinessPlanAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: plan }, { data: shares }, { data: events }] = await Promise.all([
    supabase.from("business_plans").select("id, name, client_name, project_type").eq("id", id).single(),
    supabase.from("business_plan_shares").select("id, email, token, created_at, last_accessed_at, access_count, view_count, expires_at").eq("business_plan_id", id).order("created_at", { ascending: false }),
    supabase.from("business_plan_share_events").select("id, share_id, event_type, recipient_email, metadata, created_at").eq("business_plan_id", id).order("created_at", { ascending: false }).limit(1000),
  ])

  if (!plan) notFound()
  const rows = events || []
  const views = rows.filter((event) => event.event_type === "page_viewed")
  const downloads = rows.filter((event) => event.event_type === "downloaded" || event.event_type === "corporate_report_opened")
  const presentationStarts = rows.filter((event) => event.event_type === "presentation_started")
  const presentationCompleted = rows.filter((event) => event.event_type === "presentation_completed")

  const visitorsMap = new Map<string, { email: string; name: string; company: string; views: number; downloads: number; presentation: number; lastSeen: string }>()
  for (const event of rows) {
    const metadata = (event.metadata || {}) as Record<string, unknown>
    const email = String(metadata.visitor_email || event.recipient_email || "non identificato")
    const current = visitorsMap.get(email) || {
      email,
      name: String(metadata.visitor_name || "—"),
      company: String(metadata.visitor_company || "—"),
      views: 0,
      downloads: 0,
      presentation: 0,
      lastSeen: event.created_at,
    }
    if (event.event_type === "page_viewed") current.views += 1
    if (event.event_type === "downloaded" || event.event_type === "corporate_report_opened") current.downloads += 1
    if (event.event_type === "presentation_completed") current.presentation += 1
    if (new Date(event.created_at) > new Date(current.lastSeen)) current.lastSeen = event.created_at
    if (current.name === "—" && metadata.visitor_name) current.name = String(metadata.visitor_name)
    if (current.company === "—" && metadata.visitor_company) current.company = String(metadata.visitor_company)
    visitorsMap.set(email, current)
  }
  const visitors = Array.from(visitorsMap.values()).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Button asChild variant="outline" size="icon"><Link href="/admin/business-plan"><ArrowLeft className="h-4 w-4" /></Link></Button><div><h1 className="text-2xl font-bold">Analytics dossier</h1><p className="text-sm text-muted-foreground">{plan.client_name || plan.name}</p></div></div>
        <Badge variant="secondary">{plan.project_type === "corporate_saas" ? "Corporate Room" : "Business Plan"}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-5"><Eye className="mb-2 h-5 w-5 text-amber-500" /><p className="text-xs text-muted-foreground">Accessi identificati</p><p className="text-2xl font-semibold">{views.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Users className="mb-2 h-5 w-5 text-amber-500" /><p className="text-xs text-muted-foreground">Visitatori unici</p><p className="text-2xl font-semibold">{visitors.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Download className="mb-2 h-5 w-5 text-amber-500" /><p className="text-xs text-muted-foreground">Download / report</p><p className="text-2xl font-semibold">{downloads.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Play className="mb-2 h-5 w-5 text-amber-500" /><p className="text-xs text-muted-foreground">Presentazioni avviate</p><p className="text-2xl font-semibold">{presentationStarts.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Play className="mb-2 h-5 w-5 text-amber-500" /><p className="text-xs text-muted-foreground">Presentazioni completate</p><p className="text-2xl font-semibold">{presentationCompleted.length}</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Visitatori</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3 text-left">Nome</th><th className="p-3 text-left">Azienda / Istituto</th><th className="p-3 text-left">Email</th><th className="p-3 text-center">Accessi</th><th className="p-3 text-center">Download</th><th className="p-3 text-center">Presentazione</th><th className="p-3 text-left">Ultima attività</th></tr></thead><tbody>{visitors.map((visitor) => <tr key={visitor.email} className="border-b"><td className="p-3 font-medium">{visitor.name}</td><td className="p-3">{visitor.company}</td><td className="p-3">{visitor.email}</td><td className="p-3 text-center">{visitor.views}</td><td className="p-3 text-center">{visitor.downloads}</td><td className="p-3 text-center">{visitor.presentation}</td><td className="p-3">{dt(visitor.lastSeen)}</td></tr>)}{visitors.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nessuna attività registrata.</td></tr>}</tbody></table></CardContent></Card>

      <Card><CardHeader><CardTitle>Link condivisi</CardTitle></CardHeader><CardContent className="space-y-3">{(shares || []).map((share) => <div key={share.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 md:flex-row md:items-center"><div><p className="font-medium">{share.email || "Link dossier"}</p><p className="text-xs text-muted-foreground">Creato {dt(share.created_at)} · ultimo accesso {dt(share.last_accessed_at)} · {share.access_count || share.view_count || 0} accessi</p></div><Button asChild variant="outline" size="sm"><a href={`/business-plan/${share.token}`} target="_blank" rel="noreferrer">Apri link</a></Button></div>)}</CardContent></Card>

      <Card><CardHeader><CardTitle>Ultimi eventi</CardTitle></CardHeader><CardContent className="space-y-2">{rows.slice(0, 100).map((event) => { const metadata = (event.metadata || {}) as Record<string, unknown>; return <div key={event.id} className="flex flex-col gap-1 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between"><div><Badge variant="outline">{event.event_type}</Badge><span className="ml-2 font-medium">{String(metadata.visitor_name || event.recipient_email || "")}</span>{metadata.visitor_company ? <span className="text-muted-foreground"> · {String(metadata.visitor_company)}</span> : null}</div><span className="text-xs text-muted-foreground">{dt(event.created_at)}</span></div>})}</CardContent></Card>
    </div>
  )
}
