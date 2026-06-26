import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID

  if (!appId) {
    return NextResponse.json({ error: "FACEBOOK_APP_ID non configurato" }, { status: 500 })
  }

  // Se ?new=1, forza il login screen per aggiungere un altro account
  const forceNew = request.nextUrl.searchParams.get("new") === "1"

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"}/api/social/callback/facebook`

  // Per pubblicare serve richiedere l'approvazione dei permessi avanzati su Facebook
  const scope = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "public_profile"].join(",")

  const params: Record<string, string> = {
    client_id: appId,
    redirect_uri: redirectUri,
    scope,
    response_type: "code",
  }

  // auth_type=reauthenticate forza Facebook a mostrare il login screen
  if (forceNew) {
    params.auth_type = "reauthenticate"
  }

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams(params)

  return NextResponse.redirect(authUrl)
}
