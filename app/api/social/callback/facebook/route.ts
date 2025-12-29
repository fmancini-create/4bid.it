import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Redirect base URL
  const redirectUrl = new URL("/admin/social-media", request.url)

  if (error) {
    redirectUrl.searchParams.set("error", errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    redirectUrl.searchParams.set("error", "Codice di autorizzazione mancante")
    return NextResponse.redirect(redirectUrl)
  }

  try {
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

    if (tokenData.error) {
      throw new Error(tokenData.error.message)
    }

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

    // Ottieni le pagine gestite dall'utente
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`,
      { method: "GET" },
    )

    const pagesData = await pagesResponse.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      redirectUrl.searchParams.set("error", "Nessuna pagina Facebook trovata")
      return NextResponse.redirect(redirectUrl)
    }

    // Prendi la prima pagina (o puoi permettere all'utente di scegliere)
    const page = pagesData.data[0]

    // Salva nel database
    const supabase = await createClient()

    const { error: dbError } = await supabase.from("social_accounts").upsert(
      {
        platform: "facebook",
        account_name: page.name,
        account_id: page.id,
        page_id: page.id,
        access_token: page.access_token, // Page access token (long-lived)
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // ~60 giorni
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform" },
    )

    if (dbError) throw dbError

    // Controlla se la pagina ha Instagram collegato
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
      { method: "GET" },
    )

    const igData = await igResponse.json()

    if (igData.instagram_business_account) {
      // Salva anche l'account Instagram
      const igAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=username&access_token=${page.access_token}`,
        { method: "GET" },
      )

      const igAccountData = await igAccountResponse.json()

      await supabase.from("social_accounts").upsert(
        {
          platform: "instagram",
          account_name: igAccountData.username || "Instagram Business",
          account_id: igData.instagram_business_account.id,
          access_token: page.access_token, // Usa lo stesso token della pagina
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform" },
      )
    }

    redirectUrl.searchParams.set("success", "Facebook collegato con successo!")
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("[v0] Facebook OAuth error:", error)
    redirectUrl.searchParams.set("error", "Errore durante il collegamento")
    return NextResponse.redirect(redirectUrl)
  }
}
