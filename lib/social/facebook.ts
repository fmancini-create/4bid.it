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
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const appSecretProof = generateAppSecretProof(accessToken)

    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`
    const body: Record<string, string> = {
      message: content,
      access_token: accessToken,
      appsecret_proof: appSecretProof,
    }

    // Se c'è un link, lo aggiungiamo
    if (linkUrl) {
      body.link = linkUrl
    }

    // Se c'è un'immagine, usiamo l'endpoint photos invece
    if (imageUrl && !linkUrl) {
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`
      body.url = imageUrl
    }

    console.log("[v0] Publishing to Facebook:", { pageId, endpoint, hasImage: !!imageUrl, hasLink: !!linkUrl })
    console.log("[v0] Facebook request body keys:", Object.keys(body))

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

    return { success: true, postId: data.id || data.post_id }
  } catch (error) {
    console.error("[v0] Facebook publish error:", error)
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
