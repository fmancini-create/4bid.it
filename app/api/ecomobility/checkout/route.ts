import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      booking_id,
      structure_id,
      customer_email,
      customer_name,
      amount,
      deposit,
      description,
      success_url,
      cancel_url 
    } = body

    if (!booking_id || !amount || !customer_email) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Recupera dettagli struttura per metadata
    const { data: structure } = await supabase
      .from("ecomobility_structures")
      .select("name, slug")
      .eq("id", structure_id)
      .single()

    // Crea sessione Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Noleggio ${description}`,
              description: `Prenotazione presso ${structure?.name || "Struttura"}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe usa centesimi
          },
          quantity: 1,
        },
        ...(deposit > 0 ? [{
          price_data: {
            currency: "eur",
            product_data: {
              name: "Cauzione (rimborsabile)",
              description: "Verrà rimborsata alla riconsegna del veicolo",
            },
            unit_amount: Math.round(deposit * 100),
          },
          quantity: 1,
        }] : []),
      ],
      metadata: {
        booking_id,
        structure_id,
        type: "ecomobility_booking",
      },
      success_url: success_url || `${process.env.NEXT_PUBLIC_SITE_URL}/ecomobility/${structure?.slug}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_SITE_URL}/ecomobility/${structure?.slug}`,
    })

    // Aggiorna prenotazione con session_id
    await supabase
      .from("ecomobility_bookings")
      .update({ 
        payment_method: "stripe",
        notes: `Stripe session: ${session.id}`
      })
      .eq("id", booking_id)

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error: any) {
    console.error("[v0] Stripe checkout error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
