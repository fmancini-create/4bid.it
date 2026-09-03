import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { createClient } from "@/lib/supabase/server"
import { dependencyErrors } from "@/lib/quotes/commercial"
import { calculateQuoteLine, calculateQuoteTotal, type QuoteLineItem } from "@/lib/quotes/types"
import { quoteTermsProjects } from "@/lib/quotes/terms"
import { fetchContractTerms } from "@/lib/quotes/terms-fetch"

const MAX_AI_NOTES = 2000

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeAiImportantNotes(value: unknown): string | null {
  if (typeof value !== "string") return null
  const note = value.trim().slice(0, MAX_AI_NOTES)
  return note || null
}

function validateTieredQuantity(item: QuoteLineItem): string | null {
  const config = objectValue(item.configuration)
  if (config.pricing_model !== "tiered_per_seat") return null
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const min = Math.max(1, Number(config.min_quantity) || 1)
  const rawMax = config.max_quantity
  const max = rawMax == null || rawMax === "" ? null : Math.max(min, Number(rawMax) || min)
  if (quantity < min || (max != null && quantity > max)) {
    const range = max == null ? `${min}+` : min === max ? `${min}` : `${min}-${max}`
    return `${item.name || item.description}: la fascia selezionata è valida per ${range} operatori, ma la quantità impostata è ${quantity}.`
  }
  return null
}

function presentationMode(request: NextRequest, body: Record<string, unknown>): "classic" | "virtual" {
  if (body.presentation_mode === "virtual") return "virtual"
  if (body.presentation_mode === "classic") return "classic"
  const fromCookie = request.cookies.get("quote_presentation_mode")?.value
  return fromCookie === "virtual" ? "virtual" : "classic"
}

async function quoteCreatorSnapshot(admin: ReturnType<typeof createAdminClient>) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user?.id) return { created_by_user_id: null, created_by_name: null, created_by_last_name: null }

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle<{ first_name?: string | null; last_name?: string | null; email?: string | null }>()

    const firstName = (profile?.first_name || "").trim()
    const lastName = (profile?.last_name || "").trim()
    const metadataName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim()
    const profileName = [firstName, lastName].filter(Boolean).join(" ").trim()
    const fallbackEmail = profile?.email || user.email || ""
    const fallbackName = fallbackEmail.includes("@") ? fallbackEmail.split("@")[0] : fallbackEmail

    return {
      created_by_user_id: user.id,
      created_by_name: profileName || metadataName || fallbackName || null,
      created_by_last_name: lastName || null,
    }
  } catch (error) {
    console.error("[quotes] creator snapshot error:", error)
    return { created_by_user_id: null, created_by_name: null, created_by_last_name: null }
  }
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json() as Record<string, any>

  let quoteNumber: string | null = null
  const { data: numData, error: numError } = await supabase.rpc("next_quote_number")
  if (numError) console.error("[quotes] next_quote_number error:", numError)
  else if (typeof numData === "string") quoteNumber = numData

  const lineItems = (Array.isArray(body.line_items) ? body.line_items : [])
    .map((item: QuoteLineItem) => calculateQuoteLine({
      ...item,
      id: item.id || randomUUID(),
      catalog_snapshot: item.catalog_snapshot ?? {},
    }))

  const dependencyProblems = dependencyErrors(lineItems)
  if (dependencyProblems.length) {
    return NextResponse.json({ error: dependencyProblems[0], code: "INVALID_PRODUCT_DEPENDENCY" }, { status: 422 })
  }
  for (const item of lineItems) {
    const tierError = validateTieredQuantity(item)
    if (tierError) return NextResponse.json({ error: tierError, code: "INVALID_TIER_QUANTITY" }, { status: 422 })
  }

  const requestedExpiry = body.expires_at ? new Date(String(body.expires_at)) : null
  if (requestedExpiry && Number.isNaN(requestedExpiry.getTime())) {
    return NextResponse.json({ error: "Data di validità non valida" }, { status: 400 })
  }
  if (requestedExpiry && requestedExpiry.getTime() <= Date.now()) {
    return NextResponse.json({ error: "La scadenza del preventivo deve essere futura" }, { status: 400 })
  }
  const expiresAt = requestedExpiry?.toISOString() ?? new Date(Date.now() + 7 * 86400000).toISOString()

  const contractTerms = await fetchContractTerms(quoteTermsProjects(lineItems))
  const creator = await quoteCreatorSnapshot(supabase)

  const CHIAVI_FATTURAZIONE = ["company", "vat", "tax_code", "address", "zip", "city", "province", "sdi_code", "pec", "reference"] as const
  const billingIn = body.billing_details && typeof body.billing_details === "object" && !Array.isArray(body.billing_details)
    ? (body.billing_details as Record<string, unknown>)
    : null
  const billingDetails = billingIn
    ? Object.fromEntries(
        CHIAVI_FATTURAZIONE
          .map(k => [k, typeof billingIn[k] === "string" ? (billingIn[k] as string).trim() : ""])
          .filter(([, v]) => v !== ""),
      )
    : {}

  const insert = {
    ...creator,
    contract_terms: contractTerms,
    billing_details: billingDetails,
    quote_number: quoteNumber,
    client_name: body.client_name ?? "",
    client_company: body.client_company ?? null,
    client_email: body.client_email ?? null,
    client_vat: body.client_vat ?? null,
    client_address: body.client_address ?? null,
    title: body.title || "Soluzioni e servizi 4Bid",
    description: body.description ?? null,
    ai_important_notes: normalizeAiImportantNotes(body.ai_important_notes),
    payment_terms: body.payment_terms ?? null,
    line_items: lineItems,
    total_amount: calculateQuoteTotal(lineItems),
    deposit_amount: body.deposit_amount ?? null,
    vat_included: body.vat_included ?? true,
    currency: body.currency || "eur",
    requested_fields: Array.isArray(body.requested_fields) ? body.requested_fields : [],
    expires_at: expiresAt,
    presentation_mode: presentationMode(request, body),
    status: "draft",
    provisioning_status: "not_required",
    token: randomUUID(),
  }

  const { data, error } = await supabase.from("sales_channel_quotes").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}