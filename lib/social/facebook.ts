import crypto from "crypto"

const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!

// Genera l'appsecret_proof richiesto da Facebook
export function generateAppSecretProof(accessToken: string): string {
  return crypto.createHmac("sha256", FACEBOOK_APP_SECRET).update(accessToken).digest("hex")
}

// Pubblica un post su una pagina Facebook
export async function publishToFacebook(
  pageId: string,
  accessToken: string,
  content: string,
  linkUrl?: string | null,
  imageUrl?: string | null,
  mediaPriority: "image" | "link" = "image",
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    console.log("[v0] Facebook: Starting publish")
    console.log("[v0] Facebook: Page ID:", pageId)
    console.log("[v0] Facebook: Token length:", accessToken?.length || 0)
    console.log("[v0] Facebook: Content length:", content?.length || 0)
    console.log("[v0] Facebook: Link URL:", linkUrl || "none")
    console.log("[v0] Facebook: Image URL:", imageUrl || "none")
    console.log("[v0] Facebook: Media Priority:", mediaPriority)

    if (!pageId) {
      return { success: false, error: "Page ID mancante" }
    }

    if (!accessToken) {
      return { success: false, error: "Access token mancante" }
    }

    const appSecretProof = generateAppSecretProof(accessToken)

    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`
    let message = content

    // If mediaPriority is "image" and we have an image, publish as photo with link in text
    // If mediaPriority is "link" or no image, use link preview
    const body: Record<string, string> = {
      access_token: accessToken,
      appsecret_proof: appSecretProof,
    }

    if (imageUrl && mediaPriority === "image") {
      // Priorità immagine: pubblica come foto, aggiungi link nel testo
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`
      body.url = imageUrl
      // Aggiungi il link nel messaggio se presente
      if (linkUrl) {
        message = `${content}\n\n🔗 ${linkUrl}`
      }
      body.message = message
      console.log("[v0] Facebook: Publishing as PHOTO with link in text")
    } else if (linkUrl) {
      // Priorità link o nessuna immagine: usa anteprima link
      body.message = content
      body.link = linkUrl
      console.log("[v0] Facebook: Publishing as LINK POST with preview")
    } else if (imageUrl) {
      // Solo immagine, nessun link
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`
      body.url = imageUrl
      body.message = content
      console.log("[v0] Facebook: Publishing as PHOTO only")
    } else {
      // Solo testo
      body.message = content
      console.log("[v0] Facebook: Publishing as TEXT only")
    }

    console.log("[v0] Facebook: Endpoint:", endpoint)
    console.log("[v0] Facebook: Request body keys:", Object.keys(body))

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body),
    })

    const data = await response.json()

    console.log("[v0] Facebook API response status:", response.status)
    console.log("[v0] Facebook API response:", JSON.stringify(data))

    if (data.error) {
      console.error("[v0] Facebook API error:", data.error)
      return { success: false, error: data.error.message || JSON.stringify(data.error) }
    }

    console.log("[v0] Facebook: Successfully published! Post ID:", data.id || data.post_id)
    return { success: true, postId: data.id || data.post_id }
  } catch (error) {
    console.error("[v0] Facebook publish error:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Pubblica un VIDEO nativo su una pagina Facebook.
 *
 * Endpoint dedicato `/videos`: diverso da `/feed` (testo e link) e da `/photos`
 * (immagini). Facebook scarica il file dall'URL che gli passiamo (`file_url`),
 * quindi il video deve essere raggiungibile pubblicamente.
 *
 * Questa funzione e' SEPARATA da publishToFacebook di proposito: il percorso
 * delle foto e dei link resta identico a prima, byte per byte. Un video non
 * passa mai per il ramo delle immagini, cosi' non puo' finire pubblicato come
 * anteprima di un link.
 */
export async function publishVideoToFacebook(
  pageId: string,
  accessToken: string,
  content: string,
  videoUrl: string,
  linkUrl?: string | null,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!pageId) return { success: false, error: "Page ID mancante" }
    if (!accessToken) return { success: false, error: "Access token mancante" }
    if (!videoUrl) return { success: false, error: "URL del video mancante" }

    const appSecretProof = generateAppSecretProof(accessToken)
    // Il link non e' cliccabile nella descrizione di un video: lo aggiungiamo
    // come testo, come si fa per le foto.
    const description = linkUrl ? `${content}\n\n🔗 ${linkUrl}` : content

    console.log("[v0] Facebook: Publishing as NATIVE VIDEO")
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        file_url: videoUrl,
        description,
        access_token: accessToken,
        appsecret_proof: appSecretProof,
      }),
    })

    const data = await response.json()
    console.log("[v0] Facebook video API response status:", response.status)
    console.log("[v0] Facebook video API response:", JSON.stringify(data))

    if (data.error) {
      return { success: false, error: data.error.message || JSON.stringify(data.error) }
    }
    if (!data.id) {
      return { success: false, error: "Facebook non ha restituito l'ID del video" }
    }
    return { success: true, postId: data.id }
  } catch (error) {
    console.error("[v0] Facebook video publish error:", error)
    return { success: false, error: String(error) }
  }
}

// Verifica se un token è valido
export async function verifyFacebookToken(accessToken: string): Promise<boolean> {
  try {
    const appSecretProof = generateAppSecretProof(accessToken)
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
    )
    const data = await response.json()
    console.log("[v0] Facebook token verify response:", data)
    return !data.error
  } catch (err) {
    console.error("[v0] Facebook token verify error:", err)
    return false
  }
}

export const publishToFacebookPage = publishToFacebook
