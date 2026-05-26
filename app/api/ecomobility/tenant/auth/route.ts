import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, structure_id } = await request.json()

    if (!email || !password || !structure_id) {
      return NextResponse.json({ error: "Email, password e structure_id sono obbligatori" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find operator by email and structure
    const { data: operator, error } = await supabase
      .from("ecomobility_operators")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("structure_id", structure_id)
      .eq("is_active", true)
      .single()

    if (error || !operator) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Verifica password: SOLO bcrypt. Niente fallback plaintext (security).
    if (!operator.password_hash) {
      console.error("[v0] Operator senza password_hash:", operator.id)
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }
    const passwordValid = await bcrypt.compare(password, operator.password_hash)

    if (!passwordValid) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Return operator info (senza hash)
    const { password_hash: _ph, ...operatorData } = operator as any

    return NextResponse.json({
      success: true,
      operator: operatorData,
    })
  } catch (error) {
    console.error("[v0] Tenant auth error:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
