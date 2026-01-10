import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("business_plan_comments")
    .select("*")
    .eq("business_plan_id", id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  if (!body.content || !body.author_name) {
    return NextResponse.json({ error: "Contenuto e nome autore sono obbligatori" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("business_plan_comments")
    .insert({
      business_plan_id: id,
      author_name: body.author_name,
      author_email: body.author_email || null,
      section: body.section || "general",
      content: body.content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
