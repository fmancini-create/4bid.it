import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notifyAdminQuoteReactivationRequest } from "@/lib/quotes/lifecycle-email"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("token", token)
    .maybeSingle<SalesChannelQuote & {
      reactivation_requested_at?: string | null
      reactivation_notified_at?: string | null
    }>()

  if (error || !data) {
    return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  }

  const paid = data.status === "paid" || data.payment_status === "paid" || Boolean(data.paid_at)
  const expired = !paid && (Boolean(data.expired_at) || (data.expires_at ? new Date(data.expires_at).getTime() <= Date.now() : false))

  if (paid) return NextResponse.json({ error: "Il preventivo risulta già pagato" }, { status: 409 })
  if (!expired) return NextResponse.json({ error: "Il preventivo è ancora valido" }, { status: 409 })

  const lastRequest = data.reactivation_requested_at ? new Date(data.reactivation_requested_at).getTime() : 0
  if (lastRequest && Date.now() - lastRequest < REQUEST_COOLDOWN_MS) {
    return NextResponse.json({ ok: true, already_requested: true })
  }

  const requestedAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("sales_channel_quotes")
    .update({ reactivation_requested_at: requestedAt, updated_at: requestedAt })
    .eq("id", data.id)

  if (updateError) {
    return NextResponse.json({ error: "Impossibile registrare la richiesta" }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"
  const adminPath = data.accepted_at && data.expired_at
    ? "/admin/quotes"
    : `/admin/quotes/edit/${data.id}`
  const notified = await notifyAdminQuoteReactivationRequest(
    data,
    SUPER_ADMIN_EMAIL,
    `${baseUrl}${adminPath}`,
  )

  if (notified.success) {
    await supabase
      .from("sales_channel_quotes")
      .update({ reactivation_notified_at: requestedAt, updated_at: requestedAt })
      .eq("id", data.id)
  }

  return NextResponse.json({ ok: true, notified: notified.success })
}
