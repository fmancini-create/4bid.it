import { createClient } from "@/lib/supabase/server"
import { TenantDashboard } from "./tenant-dashboard"
import { notFound } from "next/navigation"

export default async function TenantAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Get structure by slug
  const { data: structure, error } = await supabase
    .from("ecomobility_structures")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !structure) {
    notFound()
  }

  // Get vehicle types for this structure
  const { data: vehicleTypes } = await supabase
    .from("ecomobility_vehicle_types")
    .select("*")
    .eq("structure_id", structure.id)
    .order("name")

  return <TenantDashboard structure={structure} vehicleTypes={vehicleTypes || []} />
}
