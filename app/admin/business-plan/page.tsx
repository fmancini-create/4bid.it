import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminNavigation from "@/components/admin-navigation"
import BusinessPlanDashboard from "./business-plan-dashboard"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function BusinessPlanPage() {
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

  // Carica i business plan esistenti
  const { data: businessPlans, error } = await supabase
    .from("business_plans")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching business plans:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />
      <div className="lg:ml-64 pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        <BusinessPlanDashboard initialPlans={businessPlans || []} />
      </div>
    </div>
  )
}
