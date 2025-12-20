import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminContacts from "@/components/admin-contacts"
import AdminLandingPages from "@/components/admin-landing-pages"
import AdminProjectSubmissions from "@/components/admin-project-submissions"
import AdminInvestorInquiries from "@/components/admin-investor-inquiries"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, BookOpen, AlertCircle, Database } from "lucide-react"
import Link from "next/link"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-destructive">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p>
        </div>
      </div>
    )
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  const [
    contactsResult,
    landingPagesResult,
    yesterdayStatsResult,
    projectSubmissionsResult,
    investorInquiriesResult,
    chatConversationsResult,
    knowledgeBaseResult,
    escalatedChatsResult,
  ] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    supabase.from("landing_pages").select("*").order("created_at", { ascending: false }),
    supabase.from("landing_page_daily_stats").select("*").eq("date", yesterdayStr),
    supabase.from("project_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("investor_inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("chat_conversations").select("*").order("started_at", { ascending: false }),
    supabase.from("knowledge_base").select("*").eq("is_active", true),
    supabase.from("chat_conversations").select("*").eq("status", "escalated"),
  ])

  if (contactsResult.error) {
    console.error("Error fetching contacts:", contactsResult.error)
  }

  if (landingPagesResult.error) {
    console.error("Error fetching landing pages:", landingPagesResult.error)
  }

  if (yesterdayStatsResult.error) {
    console.error("Error fetching yesterday stats:", yesterdayStatsResult.error)
  }

  if (projectSubmissionsResult.error) {
    console.error("Error fetching project submissions:", projectSubmissionsResult.error)
  }

  if (investorInquiriesResult.error) {
    console.error("Error fetching investor inquiries:", investorInquiriesResult.error)
  }

  const yesterdayStatsMap = new Map((yesterdayStatsResult.data || []).map((stat) => [stat.landing_page_id, stat]))

  const landingPagesWithYesterday = (landingPagesResult.data || []).map((page) => {
    const yesterdayData = yesterdayStatsMap.get(page.id)
    return {
      ...page,
      yesterday_views: yesterdayData?.views,
      yesterday_conversions: yesterdayData?.conversions,
    }
  })

  const totalConversations = chatConversationsResult.data?.length || 0
  const escalatedConversations = escalatedChatsResult.data?.length || 0
  const activeConversations = chatConversationsResult.data?.filter((c) => c.status === "active").length || 0
  const knowledgeItems = knowledgeBaseResult.data?.length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 right-0 left-0 lg:left-64 z-30 bg-background border-b border-border px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-foreground">Pannello Amministrativo</h1>
            <p className="text-sm text-muted-foreground">
              Connesso come: <span className="font-semibold">{user.email}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <form action="/admin" method="get">
              <Button type="submit" variant="outline" size="sm">
                <span className="hidden sm:inline mr-2">Aggiorna</span>
                <span className="sm:hidden">⟳</span>
              </Button>
            </form>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/admin/login")
              }}
            >
              <Button type="submit" variant="destructive" size="sm">
                <span className="hidden sm:inline">Esci</span>
                <span className="sm:hidden">ESC</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      <AdminNavigation userEmail={user.email || ""} />

      <div className="lg:ml-64 pt-24 container mx-auto p-8 space-y-16">
        <div id="ai-management" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat AI Box */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Chat AI Support</CardTitle>
                </div>
                {escalatedConversations > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {escalatedConversations} escalate
                  </Badge>
                )}
              </div>
              <CardDescription>Gestisci le conversazioni con gli utenti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalConversations}</p>
                  <p className="text-xs text-muted-foreground">Totali</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{activeConversations}</p>
                  <p className="text-xs text-muted-foreground">Attive</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{escalatedConversations}</p>
                  <p className="text-xs text-muted-foreground">Escalate</p>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href="/admin/chat-conversations">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Gestisci Conversazioni
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Knowledge Base Box */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Knowledge Base</CardTitle>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  {knowledgeItems} voci
                </Badge>
              </div>
              <CardDescription>Informazioni per l'AI Support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Voci attive:</span>
                  <span className="font-semibold">{knowledgeItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stato:</span>
                  <Badge variant={knowledgeItems > 0 ? "default" : "secondary"}>
                    {knowledgeItems > 0 ? "Popolato" : "Da configurare"}
                  </Badge>
                </div>
              </div>
              <Button asChild className="w-full" variant={knowledgeItems > 0 ? "default" : "outline"}>
                <Link href="/admin/knowledge-base">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {knowledgeItems > 0 ? "Gestisci Knowledge Base" : "Configura Knowledge Base"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* End of Chat AI and Knowledge Base boxes */}

        <AdminLandingPages landingPages={landingPagesWithYesterday} />

        <div id="investor-inquiries">
          <AdminInvestorInquiries inquiries={investorInquiriesResult.data || []} />
        </div>

        <div id="project-submissions">
          <AdminProjectSubmissions submissions={projectSubmissionsResult.data || []} />
        </div>

        <div id="contacts">
          <AdminContacts contacts={contactsResult.data || []} userEmail={user.email || ""} />
        </div>
      </div>
    </div>
  )
}
