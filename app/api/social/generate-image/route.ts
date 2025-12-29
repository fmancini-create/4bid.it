import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { topic, style } = await request.json()

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

    // Generate image using fal schnell model
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_16_9", // Formato ottimale per social media
        num_inference_steps: 4,
        num_images: 1,
      },
    })

    // Extract the image URL from the result
    const imageUrl = (result as { images?: { url: string }[] }).images?.[0]?.url

    if (!imageUrl) {
      throw new Error("Nessuna immagine generata")
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("[v0] Error generating image:", error)
    return NextResponse.json({ error: "Errore nella generazione dell'immagine" }, { status: 500 })
  }
}
