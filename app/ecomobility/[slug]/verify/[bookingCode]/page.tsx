import { createAdminClient } from "@/lib/supabase/server-admin"
import { notFound } from "next/navigation"
import { VerifyPage } from "./verify-page"

export default async function VerifyBookingPage({
  params,
}: {
  params: Promise<{ slug: string; bookingCode: string }>
}) {
  const { slug, bookingCode } = await params

  const supabase = createAdminClient()

  // Recupera struttura
  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!structure) {
    notFound()
  }

  // Recupera prenotazione
  const { data: booking } = await supabase
    .from("ecomobility_bookings")
    .select(`
      *,
      customer:ecomobility_customers(*),
      vehicle:ecomobility_vehicles(*, vehicle_type:ecomobility_vehicle_types(*))
    `)
    .eq("booking_code", bookingCode)
    .eq("structure_id", structure.id)
    .single()

  return <VerifyPage structure={structure} booking={booking} bookingCode={bookingCode} />
}
