import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { error } = await supabase.from("knowledge_base").update(body).eq("id", params.id)

    if (error) {
      console.error("[v0] Error updating knowledge item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in knowledge update API:", error)
    return NextResponse.json({ error: "Failed to update knowledge item" }, { status: 500 })
  }
}
