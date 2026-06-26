import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Redirect base URL
  const redirectUrl = new URL("/admin/social-media", request.url)

  console.log("[v0] Facebook callback started, code:", code ? "present" : "missing")

  if (error) {
    console.log("[v0] Facebook OAuth error:", error, errorDescription)
    redirectUrl.searchParams.set("error", errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    redirectUrl.searchParams.set("error", "Codice di autorizzazione mancante")
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

    // Ottieni le pagine gestite dall'utente
    console.log("[v0] Fetching pages...")
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`,
      { method: "GET" },
    )

    const pagesData = await pagesResponse.json()
    console.log(
      "[v0] Pages found:",
      pagesData.data?.length || 0,
      pagesData.data?.map((p: any) => p.name),
    )

    if (!pagesData.data || pagesData.data.length === 0) {
      redirectUrl.searchParams.set("error", "Nessuna pagina Facebook trovata. Assicurati di gestire almeno una pagina.")
      return NextResponse.redirect(redirectUrl)
    }

    // Upsert: aggiorna gli account esistenti (stesso page_id) e aggiunge quelli nuovi
    // NON cancella gli account di altri login Facebook
    const pagesToUpsert = pagesData.data.map((page: any) => ({
      platform: "facebook" as const,
      account_name: page.name,
      account_id: page.id,
      page_id: page.id,
      access_token: page.access_token,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    }))

    console.log(
      "[v0] Upserting pages:",
      pagesToUpsert.map((p: any) => `${p.account_name} (${p.page_id})`),
    )

    let insertData: any[] = []
    let dbError: any = null

    for (const page of pagesToUpsert) {
      // Cerca se esiste gia' un account con stesso platform + account_id
      const { data: existing } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("platform", "facebook")
        .eq("account_id", page.account_id)
        .limit(1)
        .single()

      if (existing) {
        // Aggiorna token e nome
        const { error } = await supabase
          .from("social_accounts")
          .update({
            account_name: page.account_name,
            access_token: page.access_token,
            token_expires_at: page.token_expires_at,
            is_active: true,
            updated_at: page.updated_at,
          })
          .eq("id", existing.id)
        if (error) dbError = error
        console.log("[v0] Updated existing FB page:", page.account_name)
      } else {
        // Inserisci nuovo
        const { data, error } = await supabase
          .from("social_accounts")
          .insert({ ...page, created_at: new Date().toISOString() })
          .select()
        if (error) dbError = error
        if (data) insertData.push(...data)
        console.log("[v0] Added new FB page:", page.account_name)
      }
    }

    console.log("[v0] DB result:", dbError ? dbError.message : `${pagesToUpsert.length} pages processed`)

    if (dbError) throw dbError

    console.log("[v0] Checking for Instagram on all pages...")
    let instagramFound = false

    for (const page of pagesData.data) {
      if (instagramFound) break

      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
        { method: "GET" },
      )

      const igData = await igResponse.json()

      if (igData.instagram_business_account) {
        console.log("[v0] Instagram found linked to page:", page.name)
        instagramFound = true

        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=username&access_token=${page.access_token}`,
          { method: "GET" },
        )

        const igAccountData = await igAccountResponse.json()

        // Upsert: aggiorna se esiste gia' lo stesso account IG, altrimenti inserisci
        const { data: existingIg } = await supabase
          .from("social_accounts")
          .select("id")
          .eq("platform", "instagram")
          .eq("account_id", igData.instagram_business_account.id)
          .limit(1)
          .single()

        const igPayload = {
          platform: "instagram" as const,
          account_name: igAccountData.username || "Instagram Business",
          account_id: igData.instagram_business_account.id,
          access_token: page.access_token,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        }

        if (existingIg) {
          await supabase.from("social_accounts").update(igPayload).eq("id", existingIg.id)
          console.log("[v0] Updated existing IG account:", igPayload.account_name)
        } else {
          await supabase.from("social_accounts").insert({ ...igPayload, created_at: new Date().toISOString() })
          console.log("[v0] Added new IG account:", igPayload.account_name)
        }
      }
    }

    console.log("[v0] Facebook OAuth completed successfully! Pages saved:", pagesData.data.length)
    redirectUrl.searchParams.set("success", `Facebook collegato con successo! ${pagesData.data.length} pagine trovate.`)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("[v0] Facebook OAuth error:", error)
    redirectUrl.searchParams.set("error", `Errore: ${error instanceof Error ? error.message : "sconosciuto"}`)
    return NextResponse.redirect(redirectUrl)
  }
}
