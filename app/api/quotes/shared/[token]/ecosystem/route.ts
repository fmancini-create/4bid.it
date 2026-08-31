import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { calculateQuoteTotal, isQuoteLineSelected, type QuoteLineItem } from "@/lib/quotes/types"
import { dependencyErrors, getCommercialMeta } from "@/lib/quotes/commercial"
import { isEcosystemOffer, selectEcosystemOffer } from "@/lib/quotes/ecosystem"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dati non validi" }, { status: 400 })

  const lineId = String((body as Record<string, unknown>).line_id || "").trim()
  const selected = (body as Record<string, unknown>).selected === true
  if (!lineId) return NextResponse.json({ error: "Prodotto non valido" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("id,status,accepted_at,expires_at,expired_at,line_items")
    .eq("token", token)
    .maybeSingle()

  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (quote.status === "paid" || quote.accepted_at) return NextResponse.json({ error: "Il preventivo non è più modificabile" }, { status: 409 })
  if (quote.expired_at || (quote.expires_at && new Date(quote.expires_at) < new Date())) {
    return NextResponse.json({ error: "Il preventivo è scaduto" }, { status: 410 })
  }

  const current = Array.isArray(quote.line_items) ? quote.line_items as QuoteLineItem[] : []
  const target = current.find(item => item.id === lineId)
  if (!target || !target.optional || !isEcosystemOffer(target)) {
    return NextResponse.json({ error: "Questa voce non è una proposta Ecosistema modificabile" }, { status: 422 })
  }

  let next = current.map(item => item.id === lineId ? selectEcosystemOffer(item, selected) : item)

  if (selected) {
    const dependency = getCommercialMeta(target).dependency
    if (dependency?.requires_base) {
      const project = dependency.project || target.project
      const base = next.find(item => item.project === project && item.kind === "plan")
      if (!base) {
        return NextResponse.json({
          error: `Per aggiungere ${target.name || target.description} serve prima il piano base ${project || "collegato"}.`,
          code: "MISSING_BASE_PRODUCT",
        }, { status: 422 })
      }
      if (isEcosystemOffer(base)) {
        next = next.map(item => item.id === base.id ? selectEcosystemOffer(item, true) : item)
      }
    }
  } else if (target.kind === "plan" && target.project) {
    next = next.map(item => {
      if (!isEcosystemOffer(item) || item.project !== target.project || item.kind !== "module") return item
      const dependency = getCommercialMeta(item).dependency
      return dependency?.requires_base ? selectEcosystemOffer(item, false) : item
    })
  }

  const active = next.filter(isQuoteLineSelected)
  const dependencies = dependencyErrors(active)
  if (dependencies.length) {
    return NextResponse.json({ error: dependencies[0], dependency_errors: dependencies }, { status: 422 })
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("sales_channel_quotes")
    .update({ line_items: next, total_amount: calculateQuoteTotal(next), updated_at: now })
    .eq("id", quote.id)
    .is("accepted_at", null)

  if (updateError) return NextResponse.json({ error: "Impossibile aggiornare il preventivo" }, { status: 500 })

  return NextResponse.json({
    success: true,
    selected,
    total_amount: calculateQuoteTotal(next),
    selected_item_ids: next.filter(isQuoteLineSelected).map(item => item.id).filter(Boolean),
  })
}
