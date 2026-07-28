import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * Public endpoint for the "richiedi accesso" form.
 *
 * The `anon` role has no privileges on pr_access_requests at all, so the write
 * happens here with the service role after validation. That is deliberate: it
 * keeps the table unreadable and unwritable from the browser while still
 * allowing an unauthenticated prospect to submit a request.
 */

const MAX_LENGTHS = {
  email: 254,
  first_name: 80,
  last_name: 80,
  company: 120,
  job_role: 120,
  message: 2000,
} as const

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

// Intentionally permissive: the goal is to reject obvious junk, not to
// re-implement RFC 5322 and lock out a legitimate address.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>

  const email = clean(payload.email, MAX_LENGTHS.email)?.toLowerCase() ?? null
  const firstName = clean(payload.first_name, MAX_LENGTHS.first_name)
  const lastName = clean(payload.last_name, MAX_LENGTHS.last_name)
  const company = clean(payload.company, MAX_LENGTHS.company)
  const jobRole = clean(payload.job_role, MAX_LENGTHS.job_role)
  const message = clean(payload.message, MAX_LENGTHS.message)

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Inserisci un indirizzo email valido." }, { status: 400 })
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Nome e cognome sono obbligatori." }, { status: 400 })
  }

  // Honeypot: a hidden field that only a bot fills in. Answer 200 so the bot
  // has no signal that it was detected.
  if (clean(payload.website, 200)) {
    return NextResponse.json({ ok: true })
  }

  try {
    const admin = createAdminClient()

    // One pending request per email: re-submitting refreshes the existing one
    // instead of flooding the admin queue with duplicates.
    const { data: existing } = await admin
      .from("pr_access_requests")
      .select("id, status")
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle()

    if (existing) {
      await admin
        .from("pr_access_requests")
        .update({
          first_name: firstName,
          last_name: lastName,
          company,
          job_role: jobRole,
          message,
        })
        .eq("id", existing.id)

      return NextResponse.json({ ok: true })
    }

    const { error } = await admin.from("pr_access_requests").insert({
      email,
      first_name: firstName,
      last_name: lastName,
      company,
      job_role: jobRole,
      message,
      status: "pending",
    })

    if (error) {
      console.log("[v0] access-request insert failed:", error.message)
      // Never surface the raw database message to the client.
      return NextResponse.json({ error: "Non riusciamo a registrare la richiesta. Riprova." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.log("[v0] access-request unexpected error:", error instanceof Error ? error.message : "unknown")
    return NextResponse.json({ error: "Non riusciamo a registrare la richiesta. Riprova." }, { status: 500 })
  }
}
