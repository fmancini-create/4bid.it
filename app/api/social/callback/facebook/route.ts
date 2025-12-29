import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Redirect base URL
  const redirectUrl = new URL("/admin/social-media", request.url)

  console.log("[v0] Facebook callback started")
  console.log("[v0] Code:", code ? "present" : "missing")
  console.log("[v0] Error:", error)

  if (error) {
    redirectUrl.searchParams.set("error", errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    redirectUrl.searchParams.set("error", "Codice di autorizzazione mancante")
    return NextResponse.redirect(redirectUrl)
  }

  try {
    console.log("[v0] Exchanging code for token...")

    // Scambia il code per un access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"}/api/social/callback/facebook`,
          code,
        }),
      { method: "GET" },
    )

    const tokenData = await tokenResponse.json()
    console.log("[v0] Token response:", tokenData.error ? tokenData.error : "success")

    if (tokenData.error) {
      throw new Error(tokenData.error.message)
    }

    console.log("[v0] Getting long-lived token...")

    // Ottieni un long-lived token (valido ~60 giorni)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          fb_exchange_token: tokenData.access_token,
        }),
      { method: "GET" },
    )

    const longLivedData = await longLivedResponse.json()
    console.log("[v0] Long-lived token:", longLivedData.error ? longLivedData.error : "success")

    console.log("[v0] Fetching user pages...")

    // Ottieni le pagine gestite dall'utente
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`,
      { method: "GET" },
    )

    const pagesData = await pagesResponse.json()
    console.log("[v0] Pages found:", pagesData.data?.length || 0)

    if (!pagesData.data || pagesData.data.length === 0) {
      redirectUrl.searchParams.set(
        "error",
        "Nessuna pagina Facebook trovata. Assicurati di avere una pagina Facebook e di aver dato i permessi.",
      )
      return NextResponse.redirect(redirectUrl)
    }

    // Prendi la prima pagina
    const page = pagesData.data[0]
    console.log("[v0] Using page:", page.name)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("[v0] Saving to database...")

    const { error: deleteError } = await supabase.from("social_accounts").delete().eq("platform", "facebook")

    if (deleteError) {
      console.log("[v0] Delete error (ignorable):", deleteError.message)
    }

    const { data: insertData, error: dbError } = await supabase
      .from("social_accounts")
      .insert({
        platform: "facebook",
        account_name: page.name,
        account_id: page.id,
        page_id: page.id,
        access_token: page.access_token,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      throw dbError
    }

    console.log("[v0] Facebook account saved:", insertData)

    // Controlla se la pagina ha Instagram collegato
    console.log("[v0] Checking for Instagram...")
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
      { method: "GET" },
    )

    const igData = await igResponse.json()
    console.log("[v0] Instagram data:", igData.instagram_business_account ? "found" : "not found")

    if (igData.instagram_business_account) {
      const igAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=username&access_token=${page.access_token}`,
        { method: "GET" },
      )

      const igAccountData = await igAccountResponse.json()

      // Elimina e reinserisci Instagram
      await supabase.from("social_accounts").delete().eq("platform", "instagram")

      await supabase.from("social_accounts").insert({
        platform: "instagram",
        account_name: igAccountData.username || "Instagram Business",
        account_id: igData.instagram_business_account.id,
        access_token: page.access_token,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      console.log("[v0] Instagram account saved")
    }

    redirectUrl.searchParams.set("success", "Facebook collegato con successo!")
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("[v0] Facebook OAuth error:", error)
    redirectUrl.searchParams.set("error", `Errore: ${error instanceof Error ? error.message : "Sconosciuto"}`)
    return NextResponse.redirect(redirectUrl)
  }
}
