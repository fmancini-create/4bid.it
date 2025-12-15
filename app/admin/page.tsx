import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminContacts from "@/components/admin-contacts"
import AdminLandingPages from "@/components/admin-landing-pages"
import AdminProjectSubmissions from "@/components/admin-project-submissions"
import AdminInvestorInquiries from "@/components/admin-investor-inquiries"
import AdminNavigation from "@/components/admin-navigation"

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

  const [contactsResult, landingPagesResult, projectSubmissionsResult, investorInquiriesResult] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    supabase.from("landing_pages").select("*").order("created_at", { ascending: false }),
    supabase.from("project_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("investor_inquiries").select("*").order("created_at", { ascending: false }),
  ])

  if (contactsResult.error) {
    console.error("Error fetching contacts:", contactsResult.error)
  }

  if (landingPagesResult.error) {
    console.error("Error fetching landing pages:", landingPagesResult.error)
  }

  if (projectSubmissionsResult.error) {
    console.error("Error fetching project submissions:", projectSubmissionsResult.error)
  }

  if (investorInquiriesResult.error) {
    console.error("Error fetching investor inquiries:", investorInquiriesResult.error)
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />

      <div className="lg:ml-64 container mx-auto p-8 space-y-16">
        <AdminLandingPages landingPages={landingPagesResult.data || []} />

        <div id="investor-inquiries">
          <AdminInvestorInquiries inquiries={investorInquiriesResult.data || []} />
        </div>

        <div id="project-submissions">
          <AdminProjectSubmissions projectSubmissions={projectSubmissionsResult.data || []} />
        </div>

        <div id="contacts">
          <AdminContacts contacts={contactsResult.data || []} userEmail={user.email || ""} />
        </div>
      </div>
    </div>
  )
}
