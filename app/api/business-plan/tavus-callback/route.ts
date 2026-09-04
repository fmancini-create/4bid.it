import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export const runtime = "nodejs"

const EVENT_MAP: Record<string, string> = {
  "system.replica_joined": "tavus_replica_joined",
  "system.shutdown": "tavus_shutdown",
  "application.transcription_ready": "avatar_transcript",
}

type TavusCallback = {
  conversation_id?: string
  event_type?: string
  message_type?: string
  timestamp?: string
  properties?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as TavusCallback
  const conversationId = String(body.conversation_id || "").trim()
  const eventType = String(body.event_type || "").trim()
  const mappedEvent = EVENT_MAP[eventType]

  if (!conversationId || !mappedEvent) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()
  const { data: startedEvent, error: lookupError } = await supabase
    .from("business_plan_share_events")
    .select("share_id, business_plan_id, recipient_email")
    .eq("event_type", "avatar_started")
    .eq("metadata->>conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    console.error("[tavus-callback] conversation lookup failed", lookupError)
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 })
  }

  if (!startedEvent) {
    // A replica_joined callback can race the initial tracking insert. Returning 202
    // keeps the endpoint safe without accepting an unassociated conversation.
    return NextResponse.json({ received: false, pending: true }, { status: 202 })
  }

  // Tavus can retry the same webhook. Keep one canonical lifecycle event per
  // conversation so the admin transcript list never shows duplicates.
  const { data: existingEvent, error: duplicateLookupError } = await supabase
    .from("business_plan_share_events")
    .select("id")
    .eq("event_type", mappedEvent)
    .eq("metadata->>conversation_id", conversationId)
    .limit(1)
    .maybeSingle()

  if (duplicateLookupError) {
    console.error("[tavus-callback] duplicate lookup failed", duplicateLookupError)
    return NextResponse.json({ error: "Duplicate lookup failed" }, { status: 500 })
  }

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const properties = body.properties && typeof body.properties === "object" ? body.properties : {}
  const metadata: Record<string, unknown> = {
    conversation_id: conversationId,
    tavus_event_type: eventType,
    tavus_message_type: body.message_type || null,
    tavus_timestamp: body.timestamp || null,
  }

  if (eventType === "system.shutdown") {
    metadata.shutdown_reason = properties.shutdown_reason || null
  }

  if (eventType === "application.transcription_ready") {
    metadata.transcript = Array.isArray(properties.transcript) ? properties.transcript : []
  }

  const { error: insertError } = await supabase.from("business_plan_share_events").insert({
    share_id: startedEvent.share_id,
    business_plan_id: startedEvent.business_plan_id,
    event_type: mappedEvent,
    recipient_email: startedEvent.recipient_email,
    metadata,
  })

  if (insertError) {
    console.error("[tavus-callback] event insert failed", insertError)
    return NextResponse.json({ error: "Insert failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
