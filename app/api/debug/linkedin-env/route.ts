import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  return NextResponse.json({
    clientIdPresent: !!clientId,
    clientIdMatches: clientId === "7754xe7rvdsbix",
    clientIdPreview: clientId ? `${clientId.substring(0, 4)}...${clientId.substring(clientId.length - 4)}` : null,
    clientSecretPresent: !!clientSecret,
    clientSecretLength: clientSecret?.length || 0,
    siteUrl: siteUrl || "not set",
    redirectUri: `${siteUrl || "https://www.4bid.it"}/api/social/callback/linkedin`,
  })
}
