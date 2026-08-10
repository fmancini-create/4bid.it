import Link from "next/link"
import { PlayCircle, ArrowRight } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { YoutubeFacade } from "@/components/video/youtube-facade"
import { VideoObjectSchema, type VideoSchemaItem } from "@/components/video/video-object-schema"

/**
 * Embed di video a tema per le landing page.
 *
 * Passa uno o piu' `tags`: mostra i video visibili che hanno almeno uno di quei
 * tag (assegnati dall'admin in /admin/video). Data-driven: per abbinare un
 * video a una landing basta taggarlo, senza toccare il codice della landing.
 *
 * Server component: non renderizza nulla se non ci sono video con quei tag,
 * cosi' la landing resta pulita finche' non c'e' un video pertinente.
 *
 * Esempio d'uso in una landing:
 *   <LandingVideos tags={["revpar"]} title="Guarda come si ottimizza il RevPAR" />
 */

interface VideoRow {
  id: string
  video_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  published_at: string | null
}

export async function LandingVideos({
  tags,
  title = "Video di approfondimento",
  subtitle,
  limit = 2,
  className = "",
}: {
  tags: string[]
  title?: string
  subtitle?: string
  limit?: number
  className?: string
}) {
  const normalized = tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
  if (normalized.length === 0) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("youtube_videos")
    .select("id, video_id, title, description, thumbnail_url, published_at")
    .eq("hidden", false)
    .overlaps("tags", normalized)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error("[LandingVideos] Errore lettura:", error.message)
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
    <section className={`py-12 md:py-16 ${className}`} aria-labelledby="landing-video-heading">
      <VideoObjectSchema videos={schemaItems} />
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B9BD5]">
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
            Video
          </span>
          <h2 id="landing-video-heading" className="mt-2 text-2xl md:text-3xl font-semibold text-foreground text-balance">
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-pretty">{subtitle}</p>}
        </div>

        <div className={`grid gap-6 max-w-4xl mx-auto ${videos.length > 1 ? "md:grid-cols-2" : ""}`}>
          {videos.map((v) => (
            <article key={v.id} className="flex flex-col">
              <YoutubeFacade videoId={v.video_id} title={v.title} thumbnailUrl={v.thumbnail_url} />
              <h3 className="mt-3 text-base font-semibold text-foreground leading-snug text-pretty">{v.title}</h3>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/video-guide"
            className="inline-flex items-center gap-1.5 font-medium text-[#5B9BD5] hover:gap-2.5 transition-all"
          >
            Altre video guide
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
