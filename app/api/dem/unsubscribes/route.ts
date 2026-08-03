import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const PAGE_SIZE = 50

// Verifies the caller is the super admin before any admin operation.
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return null
  }
  return user
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Extracts and normalises a list of emails from free text (comma/semicolon/newline).
function parseEmails(input: unknown): string[] {
  if (typeof input !== "string") return []
  const seen = new Set<string>()
  for (const raw of input.split(/[\n,;]+/)) {
    const email = raw.trim().toLowerCase()
    if (email && EMAIL_RE.test(email)) seen.add(email)
  }
  return Array.from(seen)
}

// GET: paginated, searchable list of suppressed emails + total count.
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = (searchParams.get("search") || "").trim()
  const page = Math.max(0, Number.parseInt(searchParams.get("page") || "0", 10) || 0)

  const supabase = createAdminClient()

  const buildQuery = (head: boolean) => {
    let q = supabase
      .from("dem_unsubscribes")
      // `bounce_type` serve in pagina: senza di esso la lista non dice QUALI
      // indirizzi sono davvero morti, e "ripulire la lista" resta un consiglio
      // non eseguibile.
      .select("id, email, campaign_id, reason, bounce_type, bounce_subtype, created_at", { count: "exact", head })
    if (search) {
      const safe = search.replace(/[(),]/g, " ").trim()
      if (safe) q = q.ilike("email", `%${safe}%`)
    }
    return q
  }

  const { count } = await buildQuery(true)
  const total = count || 0

  const from = page * PAGE_SIZE
  const { data, error } = await buildQuery(false)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    unsubscribes: data || [],
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

// POST: manually add one or more emails to the suppression list.
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const emails = parseEmails(body.emails)
  if (emails.length === 0) {
    return NextResponse.json({ error: "Nessun indirizzo email valido" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Add to the suppression list (idempotent on email).
  const { error: upsertError } = await supabase
    .from("dem_unsubscribes")
    .upsert(
      emails.map((email) => ({ email, reason: "manuale" })),
      { onConflict: "email" }
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Skip any pending/paused recipient rows for these emails right away.
  await supabase
    .from("dem_recipients")
    .update({ send_status: "unsubscribed" })
    .in("email", emails)
    .in("send_status", ["pending", "paused"])

  return NextResponse.json({ success: true, added: emails.length })
}

// DELETE: remove an email from the suppression list (re-subscribe).
export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const email = (searchParams.get("email") || "").trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: "Email mancante" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase.from("dem_unsubscribes").delete().eq("email", email)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Re-enable any recipient rows previously flagged as unsubscribed for this email.
  await supabase
    .from("dem_recipients")
    .update({ send_status: "pending" })
    .eq("email", email)
    .eq("send_status", "unsubscribed")

  return NextResponse.json({ success: true })
}
