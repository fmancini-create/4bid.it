import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const LINKEDIN_ORGANIZATION_ID = "110665381"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"

  if (error || !code) {
    console.error("[v0] LinkedIn OAuth error:", error)
    return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_auth_failed`)
  }

  try {
    console.log("[v0] LinkedIn OAuth: exchanging code for token")

    // Scambia il code per un access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/social/callback/linkedin`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] LinkedIn token error:", errorText)
      throw new Error("Failed to get access token")
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in // in secondi

    console.log("[v0] LinkedIn OAuth: got access token")

    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    let personUrn = ""
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      personUrn = profileData.sub || "" // sub contains the person ID
      console.log("[v0] LinkedIn person URN:", personUrn)
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Rimuovi account LinkedIn esistenti
    await supabase.from("social_accounts").delete().eq("platform", "linkedin")

    const { error: insertError } = await supabase.from("social_accounts").insert({
      platform: "linkedin",
      account_name: "4BID (Pagina Aziendale)",
      account_id: LINKEDIN_ORGANIZATION_ID, // Organization ID per pagina aziendale
      page_id: personUrn, // Person URN per fallback su profilo personale
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      is_active: true,
    })

    if (insertError) {
      console.error("[v0] LinkedIn insert error:", insertError)
      throw insertError
    }

    console.log("[v0] LinkedIn saved - Organization ID:", LINKEDIN_ORGANIZATION_ID, "Person URN:", personUrn)
    return NextResponse.redirect(`${baseUrl}/admin/social-media?success=linkedin_connected`)
  } catch (error) {
    console.error("[v0] LinkedIn OAuth error:", error)
    return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_auth_failed`)
  }
}
