import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, admin_notes } = body

    const supabase = await createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes

    const { data, error } = await supabase.from("investor_inquiries").update(updateData).eq("id", params.id).select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating investor inquiry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
