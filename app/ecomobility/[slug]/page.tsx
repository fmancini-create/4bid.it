import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notFound } from "next/navigation"
import { EcomobilityBookingPage } from "./booking-page"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!structure) {
    return { title: "Struttura non trovata" }
  }

  return {
    title: `${structure.name} - Noleggio E-Bike & Scooter | 4BID Ecomobility`,
    description:
      structure.description || `Noleggia e-bike e scooter elettrici presso ${structure.name}. Più usi, meno paghi!`,
  }
}

export default async function EcomobilityStructurePage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()

  // Carica struttura
  const { data: structure, error } = await supabase
    .from("ecomobility_structures")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !structure) {
    notFound()
  }

  // Carica veicoli disponibili con tipo
  const { data: vehicles } = await supabase
    .from("ecomobility_vehicles")
    .select(`
      *,
      vehicle_type:ecomobility_vehicle_types(*)
    `)
    .eq("structure_id", structure.id)
    .in("status", ["available", "charging"])

  // Carica tariffe attive
  const { data: pricing } = await supabase
    .from("ecomobility_pricing")
    .select(`
      *,
      vehicle_type:ecomobility_vehicle_types(*)
    `)
    .eq("structure_id", structure.id)

  // Carica condizioni noleggio
  const { data: terms } = await supabase
    .from("ecomobility_rental_conditions")
    .select("*")
    .eq("structure_id", structure.id)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .single()

  return (
    <EcomobilityBookingPage structure={structure} vehicles={vehicles || []} pricing={pricing || []} terms={terms} />
  )
}
