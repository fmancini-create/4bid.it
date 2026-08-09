import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getAdminUser } from "@/lib/jobs/admin-guard"
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/jobs/types"

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }
  const admin = createAdminClient()

  // Lightweight badge count for the admin navigation (?count=1): number of
  // still-unhandled applications (status "nuova"). head:true returns count only.
  const { searchParams } = new URL(request.url)
  if (searchParams.get("count")) {
    const { count, error } = await admin
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "nuova")
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ pending: count || 0 })
  }

  const { data, error } = await admin
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { id, status, admin_notes } = body as {
    id?: string
    status?: string
    admin_notes?: string
  }

  if (!id) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (typeof status === "string") {
    if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
      return NextResponse.json({ error: "Stato non valido" }, { status: 400 })
    }
    update.status = status
  }
  if (typeof admin_notes === "string") {
    update.admin_notes = admin_notes
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nessuna modifica" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from("job_applications").update(update).eq("id", id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
