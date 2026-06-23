import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { resolveBrand, toAbsoluteAssetUrl } from "@/lib/social/brand-assets"

/**
 * "Immagine" per un post social.
 *
 * REGOLA: niente immagini generate dall'AI. Restituiamo SEMPRE un asset reale
 * (logo / og-image ufficiale) scelto in base al brand indicato da topic/link.
 * Manteniamo il contratto { imageUrl } usato dalla dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { topic, linkUrl, notes } = await request.json()

    const brand = resolveBrand({ topic, linkUrl, notes })
    const imageUrl = toAbsoluteAssetUrl(brand.asset)

    console.log("[v0] Social image resolved to real asset:", { brand: brand.key, imageUrl })

    return NextResponse.json({ imageUrl, brand: brand.key })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    console.error("[v0] Error resolving brand image:", errorMessage)
    return NextResponse.json(
      { error: `Errore nella selezione dell'immagine: ${errorMessage}` },
      { status: 500 },
    )
  }
}
