import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, ServerCog } from "lucide-react"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import ProvisioningDashboard, { type ProvisioningRow } from "./provisioning-dashboard"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function QuoteProvisioningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  if (user.email !== SUPER_ADMIN_EMAIL) redirect("/admin/quotes")

  const admin = createAdminClient()
  const { data: jobs, error } = await admin
    .from("sales_channel_quote_provisioning_jobs")
    .select("id, quote_id, project, status, attempts, last_error, created_at, updated_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(250)
  if (error) throw error

  const quoteIds = [...new Set((jobs || []).map(job => job.quote_id))]
  const { data: quotes, error: quotesError } = quoteIds.length
    ? await admin
        .from("sales_channel_quotes")
        .select("id, quote_number, client_company, client_name, payment_status")
        .in("id", quoteIds)
    : { data: [], error: null }
  if (quotesError) throw quotesError

  const quoteMap = new Map((quotes || []).map(quote => [quote.id, quote]))
  const rows: ProvisioningRow[] = (jobs || []).map(job => {
    const quote = quoteMap.get(job.quote_id)
    return {
      ...job,
      quote_number: quote?.quote_number ?? null,
      client_company: quote?.client_company ?? null,
      client_name: quote?.client_name ?? null,
      payment_status: quote?.payment_status ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />
      <main className="lg:ml-64 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <ServerCog className="h-4 w-4" /> Quote-to-cash
              </div>
              <h1 className="text-2xl font-bold">Attivazioni preventivi</h1>
              <p className="mt-1 text-sm text-muted-foreground">Stato del provisioning verso HotelAccelerator, Santaddeo, HotelProfitAI e ManuBot.</p>
            </div>
            <Button asChild variant="outline"><Link href="/admin/quotes"><ArrowLeft className="mr-2 h-4 w-4" />Preventivi</Link></Button>
          </div>
          <ProvisioningDashboard rows={rows} />
        </div>
      </main>
    </div>
  )
}
