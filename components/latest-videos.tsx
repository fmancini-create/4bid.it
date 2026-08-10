import Link from "next/link"
import { Youtube, ArrowRight } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { YoutubeFacade } from "@/components/video/youtube-facade"
import { VideoObjectSchema, type VideoSchemaItem } from "@/components/video/video-object-schema"

/**
 * Fascia "Ultimi video" per la homepage: mostra i video in evidenza (featured)
 * per primi, poi i piu' recenti. Server component: legge da Supabase e non
 * renderizza nulla se non ci sono video visibili (nessuna sezione vuota).
 */

interface VideoRow {
  id: string
  video_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  published_at: string | null
}

export async function LatestVideos({ limit = 3 }: { limit?: number }) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("youtube_videos")
    .select("id, video_id, title, description, thumbnail_url, published_at")
    .eq("hidden", false)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error("[LatestVideos] Errore lettura:", error.message)
    return null
  }

  const videos: VideoRow[] = data || []
  if (videos.length === 0) return null

  const schemaItems: VideoSchemaItem[] = videos.map((v) => ({
    videoId: v.video_id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnail_url,
    uploadDate: v.published_at,
  }))

  return (
    <section className="py-16 md:py-24 bg-muted/40" aria-labelledby="ultimi-video-heading">
      <VideoObjectSchema videos={schemaItems} />
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
              <Youtube className="h-5 w-5" aria-hidden="true" />
              Dal nostro canale
            </span>
            <h2 id="ultimi-video-heading" className="mt-2 text-3xl md:text-4xl font-semibold text-foreground text-balance">
              Ultimi video
            </h2>
            <p className="mt-2 text-muted-foreground max-w-xl text-pretty">
              Tutorial e approfondimenti su revenue management, pricing e tecnologia per hotel.
            </p>
          </div>
          <Link
            href="/video-guide"
            className="inline-flex items-center gap-1.5 font-medium text-[#5B9BD5] hover:gap-2.5 transition-all"
          >
            Tutte le video guide
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <article key={v.id} className="flex flex-col">
              <YoutubeFacade videoId={v.video_id} title={v.title} thumbnailUrl={v.thumbnail_url} />
              <h3 className="mt-4 text-lg font-semibold text-foreground leading-snug text-pretty">{v.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
