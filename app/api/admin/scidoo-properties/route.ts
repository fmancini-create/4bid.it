import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { processScidooScanBatch, SCIDOO_DEFAULT_BATCH_SIZE } from "@/lib/scidoo/catalog"

export const dynamic = "force-dynamic"
export const maxDuration = 180

async function authorize() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  if (!isSuperAdminEmail(user.email)) return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  return null
}

function cleanSearch(value: string | null): string {
  return (value || "")
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 100)
}

function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value)
  // Impedisce a Excel/Sheets di interpretare recapiti e nomi come formule.
  const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows: Record<string, unknown>[]): string {
  const columns = [
    ["scidoo_code", "Codice Scidoo"],
    ["name", "Struttura"],
    ["email", "Email"],
    ["emails", "Tutte le email"],
    ["phone", "Telefono"],
    ["phones", "Tutti i telefoni"],
    ["website_url", "Sito web"],
    ["address", "Indirizzo"],
    ["postal_code", "CAP"],
    ["city", "Citta"],
    ["province", "Provincia"],
    ["region", "Regione"],
    ["country", "Paese"],
    ["facebook_url", "Facebook"],
    ["instagram_url", "Instagram"],
    ["whatsapp_url", "WhatsApp"],
    ["booking_url", "Booking engine"],
    ["data_quality", "Completezza dati"],
    ["is_active", "Attivo"],
    ["last_checked_at", "Ultimo controllo"],
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
  const sort = searchParams.get("sort") || "code"
  const exportCsv = searchParams.get("export") === "csv"
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
  const pageSize = exportCsv
    ? 5000
    : Math.min(100, Math.max(10, Number.parseInt(searchParams.get("pageSize") || "50", 10) || 50))

  const admin = createAdminClient()
  let query = admin.from("scidoo_properties").select("*", { count: "exact" })
  if (q) query = query.ilike("search_text", `%${q}%`)
  if (status === "active") query = query.eq("is_active", true)
  if (status === "inactive") query = query.eq("is_active", false)
  if (contacts === "email") query = query.not("email", "is", null)
  if (contacts === "phone") query = query.not("phone", "is", null)
  if (contacts === "website") query = query.not("website_url", "is", null)
  if (contacts === "complete") {
    query = query.not("email", "is", null).not("phone", "is", null).not("website_url", "is", null)
  }

  if (sort === "name") query = query.order("name", { ascending: true })
  else if (sort === "quality") query = query.order("data_quality", { ascending: false }).order("scidoo_code")
  else query = query.order("scidoo_code", { ascending: true })

  if (!exportCsv) {
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)
  } else {
    query = query.limit(5000)
  }

  const [rowsResult, stateResult, emailResult, phoneResult, websiteResult] = await Promise.all([
    query,
    admin.from("scidoo_scan_state").select("*").eq("id", 1).single(),
    admin
      .from("scidoo_properties")
      .select("scidoo_code", { count: "exact", head: true })
      .eq("is_active", true)
      .not("email", "is", null),
    admin
      .from("scidoo_properties")
      .select("scidoo_code", { count: "exact", head: true })
      .eq("is_active", true)
      .not("phone", "is", null),
    admin
      .from("scidoo_properties")
      .select("scidoo_code", { count: "exact", head: true })
      .eq("is_active", true)
      .not("website_url", "is", null),
  ])

  const error = rowsResult.error || stateResult.error || emailResult.error || phoneResult.error || websiteResult.error
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (exportCsv) {
    const csv = `\uFEFF${toCsv((rowsResult.data || []) as Record<string, unknown>[])}`
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="clienti-scidoo-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const total = rowsResult.count || 0
  return NextResponse.json({
    rows: rowsResult.data || [],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    state: stateResult.data,
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

  if (action === "start") {
    const { data: current, error: readError } = await admin
      .from("scidoo_scan_state")
      .select("version")
      .eq("id", 1)
      .single()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

    const { data, error } = await admin
      .from("scidoo_scan_state")
      .update({
        status: "running",
        last_error: null,
        version: (current?.version || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .eq("version", current?.version || 0)
      .select("*")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, state: data })
  }

  if (action === "pause") {
    const { data: current, error: readError } = await admin
      .from("scidoo_scan_state")
      .select("version")
      .eq("id", 1)
      .single()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

    const { data, error } = await admin
      .from("scidoo_scan_state")
      .update({
        status: "paused",
        version: (current?.version || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .eq("version", current?.version || 0)
      .select("*")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, state: data })
  }

  if (action === "reset") {
    const { data: current, error: readError } = await admin
      .from("scidoo_scan_state")
      .select("version")
      .eq("id", 1)
      .single()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

    const { data, error } = await admin
      .from("scidoo_scan_state")
      .update({
        next_code: 1,
        scanned_count: 0,
        failed_count: 0,
        status: "running",
        last_error: null,
        lock_token: null,
        lock_until: null,
        version: (current?.version || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select("*")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, state: data })
  }

  if (action === "scan") {
    try {
      const result = await processScidooScanBatch(Number(body?.batchSize) || SCIDOO_DEFAULT_BATCH_SIZE)
      return NextResponse.json({ ok: true, result })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Errore durante la scansione" },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({ error: "Azione non valida" }, { status: 400 })
}
