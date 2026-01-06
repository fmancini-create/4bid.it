import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/social/callback/linkedin`

  if (!clientId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/social-media?error=linkedin_not_configured`)
  }

  const scope = "openid profile email w_member_social w_organization_social"

  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization")
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", scope)
  authUrl.searchParams.set("state", crypto.randomUUID())

  return NextResponse.redirect(authUrl.toString())
}
