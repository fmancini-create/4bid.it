import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const bookingId = formData.get("bookingId") as string
    const damageNotes = formData.get("damageNotes") as string
    const batteryLevelReturn = Number.parseInt(formData.get("batteryLevelReturn") as string) || 0

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID mancante" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Carica prenotazione con pricing e struttura
    const { data: booking, error: bookingError } = await supabase
      .from("ecomobility_bookings")
      .select("*, pricing:ecomobility_pricing(*), structure:ecomobility_structures(*)")
      .eq("id", bookingId)
      .eq("status", "picked_up")
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Prenotazione non trovata o non valida" }, { status: 404 })
    }

    const returnTime = new Date()
    const pickupTime = new Date(booking.actual_pickup_at)
    const elapsedMinutes = Math.ceil((returnTime.getTime() - pickupTime.getTime()) / 60000)
    const elapsedHours = Math.ceil(elapsedMinutes / 60)

    // Calcola importo finale con pricing decrescente
    const pricing = booking.pricing
    let finalAmount = 0

    if (pricing) {
      // Prima ora
      if (elapsedHours >= 1) {
        finalAmount += pricing.price_first_hour
      }
      // Seconda ora
      if (elapsedHours >= 2 && pricing.price_second_hour) {
        finalAmount += pricing.price_second_hour
      }
      // Terza ora
      if (elapsedHours >= 3 && pricing.price_third_hour) {
        finalAmount += pricing.price_third_hour
      }
      // Ore successive
      if (elapsedHours > 3 && pricing.price_per_hour_after) {
        finalAmount += (elapsedHours - 3) * pricing.price_per_hour_after
      }

      // Applica cap giornaliero
      if (pricing.max_price_day && finalAmount > pricing.max_price_day) {
        finalAmount = pricing.max_price_day
      }

      // Applica minimo
      if (pricing.min_price && finalAmount < pricing.min_price) {
        finalAmount = pricing.min_price
      }
    }

    // Upload delle foto
    const photoTypes = ["front", "back", "left", "right"] as const
    const uploadedPhotos: { type: string; url: string }[] = []

    for (const photoType of photoTypes) {
      const file = formData.get(photoType) as File
      if (file) {
        const fileName = `${bookingId}/${photoType}-${Date.now()}.jpg`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("ecomobility-photos")
          .upload(fileName, file, { contentType: file.type })

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from("ecomobility-photos").getPublicUrl(fileName)

          uploadedPhotos.push({ type: photoType, url: urlData.publicUrl })

          // Salva in tabella return_photos
          await supabase.from("ecomobility_return_photos").insert({
            booking_id: bookingId,
            photo_type: photoType,
            image_url: urlData.publicUrl,
            has_damage: !!damageNotes,
            damage_notes: photoType === "front" ? damageNotes : null,
          })
        }
      }
    }

    await supabase
      .from("ecomobility_bookings")
      .update({
        status: "returned",
        actual_return_at: returnTime.toISOString(),
        final_amount: finalAmount,
        battery_level_return: batteryLevelReturn,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    const minBatteryThreshold = booking.structure?.min_battery_threshold || 40
    const defaultChargeHours = booking.structure?.default_charge_hours || 3

    let vehicleStatus = "available"
    let batteryStatus = "available"
    let estimatedAvailableTime: string | null = null

    if (batteryLevelReturn < minBatteryThreshold) {
      // Battery below threshold - set to charging
      vehicleStatus = "charging"
      batteryStatus = "charging"

      // Calculate estimated charge time
      const chargeNeeded = minBatteryThreshold - batteryLevelReturn
      const hoursNeeded = (chargeNeeded / 100) * defaultChargeHours
      const availableTime = new Date(Date.now() + hoursNeeded * 60 * 60 * 1000)
      estimatedAvailableTime = availableTime.toISOString()
    }

    await supabase
      .from("ecomobility_vehicles")
      .update({
        status: vehicleStatus,
        battery_level: batteryLevelReturn,
        battery_status: batteryStatus,
        last_battery_update: new Date().toISOString(),
        charge_start_time: vehicleStatus === "charging" ? new Date().toISOString() : null,
        estimated_available_time: estimatedAvailableTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.vehicle_id)

    await supabase.from("ecomobility_battery_history").insert({
      vehicle_id: booking.vehicle_id,
      booking_id: bookingId,
      battery_level: batteryLevelReturn,
      battery_status: batteryStatus,
      event_type: "return",
      recorded_by: "customer",
      notes: damageNotes || null,
    })

    // Log attività
    await supabase.from("ecomobility_activity_logs").insert({
      structure_id: booking.structure_id,
      booking_id: bookingId,
      vehicle_id: booking.vehicle_id,
      customer_id: booking.customer_id,
      action: "vehicle_returned",
      details: {
        elapsed_minutes: elapsedMinutes,
        final_amount: finalAmount,
        has_damage_notes: !!damageNotes,
        battery_level_return: batteryLevelReturn,
        vehicle_status_post_return: vehicleStatus,
      },
    })

    return NextResponse.json({
      success: true,
      finalAmount,
      elapsedMinutes,
      vehicleStatus,
      estimatedAvailableTime,
    })
  } catch (error) {
    console.error("[v0] Return API error:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
