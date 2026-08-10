import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { fetchChannelVideos, parseYoutubeId, thumbnailFor } from "@/lib/videos/youtube"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

/** Rigenera le superfici pubbliche cosi' le modifiche compaiono subito. */
function revalidatePublic() {
  revalidatePath("/video-guide")
  revalidatePath("/")
}

/** Verifica che la richiesta provenga dal super admin loggato. */
async function assertSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return Boolean(user && user.email === SUPER_ADMIN_EMAIL)
}

/** Normalizza un array di tag (minuscolo, senza spazi/duplicati/vuoti). */
function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const set = new Set<string>()
  for (const t of input) {
    if (typeof t !== "string") continue
    const clean = t.trim().toLowerCase()
    if (clean) set.add(clean)
  }
  return [...set]
}

// GET: elenco completo dei video per il pannello admin
export async function GET() {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("youtube_videos")
    .select("id, video_id, title, description, thumbnail_url, published_at, source, hidden, featured, sort_order, tags")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ videos: data || [] })
}

// PATCH: modifica un video { id, updates?: {hidden,featured,sort_order,tags}, action?: "delete" }
export async function PATCH(request: Request) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const id = body?.id as string | undefined
  if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 })

  const admin = createAdminClient()

  if (body?.action === "delete") {
    const { error } = await admin.from("youtube_videos").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePublic()
    return NextResponse.json({ success: true })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const u = body?.updates || {}
  if (typeof u.hidden === "boolean") updates.hidden = u.hidden
  if (typeof u.featured === "boolean") updates.featured = u.featured
  if (typeof u.sort_order === "number" && Number.isFinite(u.sort_order)) updates.sort_order = Math.trunc(u.sort_order)
  if ("tags" in u) updates.tags = normalizeTags(u.tags)

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "Nessuna modifica valida" }, { status: 400 })
  }

  const { error } = await admin.from("youtube_videos").update(updates).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePublic()
  return NextResponse.json({ success: true })
}

// PUT: aggiunta MANUALE di un video tramite URL/ID YouTube { url, title?, tags? }
export async function PUT(request: Request) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const url = (body?.url as string | undefined)?.trim()
  if (!url) return NextResponse.json({ error: "URL o ID del video obbligatorio" }, { status: 400 })

  const videoId = parseYoutubeId(url)
  if (!videoId) return NextResponse.json({ error: "URL/ID YouTube non valido" }, { status: 400 })

  const title = (body?.title as string | undefined)?.trim() || `Video ${videoId}`
  const tags = normalizeTags(body?.tags)

  const admin = createAdminClient()
  const { error } = await admin.from("youtube_videos").insert({
    video_id: videoId,
    title,
    thumbnail_url: thumbnailFor(videoId),
    published_at: new Date().toISOString(),
    source: "manual",
    tags,
  })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Questo video è già presente" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePublic()
  return NextResponse.json({ success: true })
}

// POST: sincronizza subito dal feed del canale (importa i nuovi video)
export async function POST() {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  try {
    const { items, error } = await fetchChannelVideos()
    if (error && items.length === 0) {
      return NextResponse.json({ error }, { status: 502 })
    }

    let inserted = 0
    for (const v of items) {
      const { data, error: insErr } = await admin
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
      if (!insErr && data && data.length > 0) inserted++
    }

    if (inserted > 0) revalidatePublic()
    return NextResponse.json({ success: true, found: items.length, inserted })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore durante la sincronizzazione" },
      { status: 500 },
    )
  }
}
