import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { randomUUID } from "crypto"
import { sendQuoteEmail } from "@/lib/quotes/email"
import type { SalesChannelQuote } from "@/lib/quotes/types"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("id", id)
    .single<SalesChannelQuote>()

  if (error || !quote) {
    return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  }
  if (!quote.client_email) {
    return NextResponse.json({ error: "Email cliente mancante: impostala prima di inviare" }, { status: 400 })
  }

  const token = quote.token || randomUUID()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const link = `${baseUrl}/preventivo/${token}`

  const { data: updated, error: updateError } = await supabase
    .from("sales_channel_quotes")
    .update({
      token,
      status: quote.status === "draft" ? "sent" : quote.status,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single<SalesChannelQuote>()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Errore aggiornamento" }, { status: 500 })
  }

  const result = await sendQuoteEmail(updated, link)
  if (!result.success) {
    return NextResponse.json({ error: `Invio email fallito: ${result.error}`, link }, { status: 500 })
  }

  return NextResponse.json({ success: true, link })
}
