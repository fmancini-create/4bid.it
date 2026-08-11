import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

/**
 * Azzera il contatore delle visite di un preventivo. Riporta a zero i tre campi
 * che il tracciamento della pagina pubblica incrementa/imposta
 * (view_count, first_viewed_at, last_viewed_at), cosi' la prossima apertura del
 * cliente riparte da "Non ancora aperto". Non tocca nulla d'altro: e' sicuro
 * anche su preventivi accettati o pagati (cambia solo una statistica).
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .update({ view_count: 0, first_viewed_at: null, last_viewed_at: null })
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
