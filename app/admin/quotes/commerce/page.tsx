import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminNavigation from "@/components/admin-navigation"
import QuoteCommerceBuilder from "./quote-commerce-builder"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function QuoteCommercePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  if (user.email !== SUPER_ADMIN_EMAIL) redirect("/admin/quotes")

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />
      <main className="lg:ml-64 px-4 sm:px-6 py-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 2rem)" }}>
        <QuoteCommerceBuilder />
      </main>
    </div>
  )
}
