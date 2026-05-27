import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateRentalAmount } from "@/lib/ecomobility/pricing"
import { sendReturnConfirmation } from "@/lib/ecomobility/notifications"
import { deleteShareLink } from "@/lib/ecomobility/balin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const bookingId = formData.get("bookingId") as string
    const damageNotes = (formData.get("damageNotes") as string) || ""
    const batteryLevelReturn = Number.parseInt(formData.get("batteryLevelReturn") as string) || 0

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID mancante" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: booking, error: bookingError } = await supabase
      .from("ecomobility_bookings")
      .select(
        "*, customer:ecomobility_customers(*), vehicle:ecomobility_vehicles(*, vehicle_type:ecomobility_vehicle_types(*)), structure:ecomobility_structures(*)",
      )
      .eq("id", bookingId)
      .eq("status", "picked_up")
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Prenotazione non trovata o non valida" }, { status: 404 })
    }

    // pickup time: usa actual_pickup_datetime, fallback a pickup_datetime
    const pickupTime = new Date(
      booking.actual_pickup_datetime || booking.pickup_datetime || booking.created_at,
    )
    const returnTime = new Date()
    const elapsedMinutes = Math.max(
      1,
      Math.ceil((returnTime.getTime() - pickupTime.getTime()) / 60000),
    )

    // Carica pricing per il vehicle_type del booking
    const { data: pricing } = await supabase
      .from("ecomobility_pricing")
      .select("*")
      .eq("structure_id", booking.structure_id)
      .eq("vehicle_type_id", booking.vehicle?.vehicle_type_id)
      .maybeSingle()

    const { amount: finalAmount, hoursBilled, cappedAt } = calculateRentalAmount(pricing, elapsedMinutes)

    // Upload foto (schema live: photo_url, NON image_url)
    const photoTypes = ["front", "back", "left", "right"] as const
    for (const photoType of photoTypes) {
      const file = formData.get(photoType) as File | null
      if (file && typeof file === "object" && "size" in file && file.size > 0) {
        const fileName = `${bookingId}/${photoType}-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from("ecomobility-photos")
          .upload(fileName, file, { contentType: file.type, upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("ecomobility-photos").getPublicUrl(fileName)
          await supabase.from("ecomobility_return_photos").insert({
            booking_id: bookingId,
            photo_type: photoType,
            photo_url: urlData.publicUrl,
            notes: photoType === "front" && damageNotes ? damageNotes : null,
          })
        } else {
          console.error("[v0] Photo upload error:", uploadError)
        }
      }
    }

    // Stato veicolo: charging se batteria < soglia
    const minBatteryThreshold = (booking.structure as any)?.settings?.min_battery_threshold || 40
    const defaultChargeHours = (booking.structure as any)?.settings?.default_charge_hours || 3

    let vehicleStatus: "available" | "charging" = "available"
    let estimatedAvailableTime: string | null = null
    if (batteryLevelReturn < minBatteryThreshold) {
      vehicleStatus = "charging"
      const chargeNeeded = Math.max(10, minBatteryThreshold - batteryLevelReturn)
      const hoursNeeded = (chargeNeeded / 100) * defaultChargeHours
      estimatedAvailableTime = new Date(Date.now() + hoursNeeded * 60 * 60 * 1000).toISOString()
    }

    // Calcolo importo extra da addebitare (oltre quanto già incassato in checkout)
    const alreadyPaid = Number(booking.estimated_amount || 0)
    const extraAmount = Math.max(0, Math.round((finalAmount - alreadyPaid) * 100) / 100)
    let extraChargeStatus: "succeeded" | "failed" | "not_needed" = "not_needed"
    let extraChargePaymentIntentId: string | null = null
    let extraChargeError: string | null = null

    if (extraAmount > 0 && booking.stripe_payment_method_id && booking.stripe_customer_id) {
      try {
        const structureStripeAccount = (booking.structure as any)?.stripe_account_id
        if (!structureStripeAccount) throw new Error("Struttura senza Stripe Connect")

        const applicationFee = Math.round(extraAmount * 100 * 0.05)
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(extraAmount * 100),
          currency: "eur",
          customer: booking.stripe_customer_id,
          payment_method: booking.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          application_fee_amount: applicationFee,
          transfer_data: { destination: structureStripeAccount },
          metadata: {
            booking_id: bookingId,
            type: "ecomobility_extra_charge",
          },
          description: `Extra noleggio ${booking.booking_code}`,
        })
        extraChargePaymentIntentId = pi.id
        extraChargeStatus = pi.status === "succeeded" ? "succeeded" : "failed"
      } catch (err: any) {
        extraChargeStatus = "failed"
        extraChargeError = err?.message || "Stripe error"
        console.error("[v0] Extra charge failed:", err)
      }
    }

    await supabase
      .from("ecomobility_bookings")
      .update({
        status: extraChargeStatus === "failed" ? "returned_payment_failed" : "returned",
        actual_return_datetime: returnTime.toISOString(),
        final_amount: finalAmount,
        battery_level_return: batteryLevelReturn,
        damage_reported: !!damageNotes,
        damage_description: damageNotes || null,
        extra_charge_amount: extraAmount,
        extra_charge_status: extraChargeStatus,
        extra_charge_payment_intent_id: extraChargePaymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    if (booking.vehicle_id) {
      await supabase
        .from("ecomobility_vehicles")
        .update({
          status: vehicleStatus,
          battery_level: batteryLevelReturn,
          battery_status: vehicleStatus === "charging" ? "charging" : "ok",
          estimated_available_time: estimatedAvailableTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.vehicle_id)

      await supabase.from("ecomobility_battery_history").insert({
        vehicle_id: booking.vehicle_id,
        booking_id: bookingId,
        battery_level: batteryLevelReturn,
        event_type: "return",
      })
    }

    await supabase.from("ecomobility_operation_logs").insert({
      structure_id: booking.structure_id,
      booking_id: bookingId,
      vehicle_id: booking.vehicle_id,
      action: "vehicle_returned",
      details: {
        elapsed_minutes: elapsedMinutes,
        hours_billed: hoursBilled,
        capped_at: cappedAt,
        final_amount: finalAmount,
        already_paid: alreadyPaid,
        extra_amount: extraAmount,
        extra_charge_status: extraChargeStatus,
        extra_charge_error: extraChargeError,
        battery_level_return: batteryLevelReturn,
        vehicle_status: vehicleStatus,
        has_damage_notes: !!damageNotes,
      },
    })

    // Email cliente
    if (booking.customer?.email) {
      const vehicleName = `${booking.vehicle?.brand || ""} ${booking.vehicle?.model || ""}`.trim() ||
        booking.vehicle?.vehicle_type?.name || "Veicolo"
      sendReturnConfirmation(
        booking.customer.email,
        `${booking.customer.first_name || ""} ${booking.customer.last_name || ""}`.trim(),
        booking.booking_code,
        vehicleName,
        finalAmount,
        booking.structure?.name || "",
      ).catch((e) => console.error("[v0] sendReturnConfirmation error:", e))
    }

    // Cancella link condivisione tracker (best-effort)
    if (booking.tracker_share_id) {
      deleteShareLink(booking.tracker_share_id)
        .then(() =>
          supabase
            .from("ecomobility_bookings")
            .update({ tracker_share_url: null, tracker_share_id: null })
            .eq("id", bookingId),
        )
        .catch((e) => console.error("[v0] balin deleteShareLink error:", e))
    }

    return NextResponse.json({
      success: true,
      finalAmount,
      hoursBilled,
      cappedAt,
      extraAmount,
      extraChargeStatus,
      vehicleStatus,
      estimatedAvailableTime,
    })
  } catch (error) {
    console.error("[v0] Return API error:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
