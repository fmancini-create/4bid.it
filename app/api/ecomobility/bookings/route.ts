import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { structureId, vehicleId, pricingId, pickupDate, pickupTime, customer, termsAccepted } = body

    if (!structureId || !vehicleId || !pickupDate || !pickupTime || !customer || !termsAccepted) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verifica che il veicolo sia disponibile
    const { data: vehicle, error: vehicleError } = await supabase
      .from("ecomobility_vehicles")
      .select("*, vehicle_type:ecomobility_vehicle_types(*)")
      .eq("id", vehicleId)
      .eq("status", "available")
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: "Veicolo non disponibile" }, { status: 400 })
    }

    // Crea o aggiorna il cliente
    const { data: existingCustomer } = await supabase
      .from("ecomobility_customers")
      .select("id")
      .eq("email", customer.email)
      .single()

    let customerId: string

    if (existingCustomer) {
      customerId = existingCustomer.id
      await supabase
        .from("ecomobility_customers")
        .update({
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone,
          date_of_birth: customer.dateOfBirth || null,
          license_type: customer.licenseType || null,
          license_number: customer.licenseNumber || null,
          license_expiry: customer.licenseExpiry || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId)
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("ecomobility_customers")
        .insert({
          email: customer.email,
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone,
          date_of_birth: customer.dateOfBirth || null,
          nationality: customer.nationality || "IT",
          license_type: customer.licenseType || null,
          license_number: customer.licenseNumber || null,
          license_expiry: customer.licenseExpiry || null,
          documents_status: "pending",
        })
        .select("id")
        .single()

      if (customerError || !newCustomer) {
        console.error("[v0] Error creating customer:", customerError)
        return NextResponse.json({ error: "Errore creazione cliente" }, { status: 500 })
      }

      customerId = newCustomer.id
    }

    // Recupera pricing per calcolare importo stimato
    const { data: pricing } = await supabase.from("ecomobility_pricing").select("*").eq("id", pricingId).single()

    // Genera codice prenotazione
    const bookingCode = `ECO-${nanoid(8).toUpperCase()}`

    // Crea la prenotazione
    const { data: booking, error: bookingError } = await supabase
      .from("ecomobility_bookings")
      .insert({
        structure_id: structureId,
        customer_id: customerId,
        vehicle_id: vehicleId,
        booking_code: bookingCode,
        pickup_datetime: `${pickupDate}T${pickupTime}:00`,
        status: "pending",
        estimated_amount: pricing?.hour_1 || pricing?.minimum_charge || 0,
        deposit_amount: pricing?.deposit || 100,
        payment_status: "pending",
        conditions_accepted: true,
        conditions_accepted_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (bookingError) {
      console.error("[v0] Error creating booking:", bookingError)
      return NextResponse.json({ error: "Errore creazione prenotazione" }, { status: 500 })
    }

    // Log attività
    await supabase.from("ecomobility_operation_logs").insert({
      structure_id: structureId,
      booking_id: booking.id,
      vehicle_id: vehicleId,
      action: "booking_created",
      details: { booking_code: bookingCode },
    })

    // TODO: Creare sessione Stripe per pagamento e pre-autorizzazione cauzione
    // TODO: Inviare notifica email al cliente
    // TODO: Inviare notifica alla struttura

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingCode,
        status: booking.status,
      },
    })
  } catch (error) {
    console.error("[v0] Booking API error:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
