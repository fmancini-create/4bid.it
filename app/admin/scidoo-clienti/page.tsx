import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import AdminAccessDenied from "@/components/admin-access-denied"
import AdminNavigation from "@/components/admin-navigation"
import AdminLogoutButton from "@/components/admin-logout-button"
import ScidooPropertiesDashboard from "./scidoo-properties-dashboard"

export const metadata: Metadata = {
  title: "Clienti Scidoo | Admin 4BID.IT",
  description: "Directory privata delle strutture ricettive che utilizzano il booking engine Scidoo",
}

export const dynamic = "force-dynamic"

export default async function ScidooClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login?redirect=/admin/scidoo-clienti")
  if (!isSuperAdminEmail(user.email)) return <AdminAccessDenied email={user.email} />

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="fixed left-0 right-0 top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-8 sm:py-4 lg:left-64"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="ml-12 min-w-0 lg:ml-0">
            <h1 className="truncate text-base font-bold text-slate-900 sm:text-xl">Clienti Scidoo</h1>
            <p className="truncate text-xs text-slate-500">Directory booking engine · codici 1–5000</p>
          </div>
          <AdminLogoutButton />
        </div>
      </header>

      <AdminNavigation userEmail={user.email || ""} />

      <main
        className="px-3 pb-10 pt-20 sm:px-8 sm:pt-28 lg:ml-64"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2.5rem)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <ScidooPropertiesDashboard />
        </div>
      </main>
    </div>
  )
}
