import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Youtube } from "lucide-react"
import { YoutubeVideosManager, type YoutubeVideo } from "@/components/admin/youtube-videos-manager"
import { YOUTUBE_CHANNEL_URL } from "@/lib/videos/youtube"

export const metadata: Metadata = {
  title: "Video guide - Gestione | Admin 4BID.IT",
  description: "Gestisci i video YouTube mostrati sul sito",
}

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export const dynamic = "force-dynamic"

export default async function AdminVideoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-destructive">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from("youtube_videos")
    .select("id, video_id, title, description, thumbnail_url, published_at, source, hidden, featured, sort_order, tags")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })

  const videos = (data || []) as YoutubeVideo[]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Torna al pannello admin
        </Link>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-[#2C3E50]">
              <Youtube className="h-7 w-7 text-red-600" />
              Video guide
            </h1>
            <p className="text-gray-600">Video del canale YouTube importati automaticamente e mostrati sul sito</p>
          </div>
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#5B9BD5] hover:underline"
          >
            Apri il canale YouTube →
          </a>
        </div>

        <YoutubeVideosManager initialVideos={videos} />
      </div>
    </div>
  )
}
