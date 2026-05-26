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
      cancel_url,
    } = body

    if (!booking_id || !customer_email || (!amount && !deposit)) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: structure } = await supabase
      .from("ecomobility_structures")
      .select("name, slug, stripe_account_id, stripe_onboarding_complete")
      .eq("id", structure_id)
      .single()

    if (!structure?.stripe_account_id || !structure?.stripe_onboarding_complete) {
      return NextResponse.json(
        {
          error: "La struttura non ha ancora configurato i pagamenti. Contattare la struttura.",
        },
        { status: 400 },
      )
    }

    // Solo l'importo del noleggio è line_item.
    // La cauzione NON viene incassata: la pre-autorizzeremo via SetupIntent + manual capture.
    const rentalAmount = Number(amount) || 0
    const applicationFee = Math.round(rentalAmount * 100 * 0.05) // 5% in centesimi

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      customer_email,
      // setup_future_usage permette di addebitare extra al return senza nuovo consenso
      payment_intent_data: {
        setup_future_usage: "off_session",
        application_fee_amount: applicationFee,
        transfer_data: { destination: structure.stripe_account_id },
        metadata: { booking_id, structure_id, type: "ecomobility_booking" },
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Noleggio ${description || ""}`.trim(),
              description: `Prenotazione presso ${structure.name}`,
            },
            unit_amount: Math.round(rentalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id,
        structure_id,
        type: "ecomobility_booking",
        deposit_amount: String(deposit || 0),
      },
      success_url:
        success_url ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/ecomobility/${structure.slug}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancel_url || `${process.env.NEXT_PUBLIC_SITE_URL}/ecomobility/${structure.slug}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min timeout
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    await supabase
      .from("ecomobility_bookings")
      .update({
        payment_method: "stripe",
        stripe_session_id: session.id,
        deposit_amount: Number(deposit || 0),
      })
      .eq("id", booking_id)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error("[v0] Stripe checkout error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
