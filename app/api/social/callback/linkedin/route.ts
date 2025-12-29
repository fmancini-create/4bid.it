import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_auth_failed`)
  }

  try {
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
      throw new Error("Failed to get access token")
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in // in secondi

    // Ottieni info profilo
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error("Failed to get profile")
    }

    const profile = await profileResponse.json()

    // Salva l'account nel database
    const supabase = await createClient()

    // Rimuovi account LinkedIn esistenti
    await supabase.from("social_accounts").delete().eq("platform", "linkedin")

    // Inserisci il nuovo account
    const { error: insertError } = await supabase.from("social_accounts").insert({
      platform: "linkedin",
      account_name: profile.name || profile.email || "LinkedIn Account",
      account_id: profile.sub,
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      is_active: true,
    })

    if (insertError) {
      throw insertError
    }

    return NextResponse.redirect(`${baseUrl}/admin/social-media?success=linkedin_connected`)
  } catch (error) {
    console.error("LinkedIn OAuth error:", error)
    return NextResponse.redirect(`${baseUrl}/admin/social-media?error=linkedin_auth_failed`)
  }
}
