import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notFound } from "next/navigation"
import { ReturnPage } from "./return-page"

interface Props {
  params: Promise<{ slug: string; bookingCode: string }>
}

export const metadata: Metadata = {
  title: "Riconsegna Veicolo | 4BID Ecomobility",
}

export default async function EcomobilityReturnPage({ params }: Props) {
  const { slug, bookingCode } = await params
  const supabase = createAdminClient()

  // Carica struttura
  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!structure) {
    notFound()
  }

  // Carica prenotazione
  const { data: booking } = await supabase
    .from("ecomobility_bookings")
    .select(`
      *,
      customer:ecomobility_customers(*),
      vehicle:ecomobility_vehicles(*, vehicle_type:ecomobility_vehicle_types(*)),
      pricing:ecomobility_pricing(*)
    `)
    .eq("booking_code", bookingCode)
    .eq("structure_id", structure.id)
    .single()

  if (!booking) {
    notFound()
  }

  // Verifica che la prenotazione sia in stato "picked_up"
  if (booking.status !== "picked_up") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Riconsegna non disponibile</h1>
          <p className="text-muted-foreground">
            {booking.status === "returned" || booking.status === "completed"
              ? "Questo noleggio è già stato concluso."
              : "Il veicolo non risulta ancora ritirato."}
          </p>
        </div>
      </div>
    )
  }

  return <ReturnPage structure={structure} booking={booking} />
}
