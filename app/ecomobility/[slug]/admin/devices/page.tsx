import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { DevicesDashboard } from "./devices-dashboard"

export default async function DevicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: structure, error } = await supabase
    .from("ecomobility_structures")
    .select("id,name,slug,primary_color")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !structure) notFound()

  const { data: vehicles } = await supabase
    .from("ecomobility_vehicles")
    .select("id, code, brand, model, vehicle_type:ecomobility_vehicle_types(name)")
    .eq("structure_id", structure.id)
    .order("code")

  return <DevicesDashboard structure={structure} vehicles={(vehicles || []) as any} />
}
