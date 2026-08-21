import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import CensimentoDashboard from "./censimento-dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Censimento gestionali | 4bid",
  description: "Quali gestionali e motori di prenotazione usano le strutture ricettive italiane.",
  robots: { index: false, follow: false },
}

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")
  if (!isSuperAdminEmail(user.email)) redirect("/admin")

  return <CensimentoDashboard />
}
