import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { nanoid } from "nanoid"

// GET /api/ecomobility/admin/recover-operator?slug=villa-i-barronci&secret=...
// Endpoint diagnostico: verifica gli operatori della struttura e genera un
// link di reset utilizzabile direttamente (utile se l'email non arriva).
// Auth: SUPABASE_SERVICE_ROLE_KEY come secret query param (gia' env var).
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")
  const secret = url.searchParams.get("secret")
  const generate = url.searchParams.get("generate") // operator id opzionale

  if (!secret || secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: structure, error: structErr } = await supabase
    .from("ecomobility_structures")
    .select("id, name, slug")
    .eq("slug", slug)
    .single()

  if (structErr || !structure) {
    return NextResponse.json({ error: "structure not found", details: structErr?.message }, { status: 404 })
  }

  const { data: operators, error: opErr } = await supabase
    .from("ecomobility_operators")
    .select("id, email, name, role, is_active, created_at")
    .eq("structure_id", structure.id)
    .order("created_at", { ascending: false })

  if (opErr) {
    return NextResponse.json({ error: "operators query failed", details: opErr.message }, { status: 500 })
  }

  // Se richiesto, genera link reset diretto
  let resetLink: string | null = null
  let generatedFor: string | null = null
  if (generate && operators?.some((o) => o.id === generate)) {
    const token = nanoid(48)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error: tokErr } = await supabase.from("ecomobility_operator_password_tokens").insert({
      token,
      operator_id: generate,
      type: "reset",
      expires_at: expiresAt,
    })
    if (tokErr) {
      return NextResponse.json({ error: "token insert failed", details: tokErr.message }, { status: 500 })
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || request.headers.get("host")}`
    resetLink = `${baseUrl}/ecomobility/${structure.slug}/admin/reset-password?token=${token}`
    generatedFor = generate
  }

  return NextResponse.json({
    structure,
    operatorsCount: operators?.length || 0,
    operators,
    resetLink,
    generatedFor,
    hint: resetLink
      ? "Apri resetLink in un browser per impostare la nuova password (24h validita')."
      : "Per generare un link reset diretto, aggiungi &generate=OPERATOR_ID alla query.",
  })
}
