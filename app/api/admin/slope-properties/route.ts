import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { enqueueSlopeUrls, processSlopeScanBatch, SLOPE_DEFAULT_BATCH_SIZE } from "@/lib/slope/catalog"

export const dynamic = "force-dynamic"
export const maxDuration = 180

async function authorize() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  if (!isSuperAdminEmail(user.email)) return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  return null
}

function cleanSearch(value: string | null): string {
  return (value || "").replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 100)
}

function csvCell(value: unknown): string {
  const raw = Array.isArray(value) ? value.join("; ") : value == null ? "" : String(value)
  const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows: Record<string, unknown>[]): string {
  const columns = [
    ["slope_id", "ID Slope"], ["name", "Struttura"], ["email", "Email"], ["emails", "Tutte le email"],
    ["pec", "PEC"], ["phone", "Telefono"], ["phones", "Tutti i telefoni"], ["website_url", "Sito web"],
    ["address", "Indirizzo"], ["postal_code", "CAP"], ["city", "Città"], ["province", "Provincia"],
    ["region", "Regione"], ["country", "Paese"], ["vat_number", "Partita IVA"], ["facebook_url", "Facebook"],
    ["instagram_url", "Instagram"], ["whatsapp_url", "WhatsApp"], ["latitude", "Latitudine"],
    ["longitude", "Longitudine"], ["booking_url", "Booking engine"], ["data_quality", "Completezza dati"],
    ["is_active", "Attivo"], ["last_checked_at", "Ultimo controllo"],
  ] as const
  return [
    columns.map(([, label]) => csvCell(label)).join(","),
    ...rows.map((row) => columns.map(([key]) => csvCell(row[key])).join(",")),
  ].join("\r\n")
}

export async function GET(request: NextRequest) {
  const denied = await authorize()
  if (denied) return denied

  const { searchParams } = request.nextUrl
  const q = cleanSearch(searchParams.get("q"))
  const contacts = searchParams.get("contacts") || "all"
  const status = searchParams.get("status") || "active"
  const sort = searchParams.get("sort") || "name"
  const exportCsv = searchParams.get("export") === "csv"
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
  const pageSize = exportCsv ? 5000 : Math.min(100, Math.max(10, Number.parseInt(searchParams.get("pageSize") || "50", 10) || 50))

  const admin = createAdminClient()
  let query = admin.from("slope_properties").select("*", { count: "exact" })
  if (q) query = query.ilike("search_text", `%${q}%`)
  if (status === "active") query = query.eq("is_active", true)
  if (status === "inactive") query = query.eq("is_active", false)
  if (contacts === "email") query = query.not("email", "is", null)
  if (contacts === "phone") query = query.not("phone", "is", null)
  if (contacts === "website") query = query.not("website_url", "is", null)
  if (contacts === "complete") query = query.not("email", "is", null).not("phone", "is", null).not("website_url", "is", null)
  if (sort === "quality") query = query.order("data_quality", { ascending: false }).order("name")
  else if (sort === "recent") query = query.order("last_checked_at", { ascending: false })
  else query = query.order("name", { ascending: true })
  if (exportCsv) query = query.limit(5000)
  else {
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)
  }

  const [rowsResult, stateResult, emailResult, phoneResult, websiteResult, queueResult, pendingResult, queueFailedResult] = await Promise.all([
    query,
    admin.from("slope_scan_state").select("*").eq("id", 1).single(),
    admin.from("slope_properties").select("slope_id", { count: "exact", head: true }).eq("is_active", true).not("email", "is", null),
    admin.from("slope_properties").select("slope_id", { count: "exact", head: true }).eq("is_active", true).not("phone", "is", null),
    admin.from("slope_properties").select("slope_id", { count: "exact", head: true }).eq("is_active", true).not("website_url", "is", null),
    admin.from("slope_scan_queue").select("slope_id", { count: "exact", head: true }),
    admin.from("slope_scan_queue").select("slope_id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
    admin.from("slope_scan_queue").select("slope_id", { count: "exact", head: true }).eq("status", "failed"),
  ])
  const error = rowsResult.error || stateResult.error || emailResult.error || phoneResult.error || websiteResult.error || queueResult.error || pendingResult.error || queueFailedResult.error
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (exportCsv) {
    const csv = `\uFEFF${toCsv((rowsResult.data || []) as Record<string, unknown>[])}`
    return new NextResponse(csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clienti-slope-${new Date().toISOString().slice(0, 10)}.csv"`,
    } })
  }

  const total = rowsResult.count || 0
  return NextResponse.json({
    rows: rowsResult.data || [], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    state: {
      ...stateResult.data,
      queue_total: queueResult.count || 0,
      pending_count: pendingResult.count || 0,
      queue_failed_count: queueFailedResult.count || 0,
    },
    stats: {
      found: stateResult.data?.found_count || 0,
      withEmail: emailResult.count || 0,
      withPhone: phoneResult.count || 0,
      withWebsite: websiteResult.count || 0,
    },
  })
}

export async function POST(request: NextRequest) {
  const denied = await authorize()
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = typeof body?.action === "string" ? body.action : ""
  const admin = createAdminClient()

  if (action === "add") {
    const rawInputs = Array.isArray(body?.urls) ? body.urls : typeof body?.urls === "string" ? body.urls.split(/[\s,;]+/) : []
    const inputs = rawInputs.filter((value: unknown): value is string => typeof value === "string").slice(0, 1000)
    try {
      const queued = await enqueueSlopeUrls(inputs, "superadmin")
      const result = queued.accepted ? await processSlopeScanBatch(Math.min(queued.accepted, SLOPE_DEFAULT_BATCH_SIZE)) : null
      return NextResponse.json({ ok: true, ...queued, result })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Impossibile aggiungere gli URL" }, { status: 500 })
    }
  }

  if (action === "start" || action === "pause") {
    const { data: current, error: readError } = await admin.from("slope_scan_state").select("version").eq("id", 1).single()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    const { data, error } = await admin
      .from("slope_scan_state")
      .update({ status: action === "start" ? "running" : "paused", last_error: action === "start" ? null : undefined, version: (current?.version || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", 1).eq("version", current?.version || 0).select("*").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, state: data })
  }

  if (action === "reset") {
    const now = new Date().toISOString()
    const { error: queueError } = await admin.from("slope_scan_queue").update({ status: "pending", attempts: 0, last_error: null, next_attempt_at: null, updated_at: now }).not("slope_id", "is", null)
    if (queueError) return NextResponse.json({ error: queueError.message }, { status: 500 })
    const { data: current, error: readError } = await admin.from("slope_scan_state").select("version").eq("id", 1).single()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    const { error } = await admin.from("slope_scan_state").update({
      status: "running", processed_count: 0, failed_count: 0, last_error: null, lock_token: null, lock_until: null,
      version: (current?.version || 0) + 1, updated_at: now,
    }).eq("id", 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === "scan") {
    try {
      return NextResponse.json({ ok: true, result: await processSlopeScanBatch(Number(body?.batchSize) || SLOPE_DEFAULT_BATCH_SIZE) })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Errore durante la scansione" }, { status: 500 })
    }
  }
  return NextResponse.json({ error: "Azione non valida" }, { status: 400 })
}
