import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("business_plans").select("*").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("business_plans")
    .insert({
      name: body.name || "Nuovo Business Plan",
      description: body.description || "",
      client_name: body.client_name || "",
      project_type: body.project_type || "hotel",
      status: body.status || "draft",
      num_rooms: body.num_rooms || 90,
      stars: body.stars || 4,
      has_spa: body.has_spa ?? true,
      has_restaurant: body.has_restaurant ?? true,
      location: body.location || "",
      opening_days_year: body.opening_days_year || 365,
      projection_years: body.projection_years || 3,
      start_year: body.start_year || new Date().getFullYear(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
