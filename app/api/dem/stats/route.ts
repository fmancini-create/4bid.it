import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("c")

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // Get campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from("dem_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Accurate counts via head:true count queries. Plain .select() is capped at
    // 1000 rows by PostgREST, so counting the returned array undercounts large
    // campaigns (we have ~30k recipients). Counts below are exact regardless of size.
    const countByStatus = async (status?: string) => {
      let q = supabase
        .from("dem_recipients")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
      if (status) q = q.eq("send_status", status)
      const { count } = await q
      return count || 0
    }

    const [total, sent, failed, pending, paused] = await Promise.all([
      countByStatus(),
      countByStatus("sent"),
      countByStatus("failed"),
      countByStatus("pending"),
      countByStatus("paused"),
    ])

    // Filters: free-text search (email/nome/cognome/azienda) + status filter.
    const search = (searchParams.get("search") || "").trim()
    const statusFilter = (searchParams.get("status") || "").trim()

    // Sorting: only allow known columns to avoid injection; default created_at asc.
    const SORTABLE: Record<string, string> = {
      send_status: "send_status",
      email: "email",
      nome: "nome",
      nome_azienda: "nome_azienda",
      open_count: "open_count",
      click_count: "click_count",
      error_message: "error_message",
      created_at: "created_at",
    }
    const sortColumn = SORTABLE[searchParams.get("sort") || ""] || "created_at"
    const sortAsc = (searchParams.get("dir") || "asc") !== "desc"

    // Applies the active filters to any query builder (used for both count and rows).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (q: any) => {
      let query = q.eq("campaign_id", campaignId)
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("send_status", statusFilter)
      }
      if (search) {
        // Strip PostgREST or() reserved chars (comma/parens) from the user term.
        const safe = search.replace(/[(),]/g, " ").trim()
        if (safe) {
          query = query.or(
            `email.ilike.%${safe}%,nome.ilike.%${safe}%,cognome.ilike.%${safe}%,nome_azienda.ilike.%${safe}%`
          )
        }
      }
      return query
    }

    // Count matching the active filters, used to drive pagination.
    const { count: filteredCount } = await applyFilters(
      supabase.from("dem_recipients").select("*", { count: "exact", head: true })
    )
    const filteredTotal = filteredCount || 0

    // Recipients are paginated: the full list can be ~30k rows, so we fetch one
    // page at a time with .range() and let the UI navigate with prev/next buttons.
    const PAGE_SIZE = 500
    const requestedPage = Math.max(0, Number.parseInt(searchParams.get("page") || "0", 10) || 0)
    const lastPage = Math.max(0, Math.ceil(filteredTotal / PAGE_SIZE) - 1)
    const page = Math.min(requestedPage, lastPage)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: recipients, error: recipientsError } = await applyFilters(
      supabase.from("dem_recipients").select("*")
    )
      .order(sortColumn, { ascending: sortAsc, nullsFirst: false })
      .range(from, to)

    if (recipientsError) {
      return NextResponse.json({ error: "Error fetching recipients" }, { status: 500 })
    }

    // Get tracking events
    const { data: events } = await supabase
      .from("dem_tracking_events")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(500)

    return NextResponse.json({
      campaign,
      recipients: recipients || [],
      recipientsPage: page,
      recipientsPageSize: PAGE_SIZE,
      recipientsFilteredTotal: filteredTotal,
      events: events || [],
      summary: {
        total,
        sent,
        failed,
        pending,
        paused,
        opens: campaign.open_count || 0,
        unique_opens: campaign.unique_opens || 0,
        clicks: campaign.click_count || 0,
        unique_clicks: campaign.unique_clicks || 0,
      },
    })
  } catch (error) {
    console.error("DEM stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
