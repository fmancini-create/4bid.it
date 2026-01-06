import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextResponse } from "next/server"

// PATCH - Update contact (mark as read, etc.)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log("[v0] Updating contact:", id, body)

    const supabase = createAdminClient()

    const { data, error } = await supabase.from("contacts").update(body).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating contact:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Errore nel processare la richiesta" }, { status: 500 })
  }
}

// DELETE - Delete contact
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] Deleting contact:", id)

    const supabase = createAdminClient()

    const { error } = await supabase.from("contacts").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting contact:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Errore nel processare la richiesta" }, { status: 500 })
  }
}
