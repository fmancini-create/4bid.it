/**
 * Update the signed-in user's own profile.
 *
 * Only the four descriptive fields are writable. `id` and `email` are not
 * accepted from the client: `id` comes from the session, and letting `email` be
 * rewritten here would let a user point their profile at somebody else's
 * address while their invitations and login stayed unchanged.
 */

import { NextResponse } from "next/server"

import { requireUser } from "@/lib/project-room/auth"
import { createAdminClient } from "@/lib/supabase/server"

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

export async function PATCH(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>

  const db = createAdminClient()
  const { error } = await db
    .from("profiles")
    .update({
      first_name: clean(payload.first_name, 100),
      last_name: clean(payload.last_name, 100),
      company: clean(payload.company, 200),
      job_role: clean(payload.job_role, 200),
      updated_at: new Date().toISOString(),
    })
    // Scoped to the session user: the row id is never taken from the payload.
    .eq("id", guard.data.id)

  if (error) {
    console.error("[v0] profile update failed:", error.message)
    return NextResponse.json({ error: "Impossibile salvare il profilo." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
