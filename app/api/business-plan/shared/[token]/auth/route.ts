import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  console.log("[v0] Auth POST - token:", token)

  const supabase = createAdminClient()
  const body = await request.json()
  console.log("[v0] Auth POST - has password:", !!body.password)

  if (!body.password) {
    return NextResponse.json({ error: "Password richiesta" }, { status: 400 })
  }

  const { data: share, error } = await supabase.from("business_plan_shares").select("*").eq("token", token).single()

  console.log("[v0] Auth POST - share found:", !!share, "error:", error?.message)

  if (error || !share) {
    return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  }

  console.log("[v0] Auth POST - verifying password")
  const isValid = await bcrypt.compare(body.password, share.password_hash)
  console.log("[v0] Auth POST - password valid:", isValid)

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

  console.log("[v0] Auth POST - success")
  return NextResponse.json({ success: true, businessPlanId: share.business_plan_id })
}
