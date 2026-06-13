import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

/** Verifica che la richiesta provenga dal super admin loggato. */
async function assertSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return false
  }
  return true
}

// GET: elenco menzioni filtrabile per stato (?status=pending|approved|rejected|all)
export async function GET(request: Request) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "pending"

  const admin = createAdminClient()
  let query = admin
    .from("press_mentions")
    .select("id, title, url, source, snippet, keyword, published_at, status, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(300)

  if (status !== "all") {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ mentions: data || [] })
}

// PATCH: cambia lo stato di una menzione { id, status }
export async function PATCH(request: Request) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const id = body?.id as string | undefined
  const status = body?.status as string | undefined

  if (!id || !status || !["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Parametri non validi" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("press_mentions")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE: elimina definitivamente una menzione (?id=...)
export async function DELETE(request: Request) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id mancante" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from("press_mentions").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
