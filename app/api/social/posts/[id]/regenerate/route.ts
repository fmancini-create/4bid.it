import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

// POST: Regenerate text and/or image for a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = await params
    const { type } = await request.json() // 'text' | 'image' | 'both'

    if (!type || !["text", "image", "both"].includes(type)) {
      return NextResponse.json({ error: "type deve essere 'text', 'image' o 'both'" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch the post
    const { data: post, error: postError } = await admin
      .from("social_posts")
      .select("*")
      .eq("id", id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
    }

    if (!["draft", "pending_approval"].includes(post.status)) {
      return NextResponse.json({ error: "Si puo' rigenerare solo bozze o post in attesa di approvazione" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    // Regenerate text
    if (type === "text" || type === "both") {
      // Get topic rule for tone/hashtags
      let tone = "professional"
      let includeHashtags = true
      let defaultHashtags = ["#4BID", "#RevenueManagement"]

      if (post.ai_topic) {
        const { data: rule } = await admin
          .from("social_topic_rules")
          .select("tone, include_hashtags, default_hashtags")
          .eq("topic_name", post.ai_topic)
          .single()

        if (rule) {
          tone = rule.tone || tone
          includeHashtags = rule.include_hashtags ?? includeHashtags
          defaultHashtags = rule.default_hashtags?.length ? rule.default_hashtags : defaultHashtags
        }
      }

      // Get knowledge base
      const { data: knowledge } = await admin
        .from("knowledge_base")
        .select("title, content")
        .eq("is_active", true)
        .limit(5)

      const knowledgeContext = knowledge?.map(k => `${k.title}: ${k.content}`).join("\n") || ""

      const toneInstructions: Record<string, string> = {
        professional: "Usa un tono professionale e autorevole, adatto al settore hospitality.",
        casual: "Usa un tono amichevole e accessibile, ma mantieni credibilita'.",
        inspirational: "Usa un tono motivazionale e ispirante, che incoraggi all'azione.",
      }

      const prompt = `Sei il social media manager di 4BID. Riscrivi COMPLETAMENTE questo post social media con un nuovo testo DIVERSO sull'argomento "${post.ai_topic || "revenue management"}".

Testo precedente (NON riusarlo): "${post.content}"

Contesto: ${knowledgeContext}

Requisiti:
- ${toneInstructions[tone] || toneInstructions.professional}
- Lunghezza: 150-280 caratteri
- Deve essere completamente diverso dal testo precedente
- Scrivi in italiano
${includeHashtags ? `- Aggiungi 3-5 hashtag, includi: ${defaultHashtags.join(" ")}` : "- Non includere hashtag"}

Rispondi SOLO con il nuovo testo del post.`

      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        maxTokens: 500,
        temperature: 0.9,
      })

      updateData.content = text.trim()
    }

    // Regenerate image
    if (type === "image" || type === "both") {
      let imageStylePrompt = "professional social media post, high quality, modern design"

      if (post.ai_topic) {
        const { data: rule } = await admin
          .from("social_topic_rules")
          .select("image_style_prompt")
          .eq("topic_name", post.ai_topic)
          .single()

        if (rule?.image_style_prompt) {
          imageStylePrompt = rule.image_style_prompt
        }
      }

      try {
        const falResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.FAL_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: `${imageStylePrompt}, high quality, modern design`,
            image_size: "landscape_16_9",
            num_images: 1,
          }),
        })

        if (falResponse.ok) {
          const falData = await falResponse.json()
          const newImageUrl = falData.images?.[0]?.url
          if (newImageUrl) {
            updateData.image_url = newImageUrl
          }
        }
      } catch (imgErr) {
        console.error("[v0] Image regeneration failed:", imgErr)
        // Don't fail the whole request, just skip image
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nessuna rigenerazione effettuata" }, { status: 400 })
    }

    const { data: updated, error: updateError } = await admin
      .from("social_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[v0] Error regenerating post:", error)
    return NextResponse.json({ error: "Errore nella rigenerazione" }, { status: 500 })
  }
}
