import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  if (!body.password) {
    return NextResponse.json({ error: "Password richiesta" }, { status: 400 })
  }

  // Trova la condivisione
  const { data: share, error } = await supabase
    .from("business_plan_shares")
    .select("*")
    .eq("access_token", token)
    .single()

  if (error || !share) {
    return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  }

  // Verifica password
  const isValid = await bcrypt.compare(body.password, share.password_hash)

  if (!isValid) {
    return NextResponse.json({ error: "Password non corretta" }, { status: 401 })
  }

  // Aggiorna statistiche accesso
  await supabase
    .from("business_plan_shares")
    .update({
      last_accessed_at: new Date().toISOString(),
      access_count: (share.access_count || 0) + 1,
    })
    .eq("id", share.id)

  return NextResponse.json({ success: true })
}
