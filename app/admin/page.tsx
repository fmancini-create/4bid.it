import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminContacts from "@/components/admin-contacts"

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Accesso Negato</h1>
          <p className="text-gray-600">Non hai i permessi per accedere a questa area.</p>
        </div>
      </div>
    )
  }

  // Fetch all contacts
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching contacts:", error)
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Errore</h1>
        <p className="text-red-600">Impossibile caricare i contatti</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminContacts contacts={contacts || []} userEmail={user.email || ""} />
    </div>
  )
}
