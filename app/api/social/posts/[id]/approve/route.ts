import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { data: existingPost, error: fetchError } = await supabase
      .from("social_posts")
      .select("scheduled_for")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const newStatus = existingPost.scheduled_for ? "scheduled" : "approved"

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: newStatus,
        approved_by: user.email,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error approving post:", error)
    return NextResponse.json({ error: "Errore nell'approvazione" }, { status: 500 })
  }
}
