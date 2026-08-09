import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { ApplicationsManager } from "@/components/admin/applications-manager"
import type { JobApplication, JobPosition } from "@/lib/jobs/types"

export const metadata: Metadata = {
  title: "Candidature - Backoffice | Admin 4BID.IT",
  description: "Gestione delle candidature Lavora con noi.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminCandidaturePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  if (!isSuperAdminEmail(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-destructive">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()
  const [{ data: apps }, { data: positions }] = await Promise.all([
    admin.from("job_applications").select("*").order("created_at", { ascending: false }),
    admin.from("job_positions").select("*").order("sort_order", { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Torna al pannello admin
        </Link>
        <h1 className="mb-1 text-3xl font-bold text-[#2C3E50]">Candidature</h1>
        <p className="mb-8 text-gray-600">Gestione delle candidature “Lavora con noi” e delle posizioni aperte.</p>

        <ApplicationsManager
          initialApplications={(apps ?? []) as JobApplication[]}
          initialPositions={(positions ?? []) as JobPosition[]}
        />
      </div>
    </div>
  )
}
