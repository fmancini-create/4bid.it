import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"
  const redirectUri = `${baseUrl}/api/social/callback/linkedin`

  console.log("[v0] LinkedIn connect - clientId:", clientId ? "present" : "missing")
  console.log("[v0] LinkedIn connect - redirectUri:", redirectUri)

  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_not_configured`)
  }

  const scope = "openid profile email w_organization_social r_organization_social"

  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization")
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", scope)
  authUrl.searchParams.set("state", crypto.randomUUID())

  console.log("[v0] LinkedIn OAuth URL:", authUrl.toString())

  return NextResponse.redirect(authUrl.toString())
}
