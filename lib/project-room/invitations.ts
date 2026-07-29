/**
 * Invitation tokens for the Project Room.
 *
 * An invitation token is a bearer credential: whoever holds it can claim access
 * to a confidential project. It is therefore treated like a password.
 *
 *   - The raw token is generated once, returned to the admin once, and never
 *     stored. `pr_invitations.token` holds only a SHA-256 hash.
 *   - Lookup is by hash, so a leaked database dump does not yield usable
 *     invitation links.
 *   - Comparison uses `timingSafeEqual` on the hash, not `===`.
 *
 * The raw token never appears in a URL query string either: it is sent in the
 * request body when accepting, so it does not end up in server access logs or
 * `Referer` headers. The link uses a path segment, which we strip from logs by
 * never logging invitation URLs.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

/** How long an invitation stays valid. */
export const INVITATION_TTL_DAYS = 14

/** Roles an admin may hand out through an invitation. */
export const INVITABLE_ROLES = ["reader", "commenter", "reviewer", "project_manager"] as const
export type InvitableRole = (typeof INVITABLE_ROLES)[number]

export function isInvitableRole(value: unknown): value is InvitableRole {
  return typeof value === "string" && (INVITABLE_ROLES as readonly string[]).includes(value)
}

/**
 * Generates a fresh invitation secret.
 * Returns the raw token (show once, never persist) and the hash to store.
 */
export function createInvitationToken(): { raw: string; hash: string } {
  // 32 bytes = 256 bits of entropy, base64url so it is safe in a path segment.
  const raw = randomBytes(32).toString("base64url")
  return { raw, hash: hashInvitationToken(raw) }
}

export function hashInvitationToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex")
}

/**
 * Constant-time comparison of two hex digests.
 *
 * The values are copied into plain `Uint8Array`s: `Buffer` is a `Uint8Array` at
 * runtime, but the bundled Node types do not accept it as an `ArrayBufferView`
 * here. The comparison itself still runs in `timingSafeEqual`, so the
 * constant-time guarantee is unchanged.
 */
export function tokenHashEquals(a: string, b: string): boolean {
  const bufA = Uint8Array.from(Buffer.from(a, "hex"))
  const bufB = Uint8Array.from(Buffer.from(b, "hex"))
  if (bufA.length !== bufB.length || bufA.length === 0) return false
  return timingSafeEqual(bufA, bufB)
}

export function invitationExpiry(from: Date = new Date()): string {
  return new Date(from.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Why an invitation cannot be used. `null` means it is usable.
 * Kept as a single helper so the accept page and the accept API cannot drift
 * apart on what counts as "valid".
 */
export type InvitationRejection = "revoked" | "accepted" | "expired"

export function invitationRejection(row: {
  revoked_at: string | null
  accepted_at: string | null
  expires_at: string | null
}): InvitationRejection | null {
  if (row.revoked_at) return "revoked"
  if (row.accepted_at) return "accepted"
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return "expired"
  return null
}

export const INVITATION_REJECTION_MESSAGE: Record<InvitationRejection, string> = {
  revoked: "Questo invito e stato revocato. Contatta il referente 4Bid per riceverne uno nuovo.",
  accepted: "Questo invito è già stato utilizzato. Accedi con le tue credenziali.",
  expired: "Questo invito è scaduto. Contatta il referente 4Bid per riceverne uno nuovo.",
}

/**
 * Absolute URL of the invitation.
 *
 * The canonical site URL wins over the request origin: this link is forwarded
 * by hand to an external client, so it must not inherit a preview host or the
 * `https://localhost` that the dev proxy reports. The request origin is used
 * only for local development, where no canonical host applies.
 */
export function invitationUrl(requestOrigin: string, raw: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)

  let base: string
  if (isLocal) {
    // Force http: the dev proxy reports https for localhost, which does not resolve.
    base = requestOrigin.replace(/^https:/, "http:")
  } else {
    base = configured || requestOrigin.replace(/\/$/, "")
  }

  return `${base}/area-riservata/invito/${raw}`
}
