import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("business_plan_photos")
    .select("*")
    .eq("business_plan_id", id)
    .order("area")
    .order("sort_order")

  if (error) {
    console.error("[v0] Error fetching photos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { area, image_url, is_ai_generated, ai_prompt, sort_order } = body

  const supabase = createAdminClient()

  // Conta le foto esistenti per questa area
  const { count } = await supabase
    .from("business_plan_photos")
    .select("*", { count: "exact", head: true })
    .eq("business_plan_id", id)
    .eq("area", area)

  if ((count || 0) >= 3) {
    return NextResponse.json({ error: "Massimo 3 foto per area" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("business_plan_photos")
    .insert({
      business_plan_id: id,
      area,
      image_url,
      is_ai_generated: is_ai_generated || false,
      ai_prompt: ai_prompt || null,
      sort_order: sort_order || count || 0,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error inserting photo:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const photoId = searchParams.get("photoId")

  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase.from("business_plan_photos").delete().eq("id", photoId).eq("business_plan_id", id)

  if (error) {
    console.error("[v0] Error deleting photo:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
