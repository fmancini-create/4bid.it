import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Server-side landing point for every Supabase email link (password recovery,
 * invitations, email confirmation).
 *
 * This has to run on the server, not in a client component. The proxy guards
 * /admin and /area-riservata by looking for a session cookie, so a client-side
 * page could never establish that cookie in time: the guard would bounce it to
 * the login screen before its exchange code ever ran. Exchanging here means the
 * cookie is already set by the time the destination page is requested.
 */

const ALLOWED_TYPES = new Set(["recovery", "invite", "signup", "magiclink", "email", "email_change"])

/** Only relative paths, so a crafted `?next=https://evil.example` cannot turn this into an open redirect. */
function safeNext(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback
  return raw
}

function failure(request: NextRequest, reason: string) {
  const url = new URL("/auth/reset-password", request.url)
  url.searchParams.set("error", reason)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const next = safeNext(searchParams.get("next"), "/auth/reset-password")
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const supabase = await createClient()

  // PKCE flow: Supabase redirects here with ?code= and the verifier lives in a
  // cookie set when the reset was requested.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.log("[v0] auth/callback exchangeCodeForSession failed:", error.message)
      // A PKCE failure usually means the link was opened in a different browser
      // than the one that requested it, so say that rather than "invalid link".
      return failure(request, "exchange")
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  // Verification flow: no verifier needed, so this survives opening the link on
  // another device.
  if (tokenHash && type) {
    if (!ALLOWED_TYPES.has(type)) {
      return failure(request, "type")
    }
    const { error } = await supabase.auth.verifyOtp({
      type: type as "recovery" | "invite" | "signup" | "magiclink" | "email" | "email_change",
      token_hash: tokenHash,
    })
    if (error) {
      console.log("[v0] auth/callback verifyOtp failed:", error.message)
      return failure(request, "expired")
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  return failure(request, "missing")
}
