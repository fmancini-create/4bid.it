import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notifyDocumentsApproved, notifyDocumentsRejected } from "@/lib/ecomobility/notifications"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const structureId = searchParams.get("structureId")
  const status = searchParams.get("status") || "submitted"

  if (!structureId) {
    return NextResponse.json({ error: "Structure ID required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Trova tutti i clienti con prenotazioni nella struttura che hanno documenti da verificare
  const { data, error } = await supabase
    .from("ecomobility_bookings")
    .select(`
      id,
      booking_code,
      pickup_date,
      customer:ecomobility_customers(*)
    `)
    .eq("structure_id", structureId)
    .not("customer_id", "is", null)

  if (error) {
    console.error("[v0] Error fetching documents:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtra per stato documenti
  const filtered = data?.filter((booking) => {
    const customer = booking.customer as any
    return customer?.documents_status === status
  })

  return NextResponse.json({ documents: filtered })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { customerId, action, rejectionReason, structureId, bookingId } = body

  if (!customerId || !action) {
    return NextResponse.json({ error: "Customer ID and action required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === "approve") {
    // Approva documenti
    const { error } = await supabase
      .from("ecomobility_customers")
      .update({
        documents_status: "verified",
        documents_verified_at: new Date().toISOString(),
        driving_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)

    if (error) {
      console.error("[v0] Error approving documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aggiorna stato prenotazione se in attesa documenti
    if (bookingId) {
      await supabase
        .from("ecomobility_bookings")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("status", "pending")
    }

    // Invia notifica
    if (structureId) {
      await notifyDocumentsApproved(customerId, structureId, bookingId)
    }

    // Log
    await supabase.from("ecomobility_activity_logs").insert({
      structure_id: structureId,
      booking_id: bookingId,
      customer_id: customerId,
      action: "documents_approved",
    })

    return NextResponse.json({ success: true, status: "verified" })
  } else if (action === "reject") {
    // Rifiuta documenti
    const { error } = await supabase
      .from("ecomobility_customers")
      .update({
        documents_status: "rejected",
        documents_rejection_reason: rejectionReason,
        driving_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)

    if (error) {
      console.error("[v0] Error rejecting documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invia notifica
    if (structureId) {
      await notifyDocumentsRejected(customerId, structureId, rejectionReason, bookingId)
    }

    // Log
    await supabase.from("ecomobility_activity_logs").insert({
      structure_id: structureId,
      booking_id: bookingId,
      customer_id: customerId,
      action: "documents_rejected",
      details: { reason: rejectionReason },
    })

    return NextResponse.json({ success: true, status: "rejected" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
