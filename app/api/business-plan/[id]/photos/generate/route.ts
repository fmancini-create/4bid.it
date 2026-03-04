import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { fal } from "@fal-ai/client"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

const AREA_PROMPTS: Record<string, string> = {
  building: "luxury hotel exterior facade, elegant architecture, professional photography, 4K quality",
  rooms: "luxury hotel room interior, elegant furniture, warm lighting, professional photography, 4K quality",
  common_areas:
    "luxury hotel lobby and common areas, elegant design, warm atmosphere, professional photography, 4K quality",
  spa: "luxury hotel spa and wellness center, relaxing atmosphere, modern design, professional photography, 4K quality",
  restaurant:
    "upscale hotel restaurant interior, fine dining, elegant table settings, professional photography, 4K quality",
  congress:
    "modern hotel conference center, professional meeting rooms, contemporary design, professional photography, 4K quality",
  garden:
    "beautiful hotel gardens and outdoor areas, landscaped grounds, sunset lighting, professional photography, 4K quality",
}

const AREA_NAMES: Record<string, string> = {
  building: "Edificio",
  rooms: "Camere",
  common_areas: "Aree Comuni",
  spa: "SPA",
  restaurant: "Ristorante",
  congress: "Centro Congressi",
  garden: "Giardino/Esterni",
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { area } = body

  if (!area || !AREA_PROMPTS[area]) {
    return NextResponse.json({ error: "Area non valida" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Recupera i dati del business plan per personalizzare il prompt
  const { data: plan } = await supabase.from("business_plans").select("*").eq("id", id).single()

  if (!plan) {
    return NextResponse.json({ error: "Business plan non trovato" }, { status: 404 })
  }

  // Conta le foto esistenti per questa area
  const { count } = await supabase
    .from("business_plan_photos")
    .select("*", { count: "exact", head: true })
    .eq("business_plan_id", id)
    .eq("area", area)

  if ((count || 0) >= 3) {
    return NextResponse.json({ error: "Massimo 3 foto per area" }, { status: 400 })
  }

  // Costruisci prompt personalizzato basato sui dati del business plan
  let customPrompt = AREA_PROMPTS[area]

  // Aggiungi dettagli specifici del progetto
  if (plan.location) {
    customPrompt += `, ${plan.location} Italy style`
  }
  if (plan.stars) {
    customPrompt += `, ${plan.stars}-star hotel quality`
  }
  if (plan.project_type === "ristrutturazione") {
    customPrompt += ", renovated historic building, blend of classic and modern"
  } else if (plan.project_type === "sviluppo") {
    customPrompt += ", new construction, contemporary architecture"
  }

  // Dettagli specifici per area
  if (area === "rooms" && plan.num_rooms) {
    customPrompt += `, spacious ${plan.stars >= 4 ? "suite" : "room"}`
  }
  if (area === "spa" && plan.has_spa) {
    customPrompt += ", wellness center with pool and treatment rooms"
  }
  if (area === "restaurant" && plan.has_restaurant) {
    customPrompt += ", gourmet restaurant with local cuisine"
  }
  if (area === "congress" && plan.has_congress) {
    customPrompt += ", equipped meeting rooms and conference hall"
  }

  console.log("[v0] Generating image with prompt:", customPrompt)

  try {
    // Genera immagine con fal
    const result = (await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: customPrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
      },
    })) as { images?: { url: string }[] }

    const imageUrl = result.images?.[0]?.url

    if (!imageUrl) {
      throw new Error("No image generated")
    }

    console.log("[v0] Image generated:", imageUrl)

    // Salva nel database
    const { data: photo, error } = await supabase
      .from("business_plan_photos")
      .insert({
        business_plan_id: id,
        area,
        photo_url: imageUrl,
        is_ai_generated: true,
        ai_prompt: customPrompt,
        sort_order: count || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving photo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ photo, imageUrl })
  } catch (error) {
    console.error("[v0] Error generating image:", error)
    return NextResponse.json({ error: "Errore nella generazione dell'immagine" }, { status: 500 })
  }
}
