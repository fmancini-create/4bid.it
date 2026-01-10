import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  // Trova la condivisione e il business plan associato
  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id")
    .eq("token", token)
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: "Link non valido" }, { status: 404 })
  }

  const { data: comments, error } = await supabase
    .from("business_plan_comments")
    .select("*")
    .eq("business_plan_id", share.business_plan_id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(comments)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { author_name, author_email, section, content } = await request.json()

  if (!author_name || !content) {
    return NextResponse.json({ error: "Nome e contenuto richiesti" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Trova la condivisione
  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id")
    .eq("token", token)
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: "Link non valido" }, { status: 404 })
  }

  const { data: comment, error } = await supabase
    .from("business_plan_comments")
    .insert({
      business_plan_id: share.business_plan_id,
      author_name,
      author_email: author_email || null,
      section: section || "general",
      content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(comment)
}
