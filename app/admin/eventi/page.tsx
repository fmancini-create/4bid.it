import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminNavigation from "@/components/admin-navigation"
import EventiDashboard from "./eventi-dashboard"

export const metadata = {
  title: "Gestione Eventi | Admin 4BID",
  description: "Gestione registrazioni eventi",
}

export default async function EventiAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <EventiDashboard />
      </main>
    </div>
  )
}
