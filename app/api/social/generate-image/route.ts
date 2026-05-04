import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"
import { put } from "@vercel/blob"

// Aumenta il timeout: flux/schnell richiede 5-15s + upload su Blob
export const maxDuration = 60

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Generate image API called")

    if (!process.env.FAL_KEY) {
      console.error("[v0] FAL_KEY env var missing")
      return NextResponse.json(
        { error: "Servizio AI non configurato (FAL_KEY mancante)" },
        { status: 500 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] Generate image: user not authenticated")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { topic, style } = await request.json()
    console.log("[v0] Generate image request:", { topic, style })

    if (!topic) {
      return NextResponse.json({ error: "Topic richiesto" }, { status: 400 })
    }

    // Costruisci il prompt per l'immagine in base al topic e allo stile
    const stylePrompts: Record<string, string> = {
      professional: "corporate, clean, modern, professional photography style, business aesthetic",
      creative: "artistic, creative, vibrant colors, dynamic composition, eye-catching",
      minimal: "minimalist, clean lines, simple, elegant, white space, modern design",
      luxury: "luxurious, high-end, premium, sophisticated, elegant, refined",
    }

    const styleModifier = stylePrompts[style] || stylePrompts.professional

    const prompt = `${topic}, ${styleModifier}, high quality, social media post image, 4K, detailed, no text overlay, suitable for business social media`

    console.log("[v0] Generating image with prompt:", prompt)

    // Generate image using fal schnell model
    const result = (await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
      },
    })) as { images?: { url: string }[] }

    const falImageUrl = result.images?.[0]?.url

    if (!falImageUrl) {
      console.error("[v0] Fal AI returned no image:", JSON.stringify(result))
      return NextResponse.json(
        { error: "Nessuna immagine generata dal modello AI" },
        { status: 502 },
      )
    }

    console.log("[v0] Generated image URL from fal:", falImageUrl)

    // L'URL di fal e' temporaneo (CDN che scade). Salviamo su Vercel Blob per persistenza.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const imgResponse = await fetch(falImageUrl)
        if (!imgResponse.ok) {
          throw new Error(`Fetch fal image failed: ${imgResponse.status}`)
        }
        const imgBlob = await imgResponse.blob()
        const blob = await put(`social-media/${Date.now()}-${user.id}.jpg`, imgBlob, {
          access: "public",
          contentType: "image/jpeg",
        })
        console.log("[v0] Image saved to Blob:", blob.url)
        return NextResponse.json({ imageUrl: blob.url })
      } catch (blobError) {
        console.error("[v0] Blob upload failed, returning fal URL:", blobError)
        // Fallback: ritorna l'URL fal originale (anche se temporaneo)
        return NextResponse.json({ imageUrl: falImageUrl })
      }
    }

    return NextResponse.json({ imageUrl: falImageUrl })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    console.error("[v0] Error generating image:", errorMessage, error)
    return NextResponse.json(
      { error: `Errore nella generazione dell'immagine: ${errorMessage}` },
      { status: 500 },
    )
  }
}
