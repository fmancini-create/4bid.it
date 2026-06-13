import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { fetchAllNews, hashUrl } from "@/lib/press/google-news"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

/** Verifica che la richiesta provenga dal super admin loggato. */
async function assertSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return Boolean(user && user.email === SUPER_ADMIN_EMAIL)
}

// GET: elenco menzioni filtrabile per stato (?status=pending|approved|rejected|all)
export async function GET(request: Request) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "pending"

  const admin = createAdminClient()

  // Conteggio leggero per il badge in navigazione (?count=1)
  if (searchParams.get("count")) {
    const { count, error } = await admin
      .from("press_mentions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ pending: count || 0 })
  }

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

// PATCH: modera una menzione { id, action: "approve" | "reject" | "delete" }
export async function PATCH(request: Request) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const id = body?.id as string | undefined
  const action = body?.action as string | undefined

  if (!id || !action || !["approve", "reject", "delete"].includes(action)) {
    return NextResponse.json({ error: "Parametri non validi" }, { status: 400 })
  }

  const admin = createAdminClient()

  if (action === "delete") {
    const { error } = await admin.from("press_mentions").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const status = action === "approve" ? "approved" : "rejected"
  const { error } = await admin
    .from("press_mentions")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// POST: esegue subito la ricerca su Google News e salva i nuovi risultati come "pending"
export async function POST() {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  try {
    const { items } = await fetchAllNews()
    let inserted = 0
    const seen = new Set<string>()

    for (const item of items) {
      const url_hash = hashUrl(item.url)
      if (seen.has(url_hash)) continue
      seen.add(url_hash)

      const { error } = await admin.from("press_mentions").insert({
        title: item.title,
        url: item.url,
        source: item.source,
        snippet: item.snippet,
        keyword: item.keyword,
        published_at: item.publishedAt,
        status: "pending",
        url_hash,
      })
      // 23505 = unique_violation -> notizia già presente, la ignoriamo
      if (!error) inserted++
    }

    return NextResponse.json({ success: true, found: items.length, inserted })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore durante la ricerca" },
      { status: 500 },
    )
  }
}
