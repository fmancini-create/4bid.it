import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { platform, pageId, pageName, accessToken } = await request.json()

    if (!platform || !pageId || !pageName || !accessToken) {
      return NextResponse.json({ error: "Tutti i campi sono obbligatori" }, { status: 400 })
    }

    // Crea client Supabase con service role per bypassare RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Verifica il token con Facebook (opzionale ma consigliato)
    if (platform === "facebook" || platform === "instagram") {
      try {
        const verifyResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?access_token=${accessToken}`)
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json()
          console.error("Facebook token verification failed:", errorData)
          return NextResponse.json(
            { error: "Token non valido o Page ID errato. Verifica i dati inseriti." },
            { status: 400 },
          )
        }
      } catch (error) {
        console.error("Error verifying Facebook token:", error)
        // Continua comunque, potrebbe essere un problema di rete
      }
    }

    // Elimina account esistente per questa piattaforma
    await supabaseAdmin.from("social_accounts").delete().eq("platform", platform)

    // Inserisci nuovo account
    const { data: account, error: insertError } = await supabaseAdmin
      .from("social_accounts")
      .insert({
        platform,
        account_name: pageName,
        account_id: pageId,
        page_id: pageId,
        access_token: accessToken,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: "Errore durante il salvataggio: " + insertError.message }, { status: 500 })
    }

    console.log("[v0] Manual connection saved successfully:", platform, pageName)

    return NextResponse.json({ success: true, account })
  } catch (error) {
    console.error("Manual connect error:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
