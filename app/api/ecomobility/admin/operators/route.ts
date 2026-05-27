import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendOperatorPasswordEmail } from "@/lib/ecomobility/notifications"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

// GET /api/ecomobility/admin/operators?structureId=...
export async function GET(request: NextRequest) {
  const structureId = new URL(request.url).searchParams.get("structureId")
  if (!structureId) return NextResponse.json({ error: "structureId required" }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ecomobility_operators")
    .select("id, email, name, role, is_active, created_at")
    .eq("structure_id", structureId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ operators: data })
}

// POST /api/ecomobility/admin/operators
// body: { structureId, email, name, role }
// Crea operatore con password placeholder + invia invito via email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { structureId, email, name, first_name, last_name, role } = body
    if (!structureId || !email) {
      return NextResponse.json({ error: "structureId ed email obbligatori" }, { status: 400 })
    }
    const fullName =
      name?.trim() || `${first_name || ""} ${last_name || ""}`.trim() || null

    const supabase = createAdminClient()
    const { data: structure } = await supabase
      .from("ecomobility_structures")
      .select("name, slug")
      .eq("id", structureId)
      .single()
    if (!structure) return NextResponse.json({ error: "Struttura non trovata" }, { status: 404 })

    // Placeholder hash random (resterà inutilizzabile finché non imposta la password)
    const placeholderHash = await bcrypt.hash(nanoid(32), 10)

    const { data: operator, error } = await supabase
      .from("ecomobility_operators")
      .insert({
        structure_id: structureId,
        email: email.toLowerCase().trim(),
        name: fullName,
        role: role || "operator",
        password_hash: placeholderHash,
        is_active: true,
      })
      .select("id, email, name")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Operatore già esistente con questa email" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Token invite
    const token = nanoid(48)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabase.from("ecomobility_operator_password_tokens").insert({
      token,
      operator_id: operator.id,
      type: "invite",
      expires_at: expiresAt,
    })

    const emailRes = await sendOperatorPasswordEmail({
      to: operator.email,
      operatorName: operator.name || operator.email,
      structureName: structure.name,
      structureSlug: structure.slug,
      token,
      type: "invite",
    })

    return NextResponse.json({ success: true, operator, emailSent: emailRes.success })
  } catch (e: any) {
    console.error("[v0] operator invite error:", e)
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 })
  }
}

// DELETE /api/ecomobility/admin/operators?id=...
export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ecomobility_operators")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
