import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; shareId: string }> }) {
  const { id, shareId } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from("business_plan_shares").delete().eq("id", shareId).eq("business_plan_id", id)

  if (error) {
    console.error("[v0] Delete share error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
