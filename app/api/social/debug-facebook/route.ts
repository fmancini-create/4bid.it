import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifyFacebookToken } from "@/lib/social/facebook"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Recupera tutti gli account Facebook
    const { data: accounts, error } = await supabase.from("social_accounts").select("*").eq("platform", "facebook")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        status: "no_accounts",
        message: "Nessun account Facebook trovato. Riconnetti Facebook.",
      })
    }

    const results = []

    for (const account of accounts) {
      const tokenValid = await verifyFacebookToken(account.access_token)

      // Test API call to get page info
      let pageInfo = null
      let pageError = null

      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${account.page_id}?fields=id,name,access_token&access_token=${account.access_token}`,
        )
        pageInfo = await response.json()
      } catch (e) {
        pageError = String(e)
      }

      results.push({
        account_name: account.account_name,
        page_id: account.page_id,
        account_id: account.account_id,
        token_length: account.access_token?.length || 0,
        token_valid: tokenValid,
        token_expires_at: account.token_expires_at,
        page_info: pageInfo,
        page_error: pageError,
      })
    }

    return NextResponse.json({
      status: "ok",
      facebook_app_id: process.env.FACEBOOK_APP_ID ? "configured" : "MISSING",
      facebook_app_secret: process.env.FACEBOOK_APP_SECRET ? "configured" : "MISSING",
      accounts: results,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
