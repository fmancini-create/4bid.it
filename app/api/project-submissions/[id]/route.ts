import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { admin_notes, status } = body

    const { data, error } = await supabase
      .from("project_submissions")
      .update({
        admin_notes,
        status,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating project submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
