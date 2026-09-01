import { randomUUID } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getFederatedCatalog } from "@/lib/quotes/catalog"
import { calculateQuoteTotal, isQuoteLineSelected, type QuoteLineItem } from "@/lib/quotes/types"
import { dependencyErrors, getCommercialMeta } from "@/lib/quotes/commercial"
import { isEcosystemOffer, selectEcosystemOffer } from "@/lib/quotes/ecosystem"
import { buildEcosystemCatalogLine, canonicalEcosystemCatalogItems, catalogFamily, quoteLineFamily } from "@/lib/quotes/ecosystem-catalog"
import { mergeContractTerms, parseContractTerms, quoteTermsProjects } from "@/lib/quotes/terms"
import { fetchContractTerms } from "@/lib/quotes/terms-fetch"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dati non validi" }, { status: 400 })

  const input = body as Record<string, unknown>
  const lineId = String(input.line_id || "").trim()
  const catalogItemId = String(input.catalog_item_id || "").trim()
  const requestedProject = String(input.project || "").trim()
  const requestedSelected = input.selected === true
  if (!lineId && !catalogItemId) return NextResponse.json({ error: "Prodotto non valido" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("id,status,accepted_at,expires_at,expired_at,updated_at,line_items,contract_terms")
    .eq("token", token)
    .maybeSingle()

  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (quote.status === "paid" || quote.status === "accepted" || quote.accepted_at) {
    return NextResponse.json({ error: "Il preventivo non è più modificabile" }, { status: 409 })
  }
  if (quote.expired_at || (quote.expires_at && new Date(quote.expires_at) < new Date())) {
    return NextResponse.json({ error: "Il preventivo è scaduto" }, { status: 410 })
  }

  const current = Array.isArray(quote.line_items) ? quote.line_items as QuoteLineItem[] : []
  let next = [...current]
  let target: QuoteLineItem | undefined
  let selected = requestedSelected

  if (catalogItemId) {
    selected = true
    let catalog
    try {
      catalog = await getFederatedCatalog()
    } catch {
      return NextResponse.json({ error: "Catalogo 4BID temporaneamente non disponibile" }, { status: 503 })
    }

    const candidates = canonicalEcosystemCatalogItems(catalog)
    const item = candidates.find(candidate => candidate.id === catalogItemId && (!requestedProject || candidate.project === requestedProject))
    if (!item) return NextResponse.json({ error: "Questa soluzione non è disponibile per l'aggiunta online" }, { status: 422 })

    const family = catalogFamily(item)
    const existing = current.find(line => line.project === item.project && quoteLineFamily(line) === family)
    if (existing && !isEcosystemOffer(existing)) {
      return NextResponse.json({ error: `${existing.name || "Questa soluzione"} è già inclusa nel preventivo.` }, { status: 422 })
    }

    if (existing) {
      target = existing
      next = current.map(line => line.id === existing.id ? selectEcosystemOffer(line, true) : line)
    } else {
      target = selectEcosystemOffer(buildEcosystemCatalogLine(item, randomUUID()), true)
      next.push(target)
    }

    const dependency = getCommercialMeta(target).dependency
    if (dependency?.requires_base) {
      const project = dependency.project || target.project
      const baseAlready = next.find(line => line.project === project && line.kind === "plan")
      if (baseAlready) {
        if (isEcosystemOffer(baseAlready)) {
          next = next.map(line => line.id === baseAlready.id ? selectEcosystemOffer(line, true) : line)
        }
      } else {
        const baseItem = candidates.find(candidate => candidate.project === project && candidate.kind === "plan")
        if (!baseItem) {
          return NextResponse.json({
            error: `Per aggiungere ${target.name || target.description} serve il piano base ${project || "collegato"}, che richiede una configurazione commerciale.`,
            code: "MISSING_BASE_PRODUCT",
          }, { status: 422 })
        }
        next.push(selectEcosystemOffer(buildEcosystemCatalogLine(baseItem, randomUUID()), true))
      }
    }
  } else {
    target = current.find(item => item.id === lineId)
    if (!target || !target.optional || !isEcosystemOffer(target)) {
      return NextResponse.json({ error: "Questa voce non è una proposta Ecosistema modificabile" }, { status: 422 })
    }

    next = current.map(item => item.id === lineId ? selectEcosystemOffer(item, selected) : item)

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
        if (!isEcosystemOffer(item) || item.project !== target!.project || item.kind !== "module") return item
        const dependency = getCommercialMeta(item).dependency
        return dependency?.requires_base ? selectEcosystemOffer(item, false) : item
      })
    }
  }

  const active = next.filter(isQuoteLineSelected)
  const dependencies = dependencyErrors(active)
  if (dependencies.length) {
    return NextResponse.json({ error: dependencies[0], dependency_errors: dependencies }, { status: 422 })
  }

  const projects = quoteTermsProjects(active)
  const freshTerms = await fetchContractTerms(projects)
  const contractTerms = mergeContractTerms(parseContractTerms(quote.contract_terms), freshTerms)

  const now = new Date().toISOString()
  const totalAmount = calculateQuoteTotal(next)
  const { data: updated, error: updateError } = await supabase
    .from("sales_channel_quotes")
    .update({ line_items: next, total_amount: totalAmount, contract_terms: contractTerms, updated_at: now })
    .eq("id", quote.id)
    .eq("updated_at", quote.updated_at)
    .is("accepted_at", null)
    .neq("status", "accepted")
    .neq("status", "paid")
    .select("id")
    .maybeSingle()

  if (updateError) return NextResponse.json({ error: "Impossibile aggiornare il preventivo" }, { status: 500 })
  if (!updated) {
    return NextResponse.json({
      error: "Il preventivo è cambiato mentre lo stavi modificando. Ricarica la pagina e riprova.",
      code: "QUOTE_VERSION_CONFLICT",
    }, { status: 409 })
  }

  return NextResponse.json({
    success: true,
    selected,
    total_amount: totalAmount,
    selected_item_ids: next.filter(isQuoteLineSelected).map(item => item.id).filter(Boolean),
  })
}
