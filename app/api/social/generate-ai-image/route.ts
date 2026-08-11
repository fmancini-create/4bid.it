import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import { put } from "@vercel/blob"

fal.config({ credentials: process.env.FAL_KEY })

/**
 * Generazione di una VERA immagine con l'AI per un post social.
 *
 * NOTA: a differenza di /api/social/generate-image (che restituisce il logo
 * reale del brand), qui creiamo un'illustrazione a tema col testo del post.
 * L'AI NON riproduce fedelmente i loghi: per il marchio usare il pulsante logo.
 *
 * L'immagine di fal e' su URL temporaneo -> la ricarichiamo su Vercel Blob per
 * renderla permanente (le pubblicazioni social avvengono anche in un secondo
 * momento e devono trovare l'immagine ancora online).
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

    const { prompt } = await request.json()
    const cleanPrompt = (prompt || "").toString().trim()

    if (!cleanPrompt) {
      return NextResponse.json({ error: "Descrivi cosa generare" }, { status: 400 })
    }

    // Prompt arricchito: stile pulito, professionale, adatto ai social.
    const fullPrompt = `Professional social media illustration for a business post about: ${cleanPrompt}. Modern, clean, corporate style, vibrant but tasteful colors, high quality, no text, no watermark, no logo.`

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: fullPrompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      },
    })

    const falUrl = result.data?.images?.[0]?.url
    if (!falUrl) {
      throw new Error("Nessuna immagine generata")
    }

    // Scarica e ricarica su Blob (permanenza).
    const imgRes = await fetch(falUrl)
    if (!imgRes.ok) throw new Error("Download immagine generata fallito")
    const blobData = await imgRes.blob()

    const uploaded = await put(`social/ai/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`, blobData, {
      access: "public",
      contentType: "image/jpeg",
    })

    console.log("[v0] Social AI image generated + stored:", uploaded.url)

    return NextResponse.json({ imageUrl: uploaded.url })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    console.error("[v0] Error generating AI social image:", errorMessage)
    return NextResponse.json(
      { error: `Generazione immagine non riuscita: ${errorMessage}` },
      { status: 500 },
    )
  }
}
