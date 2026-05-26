import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    // Account aggiornato (onboarding completato, verifiche, etc.)
    case "account.updated": {
      const account = event.data.object as Stripe.Account
      
      if (account.metadata?.structure_id) {
        const isComplete = account.charges_enabled && account.details_submitted
        
        await supabase
          .from("ecomobility_structures")
          .update({ 
            stripe_onboarding_complete: isComplete,
          })
          .eq("id", account.metadata.structure_id)
      }
      break
    }

    // Pagamento ricevuto su account connesso
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      // Se è un pagamento per una prenotazione Ecomobility
      if (paymentIntent.metadata?.booking_id) {
        await supabase
          .from("ecomobility_bookings")
          .update({ 
            payment_status: "paid",
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq("id", paymentIntent.metadata.booking_id)
      }
      break
    }

    // Trasferimento alla struttura completato
    case "transfer.created": {
      const transfer = event.data.object as Stripe.Transfer
      console.log(`Transfer ${transfer.id} created for ${transfer.destination}`)
      break
    }
  }

  return NextResponse.json({ received: true })
}
