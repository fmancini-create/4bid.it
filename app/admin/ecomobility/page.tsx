import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { EcomobilityAdminDashboard } from "./ecomobility-admin-dashboard"

export const metadata: Metadata = {
  title: "Ecomobility Admin | 4BID",
  description: "Gestione noleggio mobilità elettrica",
}

export default async function EcomobilityAdminPage() {
  const supabase = createAdminClient()

  // Carica tutte le strutture
  const { data: structures } = await supabase.from("ecomobility_structures").select("*").order("name")

  // Carica tipi veicoli
  const { data: vehicleTypes } = await supabase.from("ecomobility_vehicle_types").select("*").order("name")

  return <EcomobilityAdminDashboard structures={structures || []} vehicleTypes={vehicleTypes || []} />
}
