import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, ServerCog } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import AdminNavigation from "@/components/admin-navigation"
import { Button } from "@/components/ui/button"
import QuotesDashboard from "./quotes-dashboard"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-8"><div className="text-center"><h1 className="text-3xl font-bold mb-4 text-destructive">Accesso Negato</h1><p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p></div></div>
  }

  const adminClient = createAdminClient()
  const { data: quotes, error } = await adminClient.from("sales_channel_quotes").select("*").order("created_at", { ascending: false })
  if (error) console.error("[quotes] Error fetching quotes:", error)

  return <div className="min-h-screen bg-background">
    <AdminNavigation userEmail={user.email || ""} />
    <div className="lg:ml-64 pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline"><Link href="/admin/quotes/provisioning"><ServerCog className="h-4 w-4 mr-2" />Attivazioni</Link></Button>
        <Button asChild><Link href="/admin/quotes/commerce"><Plus className="h-4 w-4 mr-2" />Preventivo multi-progetto</Link></Button>
      </div>
      <QuotesDashboard initialQuotes={(quotes as SalesChannelQuote[]) || []} />
    </div>
  </div>
}