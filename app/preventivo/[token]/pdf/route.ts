import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { generateQuotePdf } from "@/lib/quotes/pdf"
import type { SalesChannelQuote } from "@/lib/quotes/types"

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data: quote, error } = await supabase
    .from("sales_channel_quotes")
    .select("*")
    .eq("token", token)
    .maybeSingle<SalesChannelQuote>()

  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })

  const now = new Date().toISOString()
  await supabase.from("sales_channel_quotes").update({
    view_count: Number(quote.view_count || 0) + 1,
    last_viewed_at: now,
    ...(quote.first_viewed_at ? {} : { first_viewed_at: now }),
  }).eq("id", quote.id)

  const pdf = await generateQuotePdf(quote)
  const safeNumber = (quote.quote_number || "preventivo").replace(/[^a-zA-Z0-9-_]/g, "-")
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${safeNumber}.pdf"`,
      "cache-control": "private, no-store",
    },
  })
}
