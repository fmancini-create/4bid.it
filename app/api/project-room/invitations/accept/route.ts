/**
 * Accept an invitation.
 *
 * Two distinct cases, kept strictly apart:
 *
 *   NEW USER     - no auth account exists for the invited address. The token
 *                  holder sets a password and the account is created.
 *
 *   EXISTING USER- an account already exists. The token must NOT be able to set
 *                  a password: otherwise anyone holding an invitation link for a
 *                  known address could overwrite that person's credentials and
 *                  take over the account. Instead the caller must already be
 *                  signed in as that exact address; the token then only grants
 *                  the project membership.
 *
 * The raw token arrives in the request body, never in the query string, so it
 * does not leak through access logs or `Referer` headers.
 */

import { NextResponse } from "next/server"

import { createAdminClient, createClient } from "@/lib/supabase/server"
import { recordAudit } from "@/lib/project-room/activity"
import {
  hashInvitationToken,
  invitationRejection,
  INVITATION_REJECTION_MESSAGE,
} from "@/lib/project-room/invitations"

const MIN_PASSWORD_LENGTH = 10

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 })
  }

  const payload = (body ?? {}) as Record<string, unknown>
  const rawToken = typeof payload.token === "string" ? payload.token.trim() : ""
  const password = typeof payload.password === "string" ? payload.password : ""
  const firstName = typeof payload.first_name === "string" ? payload.first_name.trim().slice(0, 100) : ""
  const lastName = typeof payload.last_name === "string" ? payload.last_name.trim().slice(0, 100) : ""
  const company = typeof payload.company === "string" ? payload.company.trim().slice(0, 200) : ""

  if (!rawToken) {
    return NextResponse.json({ error: "Invito non valido." }, { status: 400 })
  }

  const db = createAdminClient()

  const { data: invitation, error: inviteError } = await db
    .from("pr_invitations")
    .select("id, project_id, email, role, can_download, expires_at, accepted_at, revoked_at")
    .eq("token", hashInvitationToken(rawToken))
    .maybeSingle()

  if (inviteError) {
    console.error("[v0] invitation lookup failed:", inviteError.message)
    return NextResponse.json({ error: "Impossibile verificare l'invito." }, { status: 500 })
  }
  // Same generic message whether the token is unknown or malformed, so the
  // endpoint cannot be used to probe for valid tokens.
  if (!invitation) {
    return NextResponse.json({ error: "Invito non valido." }, { status: 404 })
  }

  const rejection = invitationRejection(invitation)
  if (rejection) {
    return NextResponse.json({ error: INVITATION_REJECTION_MESSAGE[rejection] }, { status: 409 })
  }

  // The `auth` schema is not reachable through PostgREST, so account existence
  // is established from the session first and, failing that, from the
  // `email_exists` error that createUser returns. There is no read path that
  // would let us enumerate addresses.
  let userId: string
  let createdAccount = false

  const ssr = await createClient()
  const {
    data: { user: sessionUser },
  } = await ssr.auth.getUser()

  if (sessionUser) {
    // Somebody is already signed in. The invitation may only be applied to the
    // account it was addressed to.
    if ((sessionUser.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Questo invito è destinato a un altro indirizzo email.", code: "wrong_account" },
        { status: 403 },
      )
    }
    userId = sessionUser.id
  } else {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `La password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri.` },
        { status: 400 },
      )
    }

    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    })

    if (createError?.code === "email_exists") {
      // An account already exists. Deliberately refuse to set a password here:
      // otherwise an invitation link would be an account-takeover primitive.
      return NextResponse.json(
        {
          error: "Esiste già un account con questa email. Accedi e riapri il link per completare l'invito.",
          code: "login_required",
        },
        { status: 409 },
      )
    }

    if (createError || !created?.user) {
      console.error("[v0] user creation failed:", createError?.message)
      return NextResponse.json({ error: "Impossibile creare l'account." }, { status: 500 })
    }
    userId = created.user.id
    createdAccount = true

    // Written explicitly rather than relying on a signup trigger: without a
    // `profiles` row the header would render an empty name and comment authors
    // would show as unknown.
    const { error: profileError } = await db.from("profiles").upsert(
      {
        id: userId,
        email: invitation.email,
        first_name: firstName || null,
        last_name: lastName || null,
        company: company || null,
      },
      { onConflict: "id" },
    )
    if (profileError) {
      console.error("[v0] profile upsert failed:", profileError.message)
    }
  }

  // Grant the membership. `upsert` keeps a repeated accept idempotent instead of
  // failing on the unique (project_id, user_id) constraint.
  const { error: memberError } = await db
    .from("pr_project_members")
    .upsert(
      {
        project_id: invitation.project_id,
        user_id: userId,
        role: invitation.role,
        can_download: invitation.can_download,
      },
      { onConflict: "project_id,user_id" },
    )

  if (memberError) {
    console.error("[v0] membership upsert failed:", memberError.message)
    return NextResponse.json({ error: "Impossibile completare l'invito." }, { status: 500 })
  }

  // Burn the token. Guarded on `accepted_at is null` so two concurrent accepts
  // cannot both believe they were first.
  const { data: burned, error: burnError } = await db
    .from("pr_invitations")
    .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
    .eq("id", invitation.id)
    .is("accepted_at", null)
    .select("id")

  if (burnError) {
    console.error("[v0] invitation burn failed:", burnError.message)
  }
  if (!burnError && (!burned || burned.length === 0)) {
    return NextResponse.json({ error: INVITATION_REJECTION_MESSAGE.accepted }, { status: 409 })
  }

  const { data: project } = await db
    .from("pr_projects")
    .select("organization_id, slug")
    .eq("id", invitation.project_id)
    .maybeSingle()

  await recordAudit({
    projectId: invitation.project_id,
    userId,
    action: "invitation.accepted",
    entityType: "invitation",
    entityId: invitation.id,
    metadata: { role: invitation.role, created_account: createdAccount },
  })

  return NextResponse.json({
    ok: true,
    created_account: createdAccount,
    // The client signs in with these credentials only when it just created the
    // account; an existing user already has a session.
    needs_sign_in: createdAccount,
    email: invitation.email,
    project_slug: project?.slug ?? null,
  })
}
