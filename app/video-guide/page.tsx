import type { Metadata } from "next"
import { Youtube, PlayCircle } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { VideoObjectSchema, type VideoSchemaItem } from "@/components/video/video-object-schema"
import { YoutubeFacade } from "@/components/video/youtube-facade"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { YOUTUBE_CHANNEL_URL } from "@/lib/videos/youtube"

export const metadata: Metadata = {
  title: "Video guide - Revenue management e tecnologia per hotel | 4BID",
  description:
    "Video guide, tutorial e approfondimenti di 4BID su revenue management, pricing, prenotazioni dirette e tecnologia per hotel. Guarda i video del nostro canale.",
  keywords:
    "video revenue management hotel, tutorial revenue management, video 4bid, guide hotel, formazione revenue management video",
  alternates: { canonical: "https://www.4bid.it/video-guide" },
  openGraph: {
    title: "Video guide | 4BID",
    description:
      "Video, tutorial e approfondimenti su revenue management, pricing e tecnologia per hotel dal canale di 4BID.",
    url: "https://www.4bid.it/video-guide",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
  },
  robots: { index: true, follow: true },
}

// Rivalida ogni ora: i video cambiano di rado (il cron importa una volta al giorno).
export const revalidate = 3600

interface VideoRow {
  id: string
  video_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  published_at: string | null
  featured: boolean
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

export default async function VideoGuidePage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("youtube_videos")
    .select("id, video_id, title, description, thumbnail_url, published_at, featured")
    .eq("hidden", false)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(120)

  if (error) {
    console.error("[VideoGuide] Errore lettura:", error.message)
  }

  const videos: VideoRow[] = data || []
  const schemaItems: VideoSchemaItem[] = videos.map((v) => ({
    videoId: v.video_id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnail_url,
    uploadDate: v.published_at,
  }))

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="CollectionPage"
        title="Video guide 4BID"
        description="Video, tutorial e approfondimenti su revenue management e tecnologia per hotel."
        url="https://www.4bid.it/video-guide"
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Video guide", url: "https://www.4bid.it/video-guide" },
        ]}
        hasParts={videos.map((v) => ({
          name: v.title,
          url: `https://www.youtube.com/watch?v=${v.video_id}`,
        }))}
      />
      <VideoObjectSchema videos={schemaItems} />
      <Header />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Video guide", href: "/video-guide" },
        ]}
      />

      <main>
        {/* Hero */}
        <section className="bg-[#1B3A5B] text-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
              <Youtube className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-balance">Video guide</h1>
            <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-pretty">
              Tutorial, approfondimenti e casi reali su revenue management, pricing e tecnologia per hotel. Direttamente
              dal canale YouTube di 4BID.
            </p>
            <a
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              <Youtube className="h-5 w-5" aria-hidden="true" />
              Iscriviti al canale
            </a>
          </div>
        </section>

        {/* Griglia video */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            {videos.length === 0 ? (
              <div className="max-w-xl mx-auto text-center py-16">
                <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-foreground">Nessun video al momento</h2>
                <p className="mt-2 text-muted-foreground text-pretty">
                  Stiamo pubblicando nuovi contenuti sul nostro canale. Torna presto per guardare le nostre video guide.
                </p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                {videos.map((v) => {
                  const date = formatDate(v.published_at)
                  return (
                    <article key={v.id} className="flex flex-col">
                      <YoutubeFacade videoId={v.video_id} title={v.title} thumbnailUrl={v.thumbnail_url} />
                      <h2 className="mt-4 text-lg font-semibold text-foreground leading-snug text-pretty">
                        {v.title}
                      </h2>
                      {v.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 text-pretty">{v.description}</p>
                      )}
                      {date && <span className="mt-2 text-xs text-muted-foreground">{date}</span>}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
