import { createAdminClient } from "@/lib/supabase/server-admin"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { generateBatchSchedule } from "@/lib/social/scheduling"

export const maxDuration = 300 // 5 minuti per generare batch multipli

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")
    const isManuallyAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isDev = process.env.NODE_ENV === "development"

    if (!isDev && !isVercelCron && !isManuallyAuthorized) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Check global kill-switch
    const supabase = await createClient()
    const { data: settings } = await supabase.from("social_settings").select("*").single()

    if (!settings?.auto_generate_enabled) {
      return NextResponse.json({ message: "Auto-generation disabled" })
    }

    const admin = createAdminClient()

    // Fetch all active topic rules
    const { data: rules, error: rulesError } = await admin
      .from("social_topic_rules")
      .select("*")
      .eq("is_active", true)

    if (rulesError || !rules || rules.length === 0) {
      return NextResponse.json({ message: "Nessuna regola tema attiva" })
    }

    // Fetch knowledge base once for all topics
    const { data: knowledge } = await admin
      .from("knowledge_base")
      .select("title, content")
      .eq("is_active", true)
      .limit(5)

    const knowledgeContext = knowledge?.map(k => `${k.title}: ${k.content}`).join("\n") || ""

    // Get ALL existing scheduled_for dates for anti-collision (shared across all topics)
    const { data: allScheduled } = await admin
      .from("social_posts")
      .select("scheduled_for")
      .in("status", ["pending_approval", "scheduled"])
      .not("scheduled_for", "is", null)
      .gte("scheduled_for", new Date().toISOString())

    const globalExistingSchedules = (allScheduled || []).map(p => new Date(p.scheduled_for))

    const toneInstructions: Record<string, string> = {
      professional: "Usa un tono professionale e autorevole, adatto al settore hospitality.",
      casual: "Usa un tono amichevole e accessibile, ma mantieni credibilita'.",
      inspirational: "Usa un tono motivazionale e ispirante, che incoraggi all'azione.",
    }

    const results: { topic: string; generated: number; skipped: boolean; reason?: string }[] = []

    for (const rule of rules) {
      // Count existing pending/scheduled posts for this topic
      const { count: existingCount } = await admin
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .eq("ai_topic", rule.topic_name)
        .in("status", ["pending_approval", "scheduled"])
        .gte("scheduled_for", new Date().toISOString())

      const currentQueue = existingCount || 0

      if (currentQueue >= rule.min_queue_pending) {
        results.push({
          topic: rule.topic_name,
          generated: 0,
          skipped: true,
          reason: `Coda sufficiente (${currentQueue}/${rule.min_queue_pending})`,
        })
        continue
      }

      const toGenerate = Math.max(0, rule.batch_size - currentQueue)

      // Get last scheduled_for for this topic
      const { data: lastPost } = await admin
        .from("social_posts")
        .select("scheduled_for")
        .eq("ai_topic", rule.topic_name)
        .not("scheduled_for", "is", null)
        .order("scheduled_for", { ascending: false })
        .limit(1)
        .single()

      const lastScheduledFor = lastPost?.scheduled_for ? new Date(lastPost.scheduled_for) : null

      // Generate batch schedule slots
      const slots = generateBatchSchedule(
        {
          frequency_days: rule.frequency_days,
          time_windows: rule.time_windows || [{ start: "09:30", end: "11:30" }, { start: "15:00", end: "18:00" }],
          exclude_weekdays: rule.exclude_weekdays || [0],
        },
        toGenerate,
        lastScheduledFor,
        globalExistingSchedules,
      )

      // Add new slots to global collision list
      for (const slot of slots) {
        globalExistingSchedules.push(slot.scheduledFor)
      }

      let generatedCount = 0
      // Pre-load contents from last 60 days for same topic to avoid cross-batch duplicates
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      const { data: recentPosts } = await admin
        .from("social_posts")
        .select("content")
        .eq("ai_topic", rule.topic_name)
        .gte("created_at", sixtyDaysAgo.toISOString())
        .not("content", "is", null)
      const previousContents: string[] = (recentPosts || []).map((p: { content: string }) => p.content)

      for (let i = 0; i < toGenerate; i++) {
        try {
          const prompt = `Sei il social media manager di 4BID, societa' italiana specializzata in:
- Revenue Management per hotel
- Consulenza nel settore hospitality
- Sviluppo di prodotti tecnologici innovativi come Hotel Accelerator, Manubot, Santaddeo

Contesto: ${knowledgeContext}

Genera un post UNICO e ORIGINALE su: "${rule.topic_name}"

Requisiti:
- ${toneInstructions[rule.tone] || toneInstructions.professional}
- 150-280 caratteri
- DIVERSO da: ${previousContents.map(c => `"${c.substring(0, 50)}..."`).join(", ") || "nessuno"}
- Post ${i + 1}/${toGenerate}, varia stile e angolo
- Scrivi in italiano
${rule.include_hashtags ? `- Hashtag: ${rule.default_hashtags?.join(" ") || "#4BID"}` : "- Niente hashtag"}

Rispondi SOLO con il testo del post.`

          const { text } = await generateText({
            model: "anthropic/claude-sonnet-4-20250514",
            prompt,
            maxTokens: 500,
            temperature: 0.8,
          })

          const content = text.trim()

          // Dedup: skip if too similar to any post of same topic in last 60 days + current batch
          const normalizedContent = content.toLowerCase().replace(/[^a-z0-9]/g, "")
          const isDuplicate = previousContents.some(prev => {
            const normalizedPrev = prev.toLowerCase().replace(/[^a-z0-9]/g, "")
            // Check if more than 60% of characters overlap
            const shorter = Math.min(normalizedContent.length, normalizedPrev.length)
            let matches = 0
            for (let j = 0; j < shorter; j++) {
              if (normalizedContent[j] === normalizedPrev[j]) matches++
            }
            return shorter > 0 && matches / shorter > 0.6
          })

          if (isDuplicate) {
            console.log(`[v0] Skipping duplicate post for ${rule.topic_name}`)
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
          } catch {
            // Image generation failure is not critical
          }

          const { error: insertError } = await admin
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
              hashtags: rule.include_hashtags ? (rule.default_hashtags || []) : [],
              auto_publish: false,
              requires_approval: true,
              media_priority: imageUrl ? "image" : "link",
            })

          if (!insertError) {
            generatedCount++
            previousContents.push(content)
          }
        } catch (genErr) {
          console.error(`[v0] Error generating post ${i} for ${rule.topic_name}:`, genErr)
        }
      }

      results.push({
        topic: rule.topic_name,
        generated: generatedCount,
        skipped: false,
      })
    }

    // Update global last_auto_generated_at
    if (settings) {
      await supabase
        .from("social_settings")
        .update({ last_auto_generated_at: new Date().toISOString() })
        .eq("id", settings.id)
    }

    return NextResponse.json({
      success: true,
      results,
      totalGenerated: results.reduce((sum, r) => sum + r.generated, 0),
    })
  } catch (error) {
    console.error("[v0] Error in cron generate-social-posts:", error)
    return NextResponse.json({ error: "Errore nella generazione" }, { status: 500 })
  }
}
