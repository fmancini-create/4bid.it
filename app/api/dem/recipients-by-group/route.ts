import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo") // null = tutti

  const supabase = createAdminClient()

  let query = supabase
    .from("dem_recipients")
    .select("email, nome, cognome, nome_azienda, tipo_contatto")
    .order("cognome", { ascending: true })

  if (tipo && tipo !== "tutti") {
    query = query.eq("tipo_contatto", tipo)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplica per email, tenendo l'occorrenza piu' recente
  const seen = new Map<string, typeof data[0]>()
  for (const r of data || []) {
    if (!seen.has(r.email)) seen.set(r.email, r)
  }

  return NextResponse.json({ recipients: Array.from(seen.values()), total: seen.size })
}
