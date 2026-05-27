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
    const { data: structure, error: structErr } = await supabase
      .from("ecomobility_structures")
      .select("id, name, slug")
      .eq("slug", slug)
      .single()
    if (structErr || !structure) {
      console.error("[v0] password reset: structure not found for slug:", slug, structErr?.message)
      return NextResponse.json({ success: true })
    }

    const normEmail = String(email).toLowerCase().trim()
    const { data: operator, error: opErr } = await supabase
      .from("ecomobility_operators")
      .select("id, email, name, is_active")
      .eq("structure_id", structure.id)
      .eq("email", normEmail)
      .maybeSingle()

    if (opErr) {
      console.error("[v0] password reset: query error:", opErr.message)
      return NextResponse.json({ success: true })
    }
    if (!operator) {
      console.error("[v0] password reset: no operator for", normEmail, "@", structure.slug)
      return NextResponse.json({ success: true })
    }
    if (!operator.is_active) {
      console.error("[v0] password reset: operator inactive:", operator.id)
      return NextResponse.json({ success: true })
    }

    const token = nanoid(48)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error: tokErr } = await supabase.from("ecomobility_operator_password_tokens").insert({
      token,
      operator_id: operator.id,
      type: "reset",
      expires_at: expiresAt,
    })
    if (tokErr) {
      console.error("[v0] password reset: token insert error:", tokErr.message)
      return NextResponse.json({ success: true })
    }

    const emailRes = await sendOperatorPasswordEmail({
      to: operator.email,
      operatorName: operator.name || operator.email,
      structureName: structure.name,
      structureSlug: structure.slug,
      token,
      type: "reset",
    })
    if (!emailRes.success) {
      console.error("[v0] password reset: email send failed:", emailRes.error)
    } else {
      console.log("[v0] password reset email sent to", operator.email)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("[v0] password reset request error:", e)
    return NextResponse.json({ success: true })
  }
}
