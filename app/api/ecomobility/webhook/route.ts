import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendBookingConfirmation } from "@/lib/ecomobility/notifications"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  const isProd = process.env.NODE_ENV === "production"
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (isProd && !webhookSecret) {
    console.error("[v0] STRIPE_WEBHOOK_SECRET missing in production")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }
  if (!signature && webhookSecret) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
    } else {
      // Solo dev locale, mai in prod (controllato sopra)
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (error: any) {
    console.error("[v0] Webhook signature error:", error.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency: se già processato, esci
  const { data: existing } = await supabase
    .from("ecomobility_stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ received: true, deduped: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type !== "ecomobility_booking") break
        const bookingId = session.metadata.booking_id
        if (!bookingId) break

        // Recupera PaymentIntent espanso per ottenere payment_method e customer
        let paymentMethodId: string | null = null
        let customerId: string | null = null
        if (session.payment_intent) {
          try {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
              expand: ["payment_method", "customer"],
            })
            paymentMethodId =
              typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id || null
            customerId =
              typeof pi.customer === "string" ? pi.customer : pi.customer?.id || null

            // Se non c'è customer ma abbiamo email, creane uno per attaccare il PM
            if (!customerId && paymentMethodId && session.customer_email) {
              const customer = await stripe.customers.create({
                email: session.customer_email,
                metadata: { booking_id: bookingId },
              })
              customerId = customer.id
              await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
            }
          } catch (err) {
            console.error("[v0] PI retrieve error:", err)
          }
        }

        await supabase
          .from("ecomobility_bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
            stripe_payment_intent_id: (session.payment_intent as string) || null,
            stripe_customer_id: customerId,
            stripe_payment_method_id: paymentMethodId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        await supabase.from("ecomobility_operation_logs").insert({
          structure_id: session.metadata.structure_id,
          booking_id: bookingId,
          action: "payment_completed",
          details: {
            stripe_session_id: session.id,
            amount_total: session.amount_total,
            payment_status: session.payment_status,
            has_payment_method: !!paymentMethodId,
          },
        })

        // Email di conferma (best-effort, non blocca)
        try {
          const { data: booking } = await supabase
            .from("ecomobility_bookings")
            .select(
              "booking_code, pickup_datetime, customer:ecomobility_customers(email,first_name,last_name), vehicle:ecomobility_vehicles(brand,model), structure:ecomobility_structures(name)",
            )
            .eq("id", bookingId)
            .single()

          if (booking?.customer && Array.isArray(booking.customer) === false) {
            const c: any = booking.customer
            const v: any = booking.vehicle
            const s: any = booking.structure
            if (c?.email) {
              const vehicleName = `${v?.brand || ""} ${v?.model || ""}`.trim() || "Veicolo"
              const pickupDateFmt = booking.pickup_datetime
                ? new Date(booking.pickup_datetime).toLocaleString("it-IT", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })
                : ""
              await sendBookingConfirmation(
                c.email,
                `${c.first_name || ""} ${c.last_name || ""}`.trim(),
                booking.booking_code,
                vehicleName,
                pickupDateFmt,
                s?.name || "",
              )
            }
          }
        } catch (e) {
          console.error("[v0] sendBookingConfirmation error:", e)
        }

        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type !== "ecomobility_booking") break
        const bookingId = session.metadata.booking_id
        if (!bookingId) break

        await supabase
          .from("ecomobility_bookings")
          .update({
            payment_status: "expired",
            status: "cancelled",
            notes: "Pagamento scaduto",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

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
        if (charge.payment_intent) {
          await supabase
            .from("ecomobility_bookings")
            .update({
              deposit_returned: true,
              deposit_refund_status: "succeeded",
              deposit_refund_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", charge.payment_intent as string)
        }
        break
      }
    }

    // Marca event come processato
    await supabase.from("ecomobility_stripe_events").insert({
      id: event.id,
      type: event.type,
      account_id: (event as any).account || null,
      livemode: event.livemode,
      payload: event.data.object as any,
    })

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
