import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createAdminClient()

  const { data: campaigns, error } = await supabase
    .from("dem_campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ campaigns })
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const { name, subject, html_template } = await request.json()

    if (!name || !subject || !html_template) {
      return NextResponse.json(
        { error: "Nome, oggetto e template sono obbligatori" },
        { status: 400 }
      )
    }

    const { data: campaign, error } = await supabase
      .from("dem_campaigns")
      .insert({
        name,
        subject,
        html_template,
        status: "draft",
        sent_count: 0,
        failed_count: 0,
        open_count: 0,
        click_count: 0,
        unique_opens: 0,
        unique_clicks: 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID campagna mancante" }, { status: 400 })
  }

  // Delete recipients first
  await supabase.from("dem_tracking_events").delete().eq("campaign_id", id)
  await supabase.from("dem_recipients").delete().eq("campaign_id", id)

  const { error } = await supabase.from("dem_campaigns").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
