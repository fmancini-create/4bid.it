import { generateText } from "ai"
import * as fal from "@fal-ai/serverless-client"
import { put } from "@vercel/blob"
import type { SupabaseClient } from "@supabase/supabase-js"

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY })
}

export type CampaignRule = {
  id: string
  topic_name: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  frequency_days: number
  batch_size: number
  posts_generated_count: number
  last_generated_at: string | null
  exclude_weekdays: number[] | null
  time_windows: Array<{ start: string; end: string }> | null
  platforms: string[] | null
  target_accounts: string[] | null
  tone: string | null
  include_hashtags: boolean | null
  default_hashtags: string[] | null
  link_url: string | null
  image_style_prompt: string | null
  min_queue_pending: number | null
  auto_publish: boolean
  notes: string | null
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Tono professionale, autorevole, orientato a business.",
  casual: "Tono amichevole e accessibile, conversazionale.",
  inspirational: "Tono motivazionale e ispirante.",
}

/**
 * Decide se la campagna deve essere eseguita ora.
 * Verifica: attiva, range start_date/end_date, weekday non escluso, cadenza rispettata.
 */
export function shouldRunCampaign(rule: CampaignRule, now = new Date()): { run: boolean; reason: string } {
  if (!rule.is_active) return { run: false, reason: "inactive" }

  const today = now.toISOString().slice(0, 10)
  if (rule.start_date && today < rule.start_date) return { run: false, reason: "before_start_date" }
  if (rule.end_date && today > rule.end_date) return { run: false, reason: "after_end_date" }

  const weekday = now.getDay() // 0=Sun..6=Sat
  if (rule.exclude_weekdays?.includes(weekday)) return { run: false, reason: "excluded_weekday" }

  if (rule.last_generated_at) {
    const last = new Date(rule.last_generated_at)
    const daysSince = (now.getTime() - last.getTime()) / 86400000
    if (daysSince < rule.frequency_days) {
      return { run: false, reason: `not_due_yet (${daysSince.toFixed(1)}/${rule.frequency_days}d)` }
    }
  }
  return { run: true, reason: "due" }
}

/**
 * Calcola lo slot orario per il prossimo post: prende un orario casuale da time_windows
 * e proietta sulla data corrente. Se l'orario e' gia' passato oggi, sposta a domani.
 * Per il post N>1 di un batch, lo schedula a +1 giorno per ogni indice (rispettando weekdays esclusi).
 */
export function pickScheduledSlot(
  rule: CampaignRule,
  index: number,
  now = new Date(),
): Date {
  const windows = rule.time_windows || [{ start: "09:00", end: "18:00" }]
  const win = windows[index % windows.length]
  const [sh, sm] = (win.start || "09:00").split(":").map((n) => Number.parseInt(n, 10) || 0)
  const [eh, em] = (win.end || sh === 23 ? "23:30" : `${(sh + 1) % 24}:00`).split(":").map(
    (n) => Number.parseInt(n, 10) || 0,
  )
  const startMin = sh * 60 + sm
  const endMin = Math.max(startMin + 15, eh * 60 + em)
  const minute = Math.floor(startMin + Math.random() * (endMin - startMin))

  const target = new Date(now)
  target.setHours(0, 0, 0, 0)
  // se index>0, sposta in avanti per spalmare il batch su piu' giorni
  if (index > 0) target.setDate(target.getDate() + index)
  // skip excluded weekdays
  let safety = 8
  while (rule.exclude_weekdays?.includes(target.getDay()) && safety-- > 0) {
    target.setDate(target.getDate() + 1)
  }
  target.setHours(0, Math.floor(minute), 0, 0)
  // Fix: setHours sopra azzera i minuti, applica con minuti corretti
  target.setMinutes(Math.floor(minute % 60))
  target.setHours(Math.floor(minute / 60))

  // se la data risultante e' passata, spostala domani
  if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1)
    while (rule.exclude_weekdays?.includes(target.getDay()) && safety-- > 0) {
      target.setDate(target.getDate() + 1)
    }
  }
  return target
}

/**
 * Genera testo del post via AI Gateway (Anthropic Claude).
 */
export async function generatePostText(rule: CampaignRule, knowledgeContext: string): Promise<string> {
  const tone = TONE_INSTRUCTIONS[rule.tone || "professional"] || TONE_INSTRUCTIONS.professional
  const hashtagInstr = rule.include_hashtags && rule.default_hashtags?.length
    ? `- Aggiungi questi hashtag alla fine: ${rule.default_hashtags.join(" ")}`
    : "- Niente hashtag"
  const linkInstr = rule.link_url ? `- Includi un invito a visitare ${rule.link_url}` : ""

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `Sei il social media manager esperto di 4BID, holding italiana che sviluppa software gestionali e di Revenue Management per il turismo (santaddeo.com, hotelprofitai.com, manubot.it, hotelaccelerator.com).

${knowledgeContext ? `Contesto interno (da knowledge base):\n${knowledgeContext}\n\n` : ""}Genera un post per social media (Facebook + LinkedIn) sull'argomento della campagna:
"${rule.topic_name}"

${rule.notes ? `Note specifiche per questa campagna: ${rule.notes}\n` : ""}
Requisiti:
- ${tone}
- 180-280 caratteri (escluso link e hashtag)
- Deve incuriosire e generare interazione (apertura forte + insight + call to action)
- Scrivi in italiano
${linkInstr}
${hashtagInstr}

Rispondi SOLO con il testo del post, senza prefissi tipo "Ecco il post:".`,
    maxOutputTokens: 600,
  })
  return text.trim()
}

/**
 * Genera l'immagine via fal.ai e la salva su Vercel Blob (URL persistente).
 * Ritorna null se image_style_prompt e' vuoto o se la generazione fallisce.
 */
export async function generatePostImage(rule: CampaignRule): Promise<string | null> {
  if (!rule.image_style_prompt || !process.env.FAL_KEY) return null
  try {
    const prompt = `${rule.topic_name}. ${rule.image_style_prompt}. high quality, social media post image, 4K, detailed, no text overlay, suitable for business social media`
    const result = (await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
      },
    })) as { images?: { url: string }[] }
    const url = result.images?.[0]?.url
    if (!url) return null

    if (!process.env.BLOB_READ_WRITE_TOKEN) return url
    try {
      const r = await fetch(url)
      if (!r.ok) return url
      const blob = await r.blob()
      const out = await put(
        `social-media/campaign-${rule.id}-${Date.now()}.jpg`,
        blob,
        { access: "public", contentType: "image/jpeg" },
      )
      return out.url
    } catch (e) {
      console.error("[v0] campaign image blob upload failed:", e instanceof Error ? e.message : e)
      return url
    }
  } catch (e) {
    console.error("[v0] campaign image generation failed:", e instanceof Error ? e.message : e)
    return null
  }
}

/**
 * Esegue 1 campagna: genera batch_size post, ognuno con immagine se richiesta,
 * e li inserisce in social_posts come "scheduled".
 * Ritorna i post creati e aggiorna last_generated_at + posts_generated_count sulla rule.
 */
export async function runCampaign(
  supabase: SupabaseClient,
  rule: CampaignRule,
): Promise<{ created: number; skipped: number; errors: string[]; postIds: string[] }> {
  const errors: string[] = []
  const postIds: string[] = []

  // knowledge base context (condiviso fra tutti i post del batch)
  let knowledgeContext = ""
  try {
    const { data: knowledge } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("is_active", true)
      .limit(5)
    knowledgeContext = knowledge?.map((k: any) => `${k.title}: ${k.content}`).join("\n") || ""
  } catch {
    // ignore: knowledge base optional
  }

  const batch = Math.max(1, Math.min(rule.batch_size || 1, 10))
  const platforms = rule.platforms?.length ? rule.platforms : ["facebook", "linkedin"]
  const now = new Date()

  let created = 0
  for (let i = 0; i < batch; i++) {
    try {
      const text = await generatePostText(rule, knowledgeContext)
      const imageUrl = await generatePostImage(rule)
      const scheduledFor = pickScheduledSlot(rule, i, now)
      const hashtags = text.match(/#\w+/g) || rule.default_hashtags || []

      const insertPayload = {
        content: text,
        platforms,
        target_accounts: rule.target_accounts || [],
        status: rule.auto_publish ? "scheduled" : "pending_approval",
        is_ai_generated: true,
        ai_topic: rule.topic_name,
        campaign_rule_id: rule.id,
        scheduled_for: scheduledFor.toISOString(),
        auto_publish: rule.auto_publish,
        requires_approval: !rule.auto_publish,
        hashtags,
        image_url: imageUrl,
        post_type: imageUrl ? "image" : "text",
        link_url: rule.link_url,
        // social_posts_media_priority_check: ammesso 'image' / 'video' / 'link'.
        // Niente "text": fallback su "link" se c'e' link_url, altrimenti "image".
        media_priority: imageUrl ? "image" : rule.link_url ? "link" : "image",
      }

      // Insert + readback. Tolleriamo il caso in cui il readback fallisca
      // (es. RLS o trigger di mutazione): se l'INSERT non ha errori, conta come created.
      const ins = await supabase.from("social_posts").insert(insertPayload).select("id")
      if (ins.error) {
        console.error(`[v0] campaign ${rule.topic_name} post #${i + 1} insert error:`, ins.error.message)
        errors.push(`post #${i + 1}: ${ins.error.message}`)
      } else {
        const id = ins.data?.[0]?.id
        if (id) postIds.push(id)
        created++
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error"
      console.error(`[v0] campaign ${rule.topic_name} post #${i + 1} thrown:`, msg)
      errors.push(`post #${i + 1}: ${msg}`)
    }
  }

  // tick the rule
  await supabase
    .from("social_topic_rules")
    .update({
      last_generated_at: now.toISOString(),
      posts_generated_count: rule.posts_generated_count + created,
      updated_at: now.toISOString(),
    })
    .eq("id", rule.id)

  return { created, skipped: batch - created, errors, postIds }
}
