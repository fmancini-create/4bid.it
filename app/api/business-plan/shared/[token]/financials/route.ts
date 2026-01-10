import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  // Trova la condivisione e il business plan
  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("business_plan_id")
    .eq("access_token", token)
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: "Token non valido" }, { status: 404 })
  }

  // Carica i dati finanziari
  const { data, error } = await supabase
    .from("business_plan_financials")
    .select("*")
    .eq("business_plan_id", share.business_plan_id)
    .order("year", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
