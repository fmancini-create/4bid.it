import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getLocationByEmail } from "@/lib/dem/hotels-csv"
import { rifiutaSeNonAutorizzato } from "@/lib/dem/autorizzazione"
import { provaAttiva } from "@/lib/dem/ab-oggetto"

export async function GET(request: NextRequest) {
  // Espone indirizzi email dei destinatari e la loro localita': dato personale,
  // non solo un conteggio.
  const rifiuto = await rifiutaSeNonAutorizzato(request)
  if (rifiuto) return rifiuto

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

    // Global suppression list = the source of truth for "disiscritti".
    // Unsubscribes live in `dem_unsubscribes`, NOT in recipients.send_status:
    // a recipient who already received the email keeps status 'sent' even after
    // unsubscribing, so counting send_status='unsubscribed' returns 0 while the
    // suppression list has entries. We therefore intersect recipients with the
    // suppression list. Previously this was done client-side with a `.in()` over
    // ~1200 emails, which produced a huge query-string: the count silently failed
    // (returning 0) while the in-memory Set still lit up the row icons. We now do
    // the intersection DB-side via RPC (POST body, no URL length limit).
    const countByStatus = async (status?: string) => {
      if (status === "unsubscribed") {
        const { data, error } = await supabase.rpc("dem_campaign_unsub_count", {
          p_campaign_id: campaignId,
        })
        if (error) {
          console.error("[v0] dem_campaign_unsub_count error:", error.message)
          return 0
        }
        return Number(data) || 0
      }
      let q = supabase
        .from("dem_recipients")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
      if (status) {
        q = q.eq("send_status", status)
      }
      const { count } = await q
      return count || 0
    }

    const [total, sent, failed, pending, paused, unsubscribed] = await Promise.all([
      countByStatus(),
      countByStatus("sent"),
      countByStatus("failed"),
      countByStatus("pending"),
      countByStatus("paused"),
      countByStatus("unsubscribed"),
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
      sent_at: "sent_at",
      first_open_at: "first_open_at",
    }
    const sortColumn = SORTABLE[searchParams.get("sort") || ""] || "created_at"
    const sortAsc = (searchParams.get("dir") || "asc") !== "desc"

    // Pagination config shared by both the "unsubscribed" (RPC) and normal paths.
    const PAGE_SIZE = 500
    const requestedPage = Math.max(0, Number.parseInt(searchParams.get("page") || "0", 10) || 0)

    let recipients: Record<string, unknown>[] = []
    let filteredTotal = 0
    let page = 0

    if (statusFilter === "unsubscribed") {
      // Disiscritti list is derived DB-side (JOIN with the suppression list) via
      // RPC to avoid the URL-bomb of a ~1200-email `.in()` filter. The RPC also
      // returns full_count (window function) so we can paginate correctly.
      page = requestedPage
      const { data: rows, error: rpcError } = await supabase.rpc("dem_recipients_unsubscribed", {
        p_campaign_id: campaignId,
        p_search: search || null,
        p_sort: sortColumn,
        p_asc: sortAsc,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      })
      if (rpcError) {
        console.error("[v0] dem_recipients_unsubscribed error:", rpcError.message)
        return NextResponse.json({ error: "Error fetching recipients" }, { status: 500 })
      }
      recipients = (rows || []) as Record<string, unknown>[]
      filteredTotal = recipients.length > 0 ? Number(recipients[0].full_count) || 0 : 0
      // Re-clamp the page if the requested one is past the end.
      const lastPage = Math.max(0, Math.ceil(filteredTotal / PAGE_SIZE) - 1)
      if (page > lastPage) page = lastPage
    } else {
      // Applies the active filters to any query builder (count + rows).
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

      const { count: filteredCount } = await applyFilters(
        supabase.from("dem_recipients").select("*", { count: "exact", head: true })
      )
      filteredTotal = filteredCount || 0

      const lastPage = Math.max(0, Math.ceil(filteredTotal / PAGE_SIZE) - 1)
      page = Math.min(requestedPage, lastPage)
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data: rows, error: recipientsError } = await applyFilters(
        supabase.from("dem_recipients").select("*")
      )
        .order(sortColumn, { ascending: sortAsc, nullsFirst: false })
        .range(from, to)

      if (recipientsError) {
        return NextResponse.json({ error: "Error fetching recipients" }, { status: 500 })
      }
      recipients = (rows || []) as Record<string, unknown>[]
    }

    // Mark which rows on THIS page are in the global suppression list so the UI
    // can show the unsubscribed icon even when send_status is still 'sent'.
    // Done via RPC (POST body) over just the current page's emails - no URL limit.
    const pageEmails = recipients
      .map((r) => (r.email ? String(r.email).toLowerCase() : ""))
      .filter(Boolean)
    const unsubSet = new Set<string>()
    if (statusFilter === "unsubscribed") {
      // Every row on this path is unsubscribed by definition.
      for (const e of pageEmails) unsubSet.add(e)
    } else if (pageEmails.length > 0) {
      const { data: suppressed, error: supErr } = await supabase.rpc("dem_emails_in_suppression", {
        p_emails: pageEmails,
      })
      if (supErr) {
        console.error("[v0] dem_emails_in_suppression error:", supErr.message)
      } else {
        for (const row of (suppressed || []) as { email: string }[]) {
          if (row.email) unsubSet.add(row.email.toLowerCase())
        }
      }
    }

    // Enrich recipients with the hotel location from the source CSV (matched by
    // email). The DEM table doesn't store the city, so we join it at query time.
    const locationByEmail = getLocationByEmail()
    const enrichedRecipients = recipients.map((r: Record<string, unknown>) => {
      const emailKey = r.email ? String(r.email).toLowerCase() : ""
      const loc = emailKey ? locationByEmail.get(emailKey) : undefined
      return {
        ...r,
        citta: loc?.citta || null,
        provincia: loc?.provincia || null,
        regione: loc?.regione || null,
        is_unsubscribed: emailKey ? unsubSet.has(emailKey) : false,
      }
    })

    // Confronto A/B sull'oggetto.
    //
    // Si contano SOLO le email con `send_status = 'sent'` e una variante
    // assegnata. Le 4.119 spedite prima che la prova esistesse hanno
    // `subject_variant = NULL` e restano fuori: sommarle alla variante A la
    // gonfierebbe con invii fatti in altri giorni, con un testo diverso e una
    // reputazione del mittente diversa, e il confronto non misurerebbe piu'
    // l'oggetto.
    //
    // Conteggi lato banca dati (head: true, nessuna riga scaricata): su decine di
    // migliaia di destinatari, contare in memoria significherebbe scaricarli tutti
    // e sbagliare il totale appena la paginazione taglia l'elenco.
    const contaVariante = async (variante: "A" | "B", filtro?: "aperte" | "clic") => {
      let q = supabase
        .from("dem_recipients")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("send_status", "sent")
        .eq("subject_variant", variante)
      if (filtro === "aperte") q = q.gt("open_count", 0)
      if (filtro === "clic") q = q.gt("click_count", 0)
      const { count } = await q
      return count || 0
    }

    const [aInviate, aAperte, aClic, bInviate, bAperte, bClic] = await Promise.all([
      contaVariante("A"),
      contaVariante("A", "aperte"),
      contaVariante("A", "clic"),
      contaVariante("B"),
      contaVariante("B", "aperte"),
      contaVariante("B", "clic"),
    ])

    // Get tracking events
    const { data: events } = await supabase
      .from("dem_tracking_events")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(500)

    return NextResponse.json({
      campaign,
      recipients: enrichedRecipients,
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
        unsubscribed,
        opens: campaign.open_count || 0,
        unique_opens: campaign.unique_opens || 0,
        clicks: campaign.click_count || 0,
        unique_clicks: campaign.unique_clicks || 0,
      },
      // `attiva` dice se i due oggetti esistono e sono diversi: il pannello non
      // deve mostrare un confronto quando non c'e' un secondo oggetto da
      // confrontare.
      ab: {
        attiva: provaAttiva(campaign.subject, campaign.subject_b),
        oggettoA: campaign.subject || "",
        oggettoB: campaign.subject_b || "",
        a: { inviate: aInviate, aperte: aAperte, clic: aClic },
        b: { inviate: bInviate, aperte: bAperte, clic: bClic },
      },
    })
  } catch (error) {
    console.error("DEM stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
