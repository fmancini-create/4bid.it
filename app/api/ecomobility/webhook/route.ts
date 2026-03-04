import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // In produzione, usa STRIPE_WEBHOOK_SECRET
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      // In sviluppo, parsea direttamente
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (error: any) {
    console.error("[v0] Webhook signature error:", error.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Verifica che sia una prenotazione Ecomobility
        if (session.metadata?.type !== "ecomobility_booking") {
          break
        }

        const bookingId = session.metadata.booking_id

        // Aggiorna stato prenotazione
        await supabase
          .from("ecomobility_bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        // Log operazione
        await supabase
          .from("ecomobility_operation_logs")
          .insert({
            structure_id: session.metadata.structure_id,
            booking_id: bookingId,
            action: "payment_completed",
            details: {
              stripe_session_id: session.id,
              amount_total: session.amount_total,
              payment_status: session.payment_status,
            },
          })

        console.log(`[v0] Booking ${bookingId} payment completed`)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.metadata?.type !== "ecomobility_booking") {
          break
        }

        const bookingId = session.metadata.booking_id

        // Annulla prenotazione se il pagamento è scaduto
        await supabase
          .from("ecomobility_bookings")
          .update({
            payment_status: "pending",
            status: "cancelled",
            notes: "Pagamento scaduto",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        // Rimetti veicolo disponibile
        const { data: booking } = await supabase
          .from("ecomobility_bookings")
          .select("vehicle_id")
          .eq("id", bookingId)
          .single()

        if (booking?.vehicle_id) {
          await supabase
            .from("ecomobility_vehicles")
            .update({ status: "available" })
            .eq("id", booking.vehicle_id)
        }

        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        
        // Gestisci rimborso cauzione
        console.log(`[v0] Refund processed: ${charge.id}`)
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
