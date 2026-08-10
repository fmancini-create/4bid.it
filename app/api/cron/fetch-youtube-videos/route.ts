import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { fetchChannelVideos } from "@/lib/videos/youtube"

/**
 * CRON: Video guide
 *
 * Ogni giorno legge il feed RSS pubblico del canale YouTube di 4BID e importa i
 * nuovi video nella tabella youtube_videos. I video del proprio canale sono
 * affidabili, quindi vengono mostrati automaticamente sul sito (nessuna
 * moderazione). Le modifiche manuali fatte dall'admin (hidden / featured /
 * tags / sort_order) NON vengono mai sovrascritte: i video gia' presenti sono
 * ignorati (insert on conflict do nothing su video_id).
 *
 * Schedulato giornalmente in vercel.json. Triggerabile manualmente con header
 * x-cron-secret o Authorization: Bearer <CRON_SECRET>.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function handler(request: Request) {
  const cronSecret =
    request.headers.get("x-cron-secret") || request.headers.get("authorization")?.replace("Bearer ", "")
  const isVercelCron =
    request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")
  const isManuallyAuthorized = cronSecret === process.env.CRON_SECRET
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev && !isVercelCron && !isManuallyAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stats = { fetched: 0, inserted: 0, duplicates: 0, errors: [] as string[] }

  try {
    const supabase = createAdminClient()
    const { items, error } = await fetchChannelVideos()
    if (error) stats.errors.push(error)
    stats.fetched = items.length

    for (const v of items) {
      // onConflict video_id + ignoreDuplicates: inserisce solo i video nuovi,
      // lasciando intatti quelli gia' presenti (e le loro modifiche manuali).
      const { data, error: insErr } = await supabase
        .from("youtube_videos")
        .upsert(
          {
            video_id: v.videoId,
            title: v.title,
            description: v.description,
            thumbnail_url: v.thumbnailUrl,
            published_at: v.publishedAt,
            source: "youtube",
          },
          { onConflict: "video_id", ignoreDuplicates: true },
        )
        .select("id")

      if (insErr) {
        stats.errors.push(`${v.videoId}: ${insErr.message}`)
      } else if (data && data.length > 0) {
        stats.inserted++
      } else {
        stats.duplicates++
      }
    }

    if (stats.inserted > 0) {
      revalidatePath("/video-guide")
      revalidatePath("/")
    }

    console.log("[YouTubeVideos] Completato:", stats)
    return NextResponse.json({ success: true, ...stats })
  } catch (error: any) {
    console.error("[YouTubeVideos] Errore fatale:", error)
    return NextResponse.json({ success: false, ...stats, fatal: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handler(request)
}

export async function POST(request: Request) {
  return handler(request)
}
