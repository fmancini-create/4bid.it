import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendOperatorPasswordEmail } from "@/lib/ecomobility/notifications"
import { nanoid } from "nanoid"

// POST /api/ecomobility/tenant/password/request
// body: { slug, email }
// Genera token reset e manda email. Risponde sempre 200 per non rivelare se l'email esiste.
export async function POST(request: NextRequest) {
  try {
    const { slug, email } = await request.json()
    if (!slug || !email) {
      return NextResponse.json({ success: true })
    }

    const supabase = createAdminClient()
    const { data: structure } = await supabase
      .from("ecomobility_structures")
      .select("id, name, slug")
      .eq("slug", slug)
      .single()
    if (!structure) return NextResponse.json({ success: true })

    const { data: operator } = await supabase
      .from("ecomobility_operators")
      .select("id, email, first_name, last_name, is_active")
      .eq("structure_id", structure.id)
      .eq("email", String(email).toLowerCase().trim())
      .maybeSingle()

    if (!operator || !operator.is_active) return NextResponse.json({ success: true })

    const token = nanoid(48)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabase.from("ecomobility_operator_password_tokens").insert({
      token,
      operator_id: operator.id,
      type: "reset",
      expires_at: expiresAt,
    })

    await sendOperatorPasswordEmail({
      to: operator.email,
      operatorName: `${operator.first_name || ""} ${operator.last_name || ""}`.trim() || operator.email,
      structureName: structure.name,
      structureSlug: structure.slug,
      token,
      type: "reset",
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("[v0] password reset request error:", e)
    return NextResponse.json({ success: true })
  }
}
