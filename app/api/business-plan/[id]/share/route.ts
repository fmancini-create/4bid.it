import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("business_plan_shares")
    .select("id, email, token, can_edit, can_download, expires_at, last_accessed_at, access_count, created_at")
    .eq("business_plan_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching shares:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log("[v0] Share POST - business_plan_id:", id)

  const supabase = createAdminClient()
  const body = await request.json()
  console.log("[v0] Share POST - body:", { email: body.email, hasPassword: !!body.password })

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email e password sono obbligatori" }, { status: 400 })
  }

  // Hash della password
  const passwordHash = await bcrypt.hash(body.password, 10)

  const token = randomUUID()

  console.log("[v0] Share POST - inserting with token:", token)

  const { data, error } = await supabase
    .from("business_plan_shares")
    .insert({
      business_plan_id: id,
      email: body.email,
      password_hash: passwordHash,
      token: token,
      can_edit: body.can_edit ?? false,
      can_download: body.can_download ?? true,
      expires_at: body.expires_at || null,
      access_count: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Share POST - error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] Share POST - success, share id:", data.id)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const shareLink = `${baseUrl}/business-plan/${token}`

  return NextResponse.json({
    ...data,
    shareLink,
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const shareId = searchParams.get("shareId")

  if (!shareId) {
    return NextResponse.json({ error: "shareId è obbligatorio" }, { status: 400 })
  }

  const { error } = await supabase.from("business_plan_shares").delete().eq("id", shareId).eq("business_plan_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
