import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Endpoint admin che triggera la sincronizzazione manuale del knowledge base
 * con i contenuti del sito (cron crawl-internal-guides).
 *
 * Esegue lo stesso lavoro del cron schedulato ogni 6 ore, ma su richiesta
 * dell'admin (utile dopo un deploy con modifiche ai contenuti).
 *
 * Sicurezza:
 *  - Richiede sessione utente super_admin (f.mancini@4bid.it)
 *  - Internamente invoca il cron route con header x-cron-secret
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.email !== "f.mancini@4bid.it") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET non configurato sull'ambiente" },
        { status: 500 },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it"
    const cronUrl = `${baseUrl}/api/cron/crawl-internal-guides`

    console.log("[v0] Manual KB sync triggered by", user.email, "calling", cronUrl)

    const response = await fetch(cronUrl, {
      method: "POST",
      headers: {
        "x-cron-secret": cronSecret,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[v0] Cron returned error:", result)
      return NextResponse.json(
        { error: result?.error || "Errore durante la sincronizzazione" },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Sincronizzazione completata: ${result.indexed} pagine indicizzate, ${result.skipped} invariate, ${result.errors} errori`,
      ...result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    console.error("[v0] sync-now error:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
