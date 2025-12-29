import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { topic, tone, includeHashtags, defaultHashtags } = await request.json()

    // Recupera informazioni dal knowledge base per contesto
    const { data: knowledge } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("is_active", true)
      .limit(5)

    const knowledgeContext = knowledge?.map((k) => `${k.title}: ${k.content}`).join("\n") || ""

    const toneInstructions = {
      professional: "Usa un tono professionale e autorevole, adatto al settore hospitality.",
      casual: "Usa un tono amichevole e accessibile, ma mantieni credibilità.",
      inspirational: "Usa un tono motivazionale e ispirante, che incoraggi all'azione.",
    }

    const prompt = `Sei il social media manager di 4BID, una società italiana specializzata in:
- Revenue Management per hotel
- Consulenza nel settore hospitality
- Sviluppo di prodotti tecnologici innovativi come Hotel Accelerator, Manubot, Santaddeo

Contesto aziendale:
${knowledgeContext}

Genera un post per i social media (Facebook, Instagram, LinkedIn) su questo argomento: "${topic || "revenue management e hospitality"}"

Requisiti:
- ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
- Lunghezza: 150-280 caratteri (ottimale per engagement)
- Deve incuriosire e generare interazione
- Può includere una domanda o call-to-action
- Scrivi in italiano
${includeHashtags ? `- Aggiungi 3-5 hashtag pertinenti alla fine, includi: ${defaultHashtags?.join(" ") || "#4BID #RevenueManagement"}` : "- Non includere hashtag"}

Rispondi SOLO con il testo del post, senza introduzioni o spiegazioni.`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxTokens: 500,
    })

    return NextResponse.json({ content: text.trim() })
  } catch (error) {
    console.error("[v0] Error generating post:", error)
    return NextResponse.json({ error: "Errore nella generazione" }, { status: 500 })
  }
}
