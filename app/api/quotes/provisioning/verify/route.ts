import { type NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/server-admin"

const PROJECTS = new Set(["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"])

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const idempotencyKey = (request.headers.get("idempotency-key") || "").trim()
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim()
  const body = await request.json().catch(() => ({}))
  const project = String(body.project || "")

  if (!idempotencyKey || !bearer || !PROJECTS.has(project)) {
    return NextResponse.json({ error: "Richiesta non autorizzata" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: job, error } = await supabase
    .from("sales_channel_quote_provisioning_jobs")
    .select("quote_id, project, payload, provisioning_token, status")
    .eq("idempotency_key", idempotencyKey)
    .eq("project", project)
    .maybeSingle()

  if (error || !job?.provisioning_token || !safeEqual(bearer, String(job.provisioning_token))) {
    return NextResponse.json({ error: "Capability non valida" }, { status: 401 })
  }

  const { data: quote } = await supabase
    .from("sales_channel_quotes")
    .select("id, status, payment_status")
    .eq("id", job.quote_id)
    .maybeSingle()

  if (!quote || quote.status !== "paid" || quote.payment_status !== "paid") {
    return NextResponse.json({ error: "Preventivo non pagato" }, { status: 409 })
  }

  if (job.status === "succeeded") {
    return NextResponse.json({ error: "Provisioning già completato" }, { status: 409 })
  }

  return NextResponse.json({ quote_id: job.quote_id, project, payload: job.payload })
}
