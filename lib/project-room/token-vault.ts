import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

/**
 * Reversible storage for invitation links.
 *
 * The invitation token is a credential: whoever holds it can enter a private
 * project. `pr_invitations.token` therefore keeps only its SHA-256 fingerprint,
 * which cannot be reversed — that is deliberate and stays as it is.
 *
 * Resending the *same* link needs the plaintext back, so it is kept here as an
 * additional, separately encrypted column. The security of that column rests on
 * one thing only: the key lives in the environment (`PR_INVITE_TOKEN_KEY`) and
 * never in the database, so a leaked database dump alone yields nothing.
 *
 * The honest trade-off, stated plainly: database + key together do expose the
 * links, which the fingerprint-only design made impossible. That is the price of
 * being able to resend an identical link, and it was accepted knowingly.
 */

const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12
const TAG_BYTES = 16
const SALT = "pr-invite-token-vault-v1"

/** Marks the stored format, so a future scheme can be told apart on sight. */
const PREFIX = "v1"

let cachedKey: Buffer | null | undefined

/**
 * Byte helpers kept local on purpose.
 *
 * `Buffer` IS a `Uint8Array` at runtime, but the Node types bundled with this
 * project reject it wherever an `ArrayBufferView` is expected — the same clash
 * `invitations.ts` already works around. Converting explicitly keeps the crypto
 * calls honest instead of scattering `as any` over security-critical code.
 */
function joinBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64url")
}

function fromBase64Url(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64url"))
}

/**
 * The configured secret, stretched to the 32 bytes AES-256 needs.
 *
 * `scryptSync` rather than using the value directly: the operator may well type
 * a short word instead of 32 random bytes, and raw-slicing that would leave most
 * of the key predictable. Stretching does not turn a weak secret into a strong
 * one — a short word stays guessable by brute force — but it removes the trivial
 * failure and accepts whatever length was actually provided.
 */
function getKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey

  const secret = process.env.PR_INVITE_TOKEN_KEY?.trim()
  if (!secret) {
    cachedKey = null
    return null
  }

  cachedKey = scryptSync(secret, SALT, 32)
  return cachedKey
}

/** Whether resending an identical link is possible at all. */
export function canPreserveTokens(): boolean {
  return getKey() !== null
}

/**
 * Encrypts a token for storage. Returns null when no key is configured, so the
 * caller rotates the link instead of storing it in the clear.
 */
export function sealToken(token: string): string | null {
  const key = getKey()
  if (!key) return null

  // `Uint8Array.from(...)` throughout: `Buffer` IS a Uint8Array at runtime, but
  // the bundled Node types reject it as an ArrayBufferView here — the same
  // workaround already used in `invitations.ts`.
  const iv = Uint8Array.from(randomBytes(IV_BYTES))
  const cipher = createCipheriv(ALGORITHM, Uint8Array.from(key), iv)
  const encrypted = joinBytes(Uint8Array.from(cipher.update(token, "utf8")), Uint8Array.from(cipher.final()))
  const tag = Uint8Array.from(cipher.getAuthTag())

  return [PREFIX, toBase64Url(iv), toBase64Url(encrypted), toBase64Url(tag)].join(".")
}

/**
 * Recovers a token, or null if that is not possible for ANY reason: no key, a
 * different key than the one used to seal, a tampered value, or a row written
 * before this feature existed.
 *
 * Never throws. A resend must not 500 because of an unreadable old row — the
 * caller falls back to issuing a fresh link and says so in the response.
 */
export function openToken(sealed: string | null | undefined): string | null {
  const key = getKey()
  if (!key || !sealed) return null

  const parts = sealed.split(".")
  if (parts.length !== 4 || parts[0] !== PREFIX) return null

  try {
    const iv = fromBase64Url(parts[1])
    const payload = fromBase64Url(parts[2])
    const tag = fromBase64Url(parts[3])
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null

    const decipher = createDecipheriv(ALGORITHM, Uint8Array.from(key), iv)
    decipher.setAuthTag(tag)
    const plainBytes = joinBytes(Uint8Array.from(decipher.update(payload)), Uint8Array.from(decipher.final()))
    const plain = Buffer.from(plainBytes.buffer, plainBytes.byteOffset, plainBytes.byteLength).toString("utf8")

    return plain.length > 0 ? plain : null
  } catch {
    // Wrong key or altered ciphertext: GCM authentication fails here by design.
    return null
  }
}

/**
 * Confirms a recovered token still matches the stored fingerprint.
 *
 * Without this a resend could mail a link that the accept endpoint rejects: the
 * two columns are written separately, so they can drift (a restore, a manual
 * edit). Better to rotate than to send a link that does not work.
 */
export function tokenMatchesFingerprint(token: string, fingerprint: string, hash: (value: string) => string): boolean {
  const computed = Uint8Array.from(Buffer.from(hash(token), "utf8"))
  const stored = Uint8Array.from(Buffer.from(fingerprint, "utf8"))
  if (computed.length !== stored.length || computed.length === 0) return false
  return timingSafeEqual(computed, stored)
}
