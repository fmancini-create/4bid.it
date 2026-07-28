import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"

// The login form used to declare "Accesso effettuato" as soon as the browser SDK
// resolved, but the SDK keeps the session in memory: if the cookie it wrote is
// unreadable server-side (stale/truncated/chunked leftovers), the proxy guarding
// /admin bounces straight back to the login page. This endpoint lets the form ask
// the SERVER whether the session actually survived the round trip, so success is
// confirmed instead of assumed.
export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } })
  }

  const isSuperAdmin = isSuperAdminEmail(user.email)

  return NextResponse.json(
    { authenticated: true, isSuperAdmin, email: user.email },
    { headers: { "Cache-Control": "no-store" } },
  )
}
