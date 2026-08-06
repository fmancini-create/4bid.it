import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { enqueueQuoteProvisioning, processQuoteProvisioning } from "@/lib/quotes/provisioning"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: quote, error } = await admin.from("sales_channel_quotes").select("*").eq("id", id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  if (quote.payment_status !== "paid") {
    return NextResponse.json({ error: "Il provisioning può partire solo dopo il pagamento confermato" }, { status: 409 })
  }

  await enqueueQuoteProvisioning(quote as SalesChannelQuote)
  const status = await processQuoteProvisioning(id)
  return NextResponse.json({ success: true, status })
}
