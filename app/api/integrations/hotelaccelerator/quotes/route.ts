import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { authorizeHotelAccelerator } from "@/lib/quotes/integration-auth"
import { dependencyErrors } from "@/lib/quotes/commercial"
import { ensureDependentServiceLines } from "@/lib/quotes/dependent-lines"
import { calculateQuoteLine, calculateQuoteTotal, type QuoteLineItem } from "@/lib/quotes/types"
import { mergeContractTerms, parseContractTerms, quoteTermsProjects } from "@/lib/quotes/terms"
import { fetchContractTerms } from "@/lib/quotes/terms-fetch"

const SOURCE_SYSTEM = "hotelaccelerator"
const EDITABLE_FIELDS = [
  "client_name", "client_company", "client_email", "client_vat", "client_address",
  "title", "description", "payment_terms", "deposit_amount", "vat_included", "currency",
  "requested_fields", "expires_at", "presentation_mode", "comparison_tables",
] as const
const FROZEN_AFTER_ACCEPTANCE = ["line_items", "payment_terms", "deposit_amount", "vat_included", "currency", "expires_at", "requested_fields"] as const

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
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
    return `${item.name || item.description}: la fascia selezionata e' valida per ${range} operatori, ma la quantita impostata e' ${quantity}.`
  }
  return null
}

function normalizeLines(raw: unknown): { lines: QuoteLineItem[]; error?: string } {
  const incoming = Array.isArray(raw) ? raw as QuoteLineItem[] : []
  const lines = ensureDependentServiceLines(incoming.map((item) => calculateQuoteLine({
    ...item,
    id: item.id || randomUUID(),
    catalog_snapshot: item.catalog_snapshot ?? {},
  })))
  const dependencies = dependencyErrors(lines)
  if (dependencies.length) return { lines, error: dependencies[0] }
  for (const item of lines) {
    const tierError = validateTieredQuantity(item)
    if (tierError) return { lines, error: tierError }
  }
  return { lines }
}

function publicUrl(token: string | null | undefined) {
  if (!token) return null
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it").replace(/\/$/, "")
  return `${base}/preventivo/${token}`
}

function responseQuote(quote: Record<string, any>) {
  return {
    id: quote.id,
    quote_number: quote.quote_number,
    client_name: quote.client_name,
    client_company: quote.client_company,
    client_email: quote.client_email,
    title: quote.title,
    description: quote.description,
    line_items: quote.line_items,
    total_amount: quote.total_amount,
    deposit_amount: quote.deposit_amount,
    vat_included: quote.vat_included,
    currency: quote.currency,
    payment_terms: quote.payment_terms,
    presentation_mode: quote.presentation_mode,
    requested_fields: quote.requested_fields,
    status: quote.status,
    payment_status: quote.payment_status,
    accepted_at: quote.accepted_at,
    paid_at: quote.paid_at,
    sent_at: quote.sent_at,
    expires_at: quote.expires_at,
    source_record_id: quote.source_record_id,
    source_parent_id: quote.source_parent_id,
    public_url: publicUrl(quote.token),
    updated_at: quote.updated_at,
  }
}

function authError(request: NextRequest) {
  const auth = authorizeHotelAccelerator(request)
  return auth.ok ? null : NextResponse.json({ error: auth.error }, { status: auth.status })
}

export async function GET(request: NextRequest) {
  const denied = authError(request)
  if (denied) return denied

  const url = new URL(request.url)
  const quoteId = url.searchParams.get("id")
  const sourceRecordId = url.searchParams.get("source_record_id")
  const sourceParentId = url.searchParams.get("source_parent_id")
  if (!quoteId && !sourceRecordId && !sourceParentId) {
    return NextResponse.json({ error: "Specificare id, source_record_id o source_parent_id" }, { status: 400 })
  }

  const supabase = createAdminClient()
  let query = supabase.from("sales_channel_quotes").select("*").eq("source_system", SOURCE_SYSTEM)
  if (quoteId) query = query.eq("id", quoteId)
  if (sourceRecordId) query = query.eq("source_record_id", sourceRecordId)
  if (sourceParentId) query = query.eq("source_parent_id", sourceParentId)

  const { data, error } = await query.order("created_at", { ascending: false }).limit(sourceParentId ? 50 : 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  const quotes = data.map((row) => responseQuote(row as Record<string, any>))
  return NextResponse.json(sourceParentId ? { quotes } : { quote: quotes[0] })
}

export async function POST(request: NextRequest) {
  const denied = authError(request)
  if (denied) return denied

  const body = await request.json().catch(() => null) as Record<string, any> | null
  if (!body) return NextResponse.json({ error: "Payload non valido" }, { status: 400 })
  const sourceRecordId = String(body.source_record_id || "").trim()
  const sourceParentId = String(body.source_parent_id || "").trim()
  if (!sourceRecordId || !sourceParentId) {
    return NextResponse.json({ error: "source_record_id e source_parent_id sono obbligatori" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: existing } = await supabase.from("sales_channel_quotes")
    .select("*")
    .eq("source_system", SOURCE_SYSTEM)
    .eq("source_record_id", sourceRecordId)
    .maybeSingle()
  if (existing) return NextResponse.json({ quote: responseQuote(existing as Record<string, any>), idempotent: true })

  const normalized = normalizeLines(body.line_items)
  if (normalized.error) return NextResponse.json({ error: normalized.error }, { status: 422 })

  const requestedExpiry = body.expires_at ? new Date(String(body.expires_at)) : null
  if (requestedExpiry && (Number.isNaN(requestedExpiry.getTime()) || requestedExpiry.getTime() <= Date.now())) {
    return NextResponse.json({ error: "La scadenza del preventivo deve essere futura" }, { status: 400 })
  }
  const expiresAt = requestedExpiry?.toISOString() ?? new Date(Date.now() + 7 * 86400000).toISOString()

  let quoteNumber: string | null = null
  const { data: numData } = await supabase.rpc("next_quote_number")
  if (typeof numData === "string") quoteNumber = numData

  const contractTerms = await fetchContractTerms(quoteTermsProjects(normalized.lines))
  const presentationMode = body.presentation_mode === "virtual" ? "virtual" : "classic"
  const actorName = typeof body.actor_name === "string" ? body.actor_name.trim() : ""
  const actorEmail = typeof body.actor_email === "string" ? body.actor_email.trim() : ""

  const insert = {
    quote_number: quoteNumber,
    client_name: body.client_name ?? "",
    client_company: body.client_company ?? null,
    client_email: body.client_email ?? null,
    client_vat: body.client_vat ?? null,
    client_address: body.client_address ?? null,
    title: body.title || "Soluzioni e servizi 4Bid",
    description: body.description ?? null,
    payment_terms: body.payment_terms ?? null,
    line_items: normalized.lines,
    total_amount: calculateQuoteTotal(normalized.lines),
    deposit_amount: body.deposit_amount ?? null,
    vat_included: body.vat_included ?? true,
    currency: body.currency || "eur",
    requested_fields: Array.isArray(body.requested_fields) ? body.requested_fields : [],
    comparison_tables: body.comparison_tables ?? null,
    expires_at: expiresAt,
    presentation_mode: presentationMode,
    status: "draft",
    provisioning_status: "not_required",
    token: randomUUID(),
    contract_terms: contractTerms,
    created_by_name: actorName || null,
    source_system: SOURCE_SYSTEM,
    source_record_id: sourceRecordId,
    source_parent_id: sourceParentId,
    source_metadata: {
      actor_name: actorName || null,
      actor_email: actorEmail || null,
      actor_user_id: body.actor_user_id || null,
      actor_role: body.actor_role || null,
    },
  }

  const { data, error } = await supabase.from("sales_channel_quotes").insert(insert).select("*").single()
  if (error || !data) return NextResponse.json({ error: error?.message || "Errore creazione preventivo" }, { status: 500 })
  return NextResponse.json({ quote: responseQuote(data as Record<string, any>) }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const denied = authError(request)
  if (denied) return denied

  const body = await request.json().catch(() => null) as Record<string, any> | null
  if (!body?.quote_id) return NextResponse.json({ error: "quote_id obbligatorio" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: current, error: readError } = await supabase.from("sales_channel_quotes")
    .select("*")
    .eq("id", body.quote_id)
    .eq("source_system", SOURCE_SYSTEM)
    .single()
  if (readError || !current) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (current.status === "paid") return NextResponse.json({ error: "Un preventivo pagato non puo essere modificato" }, { status: 409 })

  const accepted = current.status === "accepted" || Boolean(current.accepted_at)
  if (accepted) {
    const blocked = FROZEN_AFTER_ACCEPTANCE.filter((key) => key in body)
    if (blocked.length) {
      return NextResponse.json({ error: "Il preventivo e' gia stato accettato: voci economiche e condizioni sono congelate", frozen_fields: blocked }, { status: 409 })
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of EDITABLE_FIELDS) if (key in body) update[key] = body[key]

  if ("presentation_mode" in body && body.presentation_mode !== "classic" && body.presentation_mode !== "virtual") {
    return NextResponse.json({ error: "Modalita preventivo non valida" }, { status: 400 })
  }
  if ("expires_at" in body && body.expires_at) {
    const expiry = new Date(String(body.expires_at))
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) return NextResponse.json({ error: "La scadenza deve essere futura" }, { status: 400 })
    update.expires_at = expiry.toISOString()
  }

  if (Array.isArray(body.line_items)) {
    const normalized = normalizeLines(body.line_items)
    if (normalized.error) return NextResponse.json({ error: normalized.error }, { status: 422 })
    update.line_items = normalized.lines
    update.total_amount = calculateQuoteTotal(normalized.lines)
    const fresh = await fetchContractTerms(quoteTermsProjects(normalized.lines))
    update.contract_terms = mergeContractTerms(parseContractTerms(current.contract_terms), fresh)
  }

  const { data, error } = await supabase.from("sales_channel_quotes").update(update).eq("id", current.id).select("*").single()
  if (error || !data) return NextResponse.json({ error: error?.message || "Errore aggiornamento" }, { status: 500 })
  return NextResponse.json({ quote: responseQuote(data as Record<string, any>) })
}
