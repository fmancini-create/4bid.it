import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"

// POST /api/ecomobility/tenant/password/confirm
// body: { token, password }
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Token o password mancanti (min 8 caratteri)" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data: tokenRow } = await supabase
      .from("ecomobility_operator_password_tokens")
      .select("token, operator_id, type, expires_at, used_at")
      .eq("token", token)
      .maybeSingle()

    if (!tokenRow) {
      return NextResponse.json({ error: "Token non valido" }, { status: 404 })
    }
    if (tokenRow.used_at) {
      return NextResponse.json({ error: "Token già utilizzato" }, { status: 410 })
    }
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Token scaduto" }, { status: 410 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { error: updErr } = await supabase
      .from("ecomobility_operators")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", tokenRow.operator_id)
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    await supabase
      .from("ecomobility_operator_password_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token)

    // Invalida tutti gli altri token aperti per quell'operatore
    await supabase
      .from("ecomobility_operator_password_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("operator_id", tokenRow.operator_id)
      .is("used_at", null)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("[v0] password confirm error:", e)
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 })
  }
}

// GET /api/ecomobility/tenant/password/confirm?token=...
// Verifica validità token (per la pagina di reset)
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token")
  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  const supabase = createAdminClient()
  const { data: tokenRow, error: tokenErr } = await supabase
    .from("ecomobility_operator_password_tokens")
    .select(
      "token, type, expires_at, used_at, operator:ecomobility_operators(email, name, structure:ecomobility_structures(name))",
    )
    .eq("token", token)
    .maybeSingle()

  if (tokenErr) {
    console.error("[v0] password confirm GET query error:", tokenErr.message)
    return NextResponse.json({ valid: false, reason: "error" })
  }
  if (!tokenRow) return NextResponse.json({ valid: false, reason: "not_found" })
  if (tokenRow.used_at) return NextResponse.json({ valid: false, reason: "used" })
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ valid: false, reason: "expired" })
  }

  const op: any = tokenRow.operator
  return NextResponse.json({
    valid: true,
    type: tokenRow.type,
    operator: {
      email: op?.email,
      name: op?.name,
      structure_name: op?.structure?.name,
    },
  })
}
