import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { name, base_url, description, crawl_frequency, is_active } = body

    if (!name || !base_url) {
      return NextResponse.json({ error: "Nome e URL sono obbligatori" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("external_sites")
      .update({
        name,
        base_url,
        description,
        crawl_frequency,
        is_active,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating external site:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] External site update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
