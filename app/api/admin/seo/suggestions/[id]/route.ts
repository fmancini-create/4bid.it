import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export const dynamic = "force-dynamic"

/** PATCH { status: 'approved' | 'dismissed' | 'pending' } — aggiorna lo stato di una proposta. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const status = body?.status
  if (!["approved", "dismissed", "pending"].includes(status)) {
    return NextResponse.json({ error: "status non valido" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("seo_suggestions")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ suggestion: data })
}

/** DELETE — rimuove una proposta. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from("seo_suggestions").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
