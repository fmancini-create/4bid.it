import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminContacts from "@/components/admin-contacts"
import AdminLandingPages from "@/components/admin-landing-pages"
import AdminProjectSubmissions from "@/components/admin-project-submissions"
import AdminInvestorInquiries from "@/components/admin-investor-inquiries"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import TriggerSnapshotButton from "@/components/trigger-snapshot-button"
import { RefreshCw } from "lucide-react"

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
    lastSnapshotResult,
  ] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    supabase.from("landing_pages").select("*").order("created_at", { ascending: false }),
    supabase.from("landing_page_daily_stats").select("*").eq("date", yesterdayStr),
    supabase.from("project_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("investor_inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("landing_page_daily_stats").select("date").order("date", { ascending: false }).limit(1),
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

  const lastSnapshotDate = lastSnapshotResult.data?.[0]?.date || "Mai"
  const totalYesterdayViews = (yesterdayStatsResult.data || []).reduce((sum, stat) => sum + (stat.views || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div
        className="fixed top-0 right-0 left-0 lg:left-64 z-30 bg-background border-b border-border px-3 sm:px-8 py-2 sm:py-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 ml-12 lg:ml-0">
            <h1 className="text-sm sm:text-xl font-bold text-foreground truncate">Pannello Admin</h1>
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-semibold">{user.email?.split("@")[0]}</span>
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <form action="/admin" method="get">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 w-8 sm:w-auto px-0 sm:px-3 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Aggiorna</span>
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
              <Button type="submit" variant="destructive" size="sm" className="h-8 w-8 sm:w-auto px-0 sm:px-3">
                <span className="hidden sm:inline">Esci</span>
                <span className="sm:hidden text-xs">X</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      <AdminNavigation userEmail={user.email || ""} />

      <div
        className="lg:ml-64 pt-14 sm:pt-24 container mx-auto p-3 sm:p-8 space-y-6 sm:space-y-16"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 1rem)" }}
      >
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-2 sm:p-4">
            <h3 className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Visite Ieri</h3>
            <p className="text-base sm:text-2xl font-bold text-foreground">{totalYesterdayViews}</p>
            {totalYesterdayViews === 0 && <p className="text-[10px] text-amber-500 truncate">Nessun dato</p>}
          </div>
          <div className="bg-card border border-border rounded-lg p-2 sm:p-4">
            <h3 className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Snapshot</h3>
            <p className="text-base sm:text-2xl font-bold text-foreground truncate">{lastSnapshotDate}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-2 sm:p-4">
            <h3 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5">Azioni</h3>
            <TriggerSnapshotButton />
          </div>
        </div>

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
