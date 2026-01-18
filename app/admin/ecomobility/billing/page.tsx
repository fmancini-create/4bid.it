import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BillingAdminDashboard } from "./billing-admin-dashboard"

export default async function BillingAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Carica piani
  const { data: plans } = await supabase
    .from("ecomobility_subscription_plans")
    .select("*")
    .order("monthly_fee", { ascending: true })

  // Carica strutture con abbonamenti
  const { data: structures } = await supabase
    .from("ecomobility_structures")
    .select(`
      *,
      subscription:ecomobility_subscriptions(
        *,
        plan:ecomobility_subscription_plans(*)
      )
    `)
    .order("name", { ascending: true })

  // Carica fatture recenti
  const { data: invoices } = await supabase
    .from("ecomobility_invoices")
    .select(`
      *,
      structure:ecomobility_structures(name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <BillingAdminDashboard 
      plans={plans || []}
      structures={structures || []}
      invoices={invoices || []}
    />
  )
}
