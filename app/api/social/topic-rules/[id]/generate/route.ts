import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { generateBatchSchedule } from "@/lib/social/scheduling"

export const maxDuration = 120 // 2 minuti per generare batch AI + immagini

// POST: Trigger batch generation for a single topic rule
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = await params
    const admin = createAdminClient()

    // Fetch the topic rule
    const { data: rule, error: ruleError } = await admin
      .from("social_topic_rules")
      .select("*")
      .eq("id", id)
      .single()

    if (ruleError || !rule) {
      return NextResponse.json({ error: "Regola non trovata" }, { status: 404 })
    }

    // Count existing pending/scheduled posts for this topic
    const { count: existingCount } = await admin
      .from("social_posts")
      .select("*", { count: "exact", head: true })
      .eq("ai_topic", rule.topic_name)
      .in("status", ["pending_approval", "scheduled"])
      .gte("scheduled_for", new Date().toISOString())

    const currentQueue = existingCount || 0
    const toGenerate = Math.max(0, (rule.batch_size || 5) - currentQueue)

    console.log("[v0] Generate batch:", { topicName: rule.topic_name, batchSize: rule.batch_size, currentQueue, toGenerate })

    if (toGenerate === 0) {
      return NextResponse.json({
        message: `Coda gia' piena per "${rule.topic_name}" (${currentQueue} post in coda)`,
        generated: 0,
      })
    }

    // Get the last scheduled_for for this topic
    const { data: lastPost } = await admin
      .from("social_posts")
      .select("scheduled_for")
      .eq("ai_topic", rule.topic_name)
      .not("scheduled_for", "is", null)
      .order("scheduled_for", { ascending: false })
      .limit(1)
      .single()

    const lastScheduledFor = lastPost?.scheduled_for ? new Date(lastPost.scheduled_for) : null

    // Get ALL existing scheduled_for dates for anti-collision
    const { data: allScheduled } = await admin
      .from("social_posts")
      .select("scheduled_for")
      .in("status", ["pending_approval", "scheduled"])
      .not("scheduled_for", "is", null)
      .gte("scheduled_for", new Date().toISOString())

    const existingSchedules = (allScheduled || []).map(p => new Date(p.scheduled_for))

    // Generate batch schedule slots
    const slots = generateBatchSchedule(
      {
        frequency_days: rule.frequency_days,
        time_windows: rule.time_windows || [{ start: "09:30", end: "11:30" }, { start: "15:00", end: "18:00" }],
        exclude_weekdays: rule.exclude_weekdays || [0],
      },
      toGenerate,
      lastScheduledFor,
      existingSchedules,
    )

    // Fetch knowledge base for AI context
    const { data: knowledge } = await admin
      .from("knowledge_base")
      .select("title, content")
      .eq("is_active", true)
      .limit(5)

    const knowledgeContext = knowledge?.map(k => `${k.title}: ${k.content}`).join("\n") || ""

    const toneInstructions: Record<string, string> = {
      professional: "Usa un tono professionale e autorevole, adatto al settore hospitality.",
      friendly: "Usa un tono amichevole e accessibile, ma mantieni credibilita'.",
      informative: "Usa un tono informativo e didattico, condividi dati e insight utili.",
      engaging: "Usa un tono coinvolgente e dinamico, stimola interazione e commenti.",
      authoritative: "Usa un tono autorevole e deciso, posizionati come esperti del settore.",
      casual: "Usa un tono informale e spontaneo, come un consiglio tra amici.",
      inspirational: "Usa un tono motivazionale e ispirante, che incoraggi all'azione.",
    }

    // Pre-load contents from last 60 days for same topic to avoid duplicates
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const { data: recentPosts } = await admin
      .from("social_posts")
      .select("content")
      .eq("ai_topic", rule.topic_name)
      .gte("created_at", sixtyDaysAgo.toISOString())
      .not("content", "is", null)
    const previousContents: string[] = (recentPosts || []).map((p: { content: string }) => p.content)

    // Generate posts
    const generatedPosts = []

    console.log("[v0] Starting generation loop, slots:", slots.length)

    for (let i = 0; i < toGenerate; i++) {
      try {
        console.log(`[v0] Generating post ${i + 1}/${toGenerate} for "${rule.topic_name}"`)
        // Generate text
        const prompt = `Sei il social media manager di 4BID, una societa' italiana specializzata in:
- Revenue Management per hotel
- Consulenza nel settore hospitality
- Sviluppo di prodotti tecnologici innovativi come Hotel Accelerator, Manubot, Santaddeo

Contesto aziendale:
${knowledgeContext}

Genera un post UNICO e ORIGINALE per i social media su questo argomento: "${rule.topic_name}"

Requisiti:
- ${toneInstructions[rule.tone] || toneInstructions.professional}
- Lunghezza: 150-280 caratteri (ottimale per engagement)
- Deve essere DIVERSO dai seguenti post gia' generati: ${generatedPosts.map(p => `"${p.content?.substring(0, 50)}..."`).join(", ") || "nessuno"}
- Deve incuriosire e generare interazione
- Puo' includere una domanda o call-to-action
- Scrivi in italiano
- Questo e' il post numero ${i + 1} di ${toGenerate}, varia stile e angolo
${rule.include_hashtags ? `- Aggiungi 3-5 hashtag pertinenti alla fine, includi: ${rule.default_hashtags?.join(" ") || "#4BID #RevenueManagement"}` : "- Non includere hashtag"}

Rispondi SOLO con il testo del post, senza introduzioni o spiegazioni.`

        const { text } = await generateText({
          model: "anthropic/claude-sonnet-4-20250514",
          prompt,
          maxTokens: 500,
          temperature: 0.8, // Higher for variety across batch
        })

        const content = text.trim()
        console.log(`[v0] AI generated text (${content.length} chars):`, content.substring(0, 80))

        // Dedup: skip if too similar to any post of same topic in last 60 days + current batch
        const normalizedContent = content.toLowerCase().replace(/[^a-z0-9]/g, "")
        const isDuplicate = previousContents.some(prev => {
          const normalizedPrev = prev.toLowerCase().replace(/[^a-z0-9]/g, "")
          const shorter = Math.min(normalizedContent.length, normalizedPrev.length)
          let matches = 0
          for (let j = 0; j < shorter; j++) {
            if (normalizedContent[j] === normalizedPrev[j]) matches++
          }
          return shorter > 0 && matches / shorter > 0.6
        })

        if (isDuplicate) {
          console.error(`[v0] Skipping duplicate post for ${rule.topic_name}`)
          continue
        }

        // Generate image
        let imageUrl = null
        try {
          const falResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
            method: "POST",
            headers: {
              Authorization: `Key ${process.env.FAL_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: `${rule.image_style_prompt || "professional social media post"}, high quality, modern design`,
              image_size: "landscape_16_9",
              num_images: 1,
            }),
          })

          if (falResponse.ok) {
            const falData = await falResponse.json()
            imageUrl = falData.images?.[0]?.url || null
          }
        } catch (imgErr) {
          console.error("[v0] Image generation failed for post", i, imgErr)
        }

        // Build hashtags string
        const hashtagsArray = rule.include_hashtags && rule.default_hashtags?.length
          ? rule.default_hashtags
          : []

        // Insert post
        const { data: post, error: postError } = await admin
          .from("social_posts")
          .insert({
            content,
            image_url: imageUrl,
            link_url: rule.link_url || null,
            platforms: rule.platforms || ["facebook", "linkedin"],
            target_accounts: rule.target_accounts || [],
            status: "pending_approval",
            scheduled_for: slots[i]?.scheduledFor.toISOString() || null,
            is_ai_generated: true,
            ai_topic: rule.topic_name,
            hashtags: hashtagsArray,
            auto_publish: false,
            requires_approval: true,
            media_priority: imageUrl ? "image" : "link",
          })
          .select()
          .single()

        if (postError) {
          console.error("[v0] Error inserting post:", postError)
          continue
        }

        previousContents.push(content)
        generatedPosts.push(post)
      } catch (genErr) {
        console.error("[v0] Error generating post", i, genErr)
        continue
      }
    }

    return NextResponse.json({
      message: `Generati ${generatedPosts.length} post per "${rule.topic_name}"`,
      generated: generatedPosts.length,
      posts: generatedPosts,
    })
  } catch (error) {
    console.error("[v0] Error in topic generate:", error)
    return NextResponse.json({ error: "Errore nella generazione" }, { status: 500 })
  }
}
