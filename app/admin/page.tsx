import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminContacts from "@/components/admin-contacts"
import AdminLandingPages from "@/components/admin-landing-pages"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function AdminPage() {
  const supabase = await createClient()

  // Check if user is authenticated
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

  const [contactsResult, landingPagesResult] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    supabase.from("landing_pages").select("*").order("created_at", { ascending: false }),
  ])

  if (contactsResult.error) {
    console.error("Error fetching contacts:", contactsResult.error)
  }

  if (landingPagesResult.error) {
    console.error("Error fetching landing pages:", landingPagesResult.error)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <AdminLandingPages landingPages={landingPagesResult.data || []} />

        <div className="mt-12">
          <AdminContacts contacts={contactsResult.data || []} userEmail={user.email || ""} />
        </div>
      </div>
    </div>
  )
}
