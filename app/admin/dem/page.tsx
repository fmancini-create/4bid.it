import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import AdminNavigation from "@/components/admin-navigation"
import DemComposer from "./dem-composer"

export const metadata = {
  title: "DEM - Invio Email Marketing | Admin 4BID",
}

export default async function DemPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invio DEM</h1>
            <p className="text-muted-foreground mt-1">
              Componi e invia email personalizzate ai tuoi clienti usando i tab di sostituzione.
            </p>
          </div>
          <DemComposer />
        </div>
      </main>
    </div>
  )
}
