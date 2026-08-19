import { describe, it, expect } from "vitest"
import {
  MAX_VIDEO_BYTES,
  canPublish,
  isYoutubeUrl,
  resolveMediaKind,
  validateVideoUpload,
  youtubeThumbnail,
} from "@/lib/social/video"

/**
 * Prove sul giudice unico del tipo di media.
 *
 * Il punto delicato non e' "riconosce un mp4": e' che la MEDESIMA funzione
 * risponda a interfaccia, pubblicazione manuale e cron. Se divergessero,
 * l'anteprima potrebbe promettere un Reel dove il server pubblica un link.
 */
describe("resolveMediaKind", () => {
  it("un file video vince sull'immagine (l'immagine diventa copertina)", () => {
    expect(resolveMediaKind({ videoUrl: "https://blob.vercel-storage.com/a.mp4", imageUrl: "https://x/y.jpg" })).toBe(
      "video",
    )
  })

  it("riconosce il .mov anche con parametri di query nell'indirizzo", () => {
    expect(resolveMediaKind({ videoUrl: "https://blob.vercel-storage.com/a.mov?v=2" })).toBe("video")
  })

  it("un link YouTube NON e' un file video", () => {
    expect(resolveMediaKind({ videoUrl: "https://www.youtube.com/watch?v=abc12345678" })).toBe("youtube")
  })

  it("senza alcun media restituisce null, non 'image'", () => {
    // Un post di solo testo non deve dichiararsi immagine: altrimenti
    // Instagram lo accetterebbe in teoria e fallirebbe in pratica.
    expect(resolveMediaKind({})).toBeNull()
  })

  it("un indirizzo che non e' ne' video ne' youtube non diventa video", () => {
    expect(resolveMediaKind({ videoUrl: "https://example.com/pagina.html" })).toBeNull()
  })
})

describe("isYoutubeUrl / youtubeThumbnail", () => {
  it("accetta youtu.be e youtube.com, rifiuta un dominio che li contiene", () => {
    expect(isYoutubeUrl("https://youtu.be/abc12345678")).toBe(true)
    expect(isYoutubeUrl("https://www.youtube.com/watch?v=abc12345678")).toBe(true)
    // Difesa contro il dominio civetta: "youtube.com.malware.example" NON e' YouTube.
    expect(isYoutubeUrl("https://youtube.com.malware.example/watch?v=x")).toBe(false)
  })

  it("la miniatura si ricava dall'identificativo del video", () => {
    const t = youtubeThumbnail("https://www.youtube.com/watch?v=abc12345678")
    expect(t).toContain("abc12345678")
  })
})

describe("canPublish", () => {
  it("Instagram RIFIUTA un link YouTube dichiarando il perche'", () => {
    const r = canPublish("instagram", "youtube", { hasLink: false })
    expect(r.ok).toBe(false)
    // Il messaggio deve spiegare, non solo negare.
    expect(r.reason).toMatch(/file video|Reel/i)
  })

  it("Instagram accetta un file video (Reel)", () => {
    expect(canPublish("instagram", "video", { hasLink: false }).ok).toBe(true)
  })

  it("Instagram rifiuta un post di solo testo", () => {
    expect(canPublish("instagram", null, { hasLink: false }).ok).toBe(false)
  })

  it("Facebook e LinkedIn accettano il link YouTube", () => {
    expect(canPublish("facebook", "youtube", { hasLink: false }).ok).toBe(true)
    expect(canPublish("linkedin", "youtube", { hasLink: false }).ok).toBe(true)
  })
})

describe("validateVideoUpload", () => {
  it("accetta un mp4 di dimensione normale", () => {
    expect(validateVideoUpload({ size: 5_000_000, type: "video/mp4", name: "clip.mp4" })).toBeNull()
  })

  it("rifiuta un file oltre il limite dichiarando il limite", () => {
    const e = validateVideoUpload({ size: MAX_VIDEO_BYTES + 1, type: "video/mp4", name: "grosso.mp4" })
    expect(e).not.toBeNull()
    expect(e).toMatch(/200/)
  })

  it("rifiuta un ineseguibile travestito da video", () => {
    // Il tipo dichiarato dal browser non basta: conta anche l'estensione.
    expect(validateVideoUpload({ size: 1000, type: "video/mp4", name: "virus.exe" })).not.toBeNull()
  })

  it("rifiuta un'immagine passata al caricamento video", () => {
    expect(validateVideoUpload({ size: 1000, type: "image/jpeg", name: "foto.jpg" })).not.toBeNull()
  })
})
