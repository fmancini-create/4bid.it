import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getAdminUser } from "@/lib/jobs/admin-guard"

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("job_positions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { title } = body as { title?: string }
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 })
  }

  const admin = createAdminClient()
  const baseSlug = slugify(body.slug || title)
  // Ensure slug uniqueness.
  let slug = baseSlug || `posizione-${Date.now()}`
  const { data: existing } = await admin.from("job_positions").select("slug").eq("slug", slug).maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const { data, error } = await admin
    .from("job_positions")
    .insert([
      {
        slug,
        title: title.trim(),
        department: body.department ?? null,
        employment_type: body.employment_type ?? null,
        badge: body.badge ?? null,
        summary: body.summary ?? null,
        description: body.description ?? null,
        extra_fields: Array.isArray(body.extra_fields) ? body.extra_fields : [],
        is_open: body.is_open ?? true,
        sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      },
    ])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { id } = body as { id?: string }
  if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 })

  const allowed = [
    "title",
    "department",
    "employment_type",
    "badge",
    "summary",
    "description",
    "extra_fields",
    "is_open",
    "sort_order",
  ] as const

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key as keyof typeof body]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nessuna modifica" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from("job_positions").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
