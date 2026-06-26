import { createAdminClient } from "@/lib/supabase/server-admin"
import { notFound } from "next/navigation"
import { BookingSuccessPage } from "./booking-success-page"

export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { slug } = await params
  const { session_id } = await searchParams
  
  const supabase = createAdminClient()

  // Recupera struttura
  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!structure) {
    notFound()
  }

  // Recupera prenotazione dal session_id (se disponibile)
  let booking = null
  if (session_id) {
    const { data } = await supabase
      .from("ecomobility_bookings")
      .select(`
        *,
        customer:ecomobility_customers(*),
        vehicle:ecomobility_vehicles(*, vehicle_type:ecomobility_vehicle_types(*))
      `)
      .ilike("notes", `%${session_id}%`)
      .single()
    
    booking = data
  }

  return <BookingSuccessPage structure={structure} booking={booking} />
}
