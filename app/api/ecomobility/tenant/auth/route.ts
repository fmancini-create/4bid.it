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

    // Verify password
    // Note: In production, passwords should be hashed with bcrypt
    // For now, we do a simple comparison or bcrypt comparison if available
    let passwordValid = false

    if (operator.password_hash) {
      // If password is hashed
      passwordValid = await bcrypt.compare(password, operator.password_hash)
    } else if (operator.password) {
      // If password is plain text (for initial setup)
      passwordValid = operator.password === password
    }

    if (!passwordValid) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Return operator info (without password)
    const { password: _, password_hash: __, ...operatorData } = operator

    return NextResponse.json({
      success: true,
      operator: operatorData,
    })
  } catch (error) {
    console.error("[v0] Tenant auth error:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
