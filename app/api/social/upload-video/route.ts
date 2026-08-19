import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { MAX_VIDEO_BYTES, validateVideoUpload } from "@/lib/social/video"

// Un video e' molto piu' grande di un'immagine: il caricamento richiede tempo.
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    // Stessa guardia della pubblicazione: caricare un file nel blob del progetto
    // non e' un'operazione pubblica.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 })
    }

    // La validazione vive in lib/social/video.ts: stesse regole che userA
    // l'interfaccia, cosi' il messaggio non puo' divergere fra client e server.
    const errore = validateVideoUpload({ size: file.size, type: file.type, name: file.name })
    if (errore) {
      return NextResponse.json({ error: errore }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4"
    const path = `social/video/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(path, file, {
      access: "public",
      contentType: file.type || "video/mp4",
    })

    console.log("[v0] Video social caricato:", blob.url, file.size, "byte")
    return NextResponse.json({ url: blob.url, size: file.size, limite: MAX_VIDEO_BYTES })
  } catch (error) {
    console.error("[v0] Errore caricamento video social:", error)
    return NextResponse.json({ error: "Errore durante il caricamento del video" }, { status: 500 })
  }
}
