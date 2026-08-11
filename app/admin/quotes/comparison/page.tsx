import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import AdminNavigation from "@/components/admin-navigation"
import ComparisonTablesManager from "./comparison-tables-manager"
import {
  COMPARISON_PRODUCTS,
  normalizeMasterTable,
  type ProductComparisonTable,
} from "@/lib/quotes/comparison"

export const dynamic = "force-dynamic"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function ComparisonTablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

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
  const { data } = await admin.from("product_comparison_tables").select("*")
  const byProduct = new Map((data || []).map((r: any) => [r.product, r]))

  // Ogni prodotto ha sempre una scheda, anche se il DB non ha ancora la riga.
  const tables: ProductComparisonTable[] = COMPARISON_PRODUCTS.map((product) =>
    normalizeMasterTable(product, byProduct.get(product) || {}),
  )

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation userEmail={user.email || ""} />
      <div className="lg:ml-64" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        <ComparisonTablesManager initialTables={tables} />
      </div>
    </div>
  )
}
