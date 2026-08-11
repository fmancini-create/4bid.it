import { randomUUID } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteLine, calculateQuoteTotal, type QuoteLineItem } from "@/lib/quotes/types"
import { dependencyErrors } from "@/lib/quotes/commercial"
import { mergeContractTerms, parseContractTerms, quoteTermsProjects } from "@/lib/quotes/terms"
import { fetchContractTerms } from "@/lib/quotes/terms-fetch"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("sales_channel_quotes").select("*").eq("id", id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

const EDITABLE_FIELDS = [
  "client_name", "client_company", "client_email", "client_vat", "client_address",
  "title", "description", "payment_terms", "deposit_amount", "vat_included", "currency",
  "requested_fields", "expires_at",
  // Tabelle comparative: materiale di posizionamento, non parte dell'accordo
  // economico -> restano modificabili anche dopo l'accettazione.
  "comparison_tables",
] as const

/**
 * Dopo l'accettazione questi elementi sono l'accordo firmato dal cliente:
 * restano leggibili ma non modificabili. Le correzioni di contatto (email,
 * indirizzo, titolo) restano permesse perche' non cambiano cio' che e' stato
 * accettato.
 */
const FROZEN_AFTER_ACCEPTANCE = ["payment_terms", "deposit_amount", "vat_included", "currency", "expires_at", "requested_fields"] as const

/** Confronto per valore: un salvataggio che rimanda gli stessi dati non e' una modifica. */
function changed(before: unknown, after: unknown) {
  return JSON.stringify(before ?? null) !== JSON.stringify(after ?? null)
}

/** Solo cio' che incide sull'accordo economico: l'ordine delle voci non conta. */
function economicShape(items: unknown) {
  if (!Array.isArray(items)) return []
  return items
    .map((item: QuoteLineItem) => ({
      id: item?.id ?? null, name: item?.name ?? null, quantity: item?.quantity ?? null,
      unit_amount: item?.unit_amount ?? null, amount: item?.amount ?? null,
      billing_period: item?.billing_period ?? null, optional: item?.optional ?? null,
      customer_selected: item?.customer_selected ?? null, discount: item?.discount ?? null,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const { data: current, error: readError } = await supabase
    .from("sales_channel_quotes")
    .select("status, accepted_at, line_items, contract_terms, payment_terms, deposit_amount, vat_included, currency, expires_at, requested_fields")
    .eq("id", id).single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 })
  if (current.status === "paid") return NextResponse.json({ error: "Un preventivo pagato è congelato e non può essere modificato" }, { status: 409 })

  const accepted = !!current.accepted_at
  if (accepted) {
    const blocked = FROZEN_AFTER_ACCEPTANCE.filter(key => key in body && changed((current as Record<string, unknown>)[key], body[key]))
    if (Array.isArray(body.line_items) && changed(economicShape(current.line_items), economicShape(body.line_items))) blocked.push("line_items" as never)
    if (blocked.length) {
      return NextResponse.json({
        error: "Il preventivo è già stato accettato dal cliente: voci, importi e condizioni sono congelati. Per cambiarli emetti un nuovo preventivo.",
        frozen_fields: blocked,
      }, { status: 409 })
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of EDITABLE_FIELDS) if (key in body) update[key] = body[key]

  if ("expires_at" in body && body.expires_at) {
    const expiry = new Date(String(body.expires_at))
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) return NextResponse.json({ error: "La scadenza deve essere una data futura" }, { status: 400 })
    update.expires_at = expiry.toISOString()
  }

  if (Array.isArray(body.line_items)) {
    const lines = body.line_items.map((item: QuoteLineItem) => calculateQuoteLine({ ...item, id: item.id || randomUUID(), catalog_snapshot: item.catalog_snapshot ?? {} }))
    const dependencies = dependencyErrors(lines)
    if (dependencies.length) return NextResponse.json({ error: dependencies[0], dependency_errors: dependencies }, { status: 422 })
    update.line_items = lines
    update.total_amount = calculateQuoteTotal(lines)
    // Cambiando i prodotti cambiano i progetti coinvolti: le condizioni li seguono.
    if (!accepted) {
      const fresh = await fetchContractTerms(quoteTermsProjects(lines))
      update.contract_terms = mergeContractTerms(parseContractTerms(current.contract_terms), fresh)
    }
  }

  const { data, error } = await supabase.from("sales_channel_quotes").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: current } = await supabase.from("sales_channel_quotes").select("status").eq("id", id).single()
  if (current?.status === "paid") return NextResponse.json({ error: "Un preventivo pagato non può essere eliminato" }, { status: 409 })
  const { error } = await supabase.from("sales_channel_quotes").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
