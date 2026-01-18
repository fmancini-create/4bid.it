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

    // Recupera dettagli struttura e account Stripe Connect
    const { data: structure } = await supabase
      .from("ecomobility_structures")
      .select("name, slug, stripe_account_id, stripe_onboarding_complete")
      .eq("id", structure_id)
      .single()

    // Verifica che la struttura abbia Stripe Connect configurato
    if (!structure?.stripe_account_id || !structure?.stripe_onboarding_complete) {
      return NextResponse.json({ 
        error: "La struttura non ha ancora configurato i pagamenti. Contattare la struttura." 
      }, { status: 400 })
    }

    // Calcola la commissione 4BID (5% del totale)
    const totalAmount = amount + (deposit || 0)
    const applicationFee = Math.round(totalAmount * 0.05 * 100) // 5% in centesimi

    // Crea sessione Stripe Checkout con Stripe Connect
    // Il pagamento va alla struttura, 4BID trattiene la commissione
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
      // Stripe Connect: pagamento va all'account della struttura
      payment_intent_data: {
        application_fee_amount: applicationFee, // Commissione 4BID
        transfer_data: {
          destination: structure.stripe_account_id, // Account Stripe della struttura
        },
        metadata: {
          booking_id,
          structure_id,
        },
      },
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
