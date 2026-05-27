import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

// GET /api/ecomobility/admin/recover-operator?slug=villa-i-barronci&secret=...
//   Lista operatori della struttura.
// GET ...&generate=OPERATOR_ID
//   Genera link reset password diretto (24h).
// GET ...&createEmail=foo@bar&createName=Mario&createRole=admin
//   Se l'operatore non esiste, lo crea con password placeholder e genera link invite.
// Auth: SUPABASE_SERVICE_ROLE_KEY come secret query param.
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")
  const secret = url.searchParams.get("secret")
  const generate = url.searchParams.get("generate") // operator id opzionale
  const createEmail = url.searchParams.get("createEmail")
  const createName = url.searchParams.get("createName")
  const createRole = url.searchParams.get("createRole") || "operator"

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

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || request.headers.get("host")}`

  let resetLink: string | null = null
  let generatedFor: string | null = null
  let createdOperator: any = null

  // Branch 1: crea operatore se non esiste e genera link invite
  if (createEmail) {
    const normEmail = createEmail.toLowerCase().trim()
    const existing = operators?.find((o) => o.email === normEmail)
    if (existing) {
      // Esiste gia': genera reset
      generatedFor = existing.id
    } else {
      const placeholderHash = await bcrypt.hash(nanoid(32), 10)
      const { data: newOp, error: createErr } = await supabase
        .from("ecomobility_operators")
        .insert({
          structure_id: structure.id,
          email: normEmail,
          name: createName || normEmail.split("@")[0],
          role: createRole,
          password_hash: placeholderHash,
          is_active: true,
        })
        .select("id, email, name, role, is_active, created_at")
        .single()
      if (createErr || !newOp) {
        return NextResponse.json(
          { error: "create operator failed", details: createErr?.message },
          { status: 500 },
        )
      }
      createdOperator = newOp
      generatedFor = newOp.id
    }
  }

  // Branch 2: generate esplicito da query param
  if (!generatedFor && generate && operators?.some((o) => o.id === generate)) {
    generatedFor = generate
  }

  if (generatedFor) {
    const token = nanoid(48)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error: tokErr } = await supabase.from("ecomobility_operator_password_tokens").insert({
      token,
      operator_id: generatedFor,
      type: createdOperator ? "invite" : "reset",
      expires_at: expiresAt,
    })
    if (tokErr) {
      return NextResponse.json({ error: "token insert failed", details: tokErr.message }, { status: 500 })
    }
    resetLink = `${baseUrl}/ecomobility/${structure.slug}/admin/reset-password?token=${token}`
  }

  return NextResponse.json({
    structure,
    operatorsCount: operators?.length || 0,
    operators,
    createdOperator,
    resetLink,
    generatedFor,
    hint: resetLink
      ? "Apri resetLink in un browser per impostare la password (24h validita')."
      : "Per creare un operatore al volo: aggiungi &createEmail=mail@domain.tld&createName=NomeCognome&createRole=admin. Per generare link reset di un operatore esistente: &generate=OPERATOR_ID.",
  })
}
