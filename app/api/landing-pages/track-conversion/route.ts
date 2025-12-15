import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc("increment_landing_page_conversions", {
      page_slug: slug,
    })

    if (error) {
      console.error("[v0] Error tracking conversion:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Track conversion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
