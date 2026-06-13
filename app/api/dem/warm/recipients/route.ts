import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getLocationByEmail } from "@/lib/dem/hotels-csv"
import { dispatchWarmStep, type FollowupStepRow } from "@/lib/dem/warm"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

async function gate(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user && user.email === SUPER_ADMIN_EMAIL
}

const PAGE_SIZE = 200

const SORTABLE: Record<string, string> = {
  email: "email",
  nome_azienda: "nome_azienda",
  commercial_status: "commercial_status",
  orig_open_count: "orig_open_count",
  orig_click_count: "orig_click_count",
  followups_sent: "followups_sent",
  last_followup_at: "last_followup_at",
  calendar_clicks: "calendar_clicks",
  orig_last_click_at: "orig_last_click_at",
  created_at: "created_at",
}

// --- GET: tab "Caldi" paginata (filtri + ordinamento "piu' caldo") ---
export async function GET(request: NextRequest) {
  if (!(await gate())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const followupId = searchParams.get("followup_id")
  if (!followupId) return NextResponse.json({ error: "followup_id mancante" }, { status: 400 })

  const supabase = createAdminClient()
  const search = (searchParams.get("search") || "").trim()
  const statusFilter = (searchParams.get("status") || "all").trim()
  const sortColumn = SORTABLE[searchParams.get("sort") || ""] || "orig_click_count"
  const sortAsc = (searchParams.get("dir") || "desc") !== "desc"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (q: any) => {
    let query = q.eq("followup_id", followupId)
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "excluded") query = query.eq("excluded", true)
      else if (statusFilter === "eligible")
        query = query.eq("excluded", false).eq("responded", false)
      else query = query.eq("commercial_status", statusFilter)
    }
    if (search) {
      const safe = search.replace(/[(),]/g, " ").trim()
      if (safe) {
        query = query.or(
          `email.ilike.%${safe}%,nome.ilike.%${safe}%,cognome.ilike.%${safe}%,nome_azienda.ilike.%${safe}%`
        )
      }
    }
    return query
  }

  const { count: filteredCount } = await applyFilters(
    supabase.from("dem_followup_recipients").select("id", { count: "exact", head: true })
  )
  const filteredTotal = filteredCount || 0
  const lastPage = Math.max(0, Math.ceil(filteredTotal / PAGE_SIZE) - 1)
  const requestedPage = Math.max(0, Number.parseInt(searchParams.get("page") || "0", 10) || 0)
  const page = Math.min(requestedPage, lastPage)
  const from = page * PAGE_SIZE

  const { data: rows, error } = await applyFilters(
    supabase.from("dem_followup_recipients").select("*")
  )
    .order(sortColumn, { ascending: sortAsc, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const locationByEmail = getLocationByEmail()
  const enriched = (rows || []).map((r: Record<string, unknown>) => {
    const emailKey = r.email ? String(r.email).toLowerCase() : ""
    const loc = emailKey ? locationByEmail.get(emailKey) : undefined
    return { ...r, citta: loc?.citta || null, provincia: loc?.provincia || null }
  })

  return NextResponse.json({
    recipients: enriched,
    page,
    pageSize: PAGE_SIZE,
    filteredTotal,
  })
}

// --- PATCH: azioni per-riga (escludi/ripristina, invia sollecito singolo) ---
export async function PATCH(request: NextRequest) {
  if (!(await gate())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  try {
    const body = await request.json()
    const { id, action } = body
    if (!id || !action) {
      return NextResponse.json({ error: "id e action obbligatori" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: recipient, error: loadErr } = await supabase
      .from("dem_followup_recipients")
      .select("*")
      .eq("id", id)
      .single()
    if (loadErr || !recipient) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 })
    }

    const nowIso = new Date().toISOString()

    if (action === "exclude") {
      const { error } = await supabase
        .from("dem_followup_recipients")
        .update({ excluded: true, excluded_reason: body.reason || "Escluso manualmente", updated_at: nowIso })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === "restore") {
      const { error } = await supabase
        .from("dem_followup_recipients")
        .update({ excluded: false, excluded_reason: null, updated_at: nowIso })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === "send_single") {
      // Determina lo step successivo (sequenziale) e invialo solo a questo contatto.
      const { data: followup } = await supabase
        .from("dem_followups")
        .select("id, original_campaign_id")
        .eq("id", recipient.followup_id)
        .single()
      if (!followup) return NextResponse.json({ error: "Sequenza non trovata" }, { status: 404 })

      const nextStepNumber = (recipient.followups_sent || 0) + 1
      const { data: step } = await supabase
        .from("dem_followup_steps")
        .select("*")
        .eq("followup_id", followup.id)
        .eq("step_number", nextStepNumber)
        .maybeSingle()
      if (!step || !step.enabled) {
        return NextResponse.json({ error: "Nessuno step successivo attivo da inviare" }, { status: 400 })
      }

      const { data: campaign } = await supabase
        .from("dem_campaigns")
        .select("name")
        .eq("id", followup.original_campaign_id)
        .single()

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : request.headers.get("origin") || "https://www.4bid.it")

      const dispatch = await dispatchWarmStep(supabase, {
        followup,
        originalCampaignName: campaign?.name || "Campagna",
        step: step as FollowupStepRow,
        baseUrl,
        maxToSend: 1,
        onlyEmails: [recipient.email],
      })

      if (dispatch.sent === 0) {
        return NextResponse.json(
          { error: "Invio non riuscito (contatto non eleggibile o errore invio)", detail: dispatch.sendResult },
          { status: 400 }
        )
      }
      return NextResponse.json({ ok: true, sent: dispatch.sent, step: nextStepNumber })
    }

    return NextResponse.json({ error: "Azione non riconosciuta" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}
