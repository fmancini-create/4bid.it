import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const LINKEDIN_ORGANIZATION_ID = "110665381"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"

  console.log("[v0] LinkedIn callback - code:", code ? "present" : "missing")
  console.log("[v0] LinkedIn callback - error:", error)
  console.log("[v0] LinkedIn callback - errorDescription:", errorDescription)

  if (error || !code) {
    console.error("[v0] LinkedIn OAuth error:", error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/admin/social-media?error=linkedin_auth_failed&reason=${encodeURIComponent(error || "no_code")}`,
    )
  }

  try {
    const redirectUri = `${baseUrl}/api/social/callback/linkedin`
    console.log("[v0] LinkedIn OAuth: exchanging code for token")
    console.log("[v0] LinkedIn redirect_uri for token:", redirectUri)
    console.log("[v0] LinkedIn client_id:", process.env.LINKEDIN_CLIENT_ID ? "present" : "missing")
    console.log("[v0] LinkedIn client_secret:", process.env.LINKEDIN_CLIENT_SECRET ? "present" : "missing")

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
        redirect_uri: redirectUri,
      }),
    })

    const tokenText = await tokenResponse.text()
    console.log("[v0] LinkedIn token response status:", tokenResponse.status)
    console.log("[v0] LinkedIn token response:", tokenText)

    if (!tokenResponse.ok) {
      console.error("[v0] LinkedIn token error:", tokenText)
      return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_token_failed`)
    }

    const tokenData = JSON.parse(tokenText)
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in // in secondi

    console.log("[v0] LinkedIn OAuth: got access token, expires in:", expiresIn)

    // Ottieni info profilo
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    let userName = "4BID"
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      userName = profileData.name || profileData.given_name || "4BID"
      console.log("[v0] LinkedIn user:", userName)
    } else {
      console.log("[v0] LinkedIn profile fetch failed:", profileResponse.status)
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Rimuovi account LinkedIn esistenti
    const { error: deleteError } = await supabase.from("social_accounts").delete().eq("platform", "linkedin")
    if (deleteError) {
      console.log("[v0] LinkedIn delete error (non-fatal):", deleteError)
    }

    const { error: insertError } = await supabase.from("social_accounts").insert({
      platform: "linkedin",
      account_name: `${userName} (Pagina 4BID)`,
      account_id: LINKEDIN_ORGANIZATION_ID,
      page_id: LINKEDIN_ORGANIZATION_ID,
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      is_active: true,
    })

    if (insertError) {
      console.error("[v0] LinkedIn insert error:", insertError)
      return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_save_failed`)
    }

    console.log("[v0] LinkedIn saved successfully - Organization ID:", LINKEDIN_ORGANIZATION_ID)
    return NextResponse.redirect(`${baseUrl}/admin/social-media?success=linkedin_connected`)
  } catch (error) {
    console.error("[v0] LinkedIn OAuth exception:", error)
    return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_auth_failed&reason=exception`)
  }
}
