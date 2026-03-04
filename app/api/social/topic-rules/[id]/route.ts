import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { type NextRequest, NextResponse } from "next/server"

// DELETE: Remove a topic rule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = await params
    const admin = createAdminClient()

    const { error } = await admin
      .from("social_topic_rules")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting topic rule:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
