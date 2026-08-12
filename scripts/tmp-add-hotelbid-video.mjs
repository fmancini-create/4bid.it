// Script una volta sola: aggiunge il video storico HotelBid (WHR 2012 Roma)
// alla tabella youtube_videos come voce manuale.
import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, key, { auth: { persistSession: false } })

const videoId = "2GKqq1FhH4o"

const { data: existing } = await admin.from("youtube_videos").select("id").eq("video_id", videoId).maybeSingle()
if (existing) {
  console.log("[v0] Video già presente:", existing.id)
  process.exit(0)
}

const { data, error } = await admin
  .from("youtube_videos")
  .insert({
    video_id: videoId,
    title: "WHR 2012 Roma: intervista a Filippo Mancini su HotelBid",
    description:
      "Intervista a Filippo Mancini al WHR Destination Italy 2012 di Roma: nasce HotelBid, il primo portale italiano ad aste per le prenotazioni alberghiere e l'esperienza che ha portato a 4BID.",
    thumbnail_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    // Data esatta di pubblicazione non esposta da YouTube per questo video:
    // lasciata a null (non inventiamo una uploadDate nello schema VideoObject).
    published_at: null,
    source: "manual",
    hidden: false,
    featured: false,
    sort_order: 0,
    tags: ["hotelbid", "intervista", "storia"],
  })
  .select("id, video_id, title")
  .single()

if (error) {
  console.error("[v0] Errore inserimento:", error.message)
  process.exit(1)
}
console.log("[v0] Inserito:", data)
