import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export const maxDuration = 30

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string | null) || "ecomobility"

    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 })
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato non valido. Usa JPG, PNG, WEBP o GIF." },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Immagine troppo grande (max 5MB)" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "")
    const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(path, file, {
      access: "public",
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading image:", error)
    return NextResponse.json({ error: "Errore durante il caricamento" }, { status: 500 })
  }
}
