import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PressMentionsManager, type PressMention } from "@/components/admin/press-mentions-manager"

export const metadata: Metadata = {
  title: "Parlano di noi - Moderazione | Admin 4BID.IT",
  description: "Modera la rassegna stampa automatica",
}

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export const dynamic = "force-dynamic"

export default async function AdminPressMentionsPage() {
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

  const admin = createAdminClient()
  const { data } = await admin
    .from("press_mentions")
    .select("id, title, url, source, snippet, keyword, status, published_at, created_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  const rows = (data || []) as PressMention[]
  const pending = rows.filter((r) => r.status === "pending")
  const approved = rows.filter((r) => r.status === "approved")
  const rejected = rows.filter((r) => r.status === "rejected")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al pannello admin
        </Link>
        <h1 className="mb-1 text-3xl font-bold text-[#2C3E50]">Parlano di noi</h1>
        <p className="mb-8 text-gray-600">Moderazione della rassegna stampa automatica</p>

        <PressMentionsManager initialPending={pending} initialApproved={approved} initialRejected={rejected} />
      </div>
    </div>
  )
}
