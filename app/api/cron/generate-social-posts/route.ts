import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Verifica autorizzazione cron
    const authHeader = request.headers.get("authorization")
    const cronSecret = request.headers.get("x-vercel-cron-secret")

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      cronSecret === process.env.CRON_SECRET ||
      process.env.NODE_ENV === "development"

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const supabase = await createClient()

    // Recupera impostazioni
    const { data: settings } = await supabase.from("social_settings").select("*").single()

    if (!settings?.auto_generate_enabled) {
      return NextResponse.json({ message: "Auto-generation disabled" })
    }

    // Controlla se è il momento di generare
    const lastGenerated = settings.last_auto_generated_at ? new Date(settings.last_auto_generated_at) : new Date(0)

    const daysSinceLastGeneration = Math.floor((Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastGeneration < settings.posting_frequency_days) {
      return NextResponse.json({
        message: "Not time yet",
        daysSinceLastGeneration,
        frequencyDays: settings.posting_frequency_days,
      })
    }

    // Recupera contesto dal knowledge base
    const { data: knowledge } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("is_active", true)
      .limit(5)

    const knowledgeContext = knowledge?.map((k) => `${k.title}: ${k.content}`).join("\n") || ""

    // Scegli un topic casuale
    const topics = settings.topics || ["revenue management", "hospitality", "hotel technology"]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    const toneInstructions = {
      professional: "Usa un tono professionale e autorevole.",
      casual: "Usa un tono amichevole e accessibile.",
      inspirational: "Usa un tono motivazionale e ispirante.",
    }

    // Genera il post con AI
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Sei il social media manager di 4BID, società italiana specializzata in Revenue Management per hotel e sviluppo di prodotti tecnologici innovativi.

Contesto:
${knowledgeContext}

Genera un post per social media su: "${randomTopic}"

Requisiti:
- ${toneInstructions[settings.tone as keyof typeof toneInstructions] || toneInstructions.professional}
- 150-280 caratteri
- Deve incuriosire e generare interazione
- Scrivi in italiano
${settings.include_hashtags ? `- Aggiungi hashtag: ${settings.default_hashtags?.join(" ") || "#4BID #RevenueManagement"}` : ""}

Rispondi SOLO con il testo del post.`,
      maxTokens: 500,
    })

    // Salva il post generato
    const { data: newPost, error } = await supabase
      .from("social_posts")
      .insert({
        content: text.trim(),
        platforms: ["facebook", "instagram", "linkedin"],
        status: "pending_approval",
        is_ai_generated: true,
        ai_topic: randomTopic,
        auto_publish: false,
        requires_approval: true,
        hashtags: text.match(/#\w+/g) || [],
      })
      .select()
      .single()

    if (error) throw error

    // Aggiorna timestamp ultima generazione
    await supabase
      .from("social_settings")
      .update({ last_auto_generated_at: new Date().toISOString() })
      .eq("id", settings.id)

    return NextResponse.json({
      success: true,
      post: newPost,
      topic: randomTopic,
    })
  } catch (error) {
    console.error("[v0] Error in cron generate-social-posts:", error)
    return NextResponse.json({ error: "Errore nella generazione" }, { status: 500 })
  }
}
